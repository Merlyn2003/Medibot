import pandas as pd
from tqdm import tqdm
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
import gradio as gr
from typing import List, Dict
from langchain_community.llms import LlamaCpp
import json
from sklearn.metrics.pairwise import cosine_similarity
import bert_score

# Configuration
QDRANT_URL = "http://localhost:6333"
COLLECTION_NAME = "try_db"
EMBEDDING_MODEL = "NeuML/pubmedbert-base-embeddings"
LLM_MODEL_PATH = "ggml-model-Q4_K_M.gguf"
INTENT_BOOST = 0.15
TEST_DATA_PATH = "test_dataset_with_intents.json"
BERTSCORE_MODEL = "bert-base-uncased"

MEDICAL_INTENTS = [
    "treatment.drug", "treatment.surgery",
    "adverse_effects", "diagnosis.symptoms",
    "diagnosis.tests", "mechanism.pharmacology",
    "general.info"
]

INTENT_RULES = """
1. treatment.drug - Specific medications, dosages, drug therapies
2. treatment.surgery - Surgical procedures, operative techniques
3. adverse_effects - Side effects, complications, risks
4. diagnosis.symptoms - Patient symptoms, clinical presentations
5. diagnosis.tests - Lab tests, imaging studies, diagnostics
6. mechanism.pharmacology - Drug MOA, biochemical processes
7. general.info - Definitions, overviews, basic explanations

EXAMPLES:
- "First-line antibiotics for pneumonia" → treatment.drug
- "How does metformin work?" → mechanism.pharmacology
- "MRI protocol for stroke" → diagnosis.tests
- "What is SMA?" → general.info"""

class EnhancedMedicalRetriever:
    def __init__(self):
        self.embedder = SentenceTransformer(EMBEDDING_MODEL)
        self.qdrant = QdrantClient(QDRANT_URL)
        self.llm = LlamaCpp(
            model_path=LLM_MODEL_PATH, 
            temperature=0.3, 
            max_tokens=2048, 
            n_ctx=2048,
            verbose=False
        )
        
        # Create collection if not exists
        existing_collections = [c.name for c in self.qdrant.get_collections().collections]
        if COLLECTION_NAME not in existing_collections:
            self.qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=self.embedder.get_sentence_embedding_dimension(),
                    distance=models.Distance.COSINE
                )
            )

    def classify_intents(self, query: str) -> List[str]:
        """Use local LLM to classify medical intent"""
        try:
            prompt = f"""Classify the query into 1-2 medical intents using these rules:

{INTENT_RULES}

Query: {query}

Detected Intents (choose from: {', '.join(MEDICAL_INTENTS)}):"""
            response = self.llm(prompt)
            generated = response.lower().strip()
            return list(set(intent for intent in MEDICAL_INTENTS if intent in generated)) or ["general.info"]
        except Exception as e:
            print(f"Intent classification error: {e}")
            return ["general.info"]

    def retrieve_context(self, query: str) -> List[Dict]:
        """Retrieve context and boost scores by intent relevance"""
        query_vector = self.embedder.encode(query).tolist()
        query_intents = self.classify_intents(query)

        results = self.qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=5,
            with_payload=True,
            score_threshold=0.4
        )

        boosted_results = []
        for hit in results:
            chunk_intents = hit.payload.get("intents", [])
            intent_matches = len(set(query_intents) & set(chunk_intents))
            boosted_score = hit.score * (1 + INTENT_BOOST) ** intent_matches

            boosted_results.append({
                "text": hit.payload["text"],
                "score": round(boosted_score, 3),
                "intent_matches": intent_matches,
                "source": hit.payload.get("source", "Unknown")
            })
        return sorted(boosted_results, key=lambda x: x["score"], reverse=True)

    def generate_answer(self, query: str, context_chunks: List[Dict]) -> str:
        """Use local LLM to generate answer from retrieved context"""
        context_text = "\n".join([f"{i+1}. {chunk['text']}" for i, chunk in enumerate(context_chunks)])
        prompt = f"""You are a helpful medical assistant. Use the only the following context to answer the query.
                    Do not generate any answers of your own. If unsure just say that the answer is not known
Context:
{context_text}

Query: {query}

Answer:"""
        response = self.llm(prompt)
        return response.strip()

def load_test_data(json_path: str) -> List[dict]:
    """Load and validate test dataset"""
    with open(json_path) as f:
        test_data = json.load(f)
    
    required_keys = ["question", "reference_answer"]
    for item in test_data:
        if not all(k in item for k in required_keys):
            raise ValueError("Test data missing required keys")
    return test_data

def calculate_faithfulness(answer: str, contexts: List[str], llm: LlamaCpp) -> float:
    """Local LLM-based faithfulness check"""
    if not answer or not contexts:
        return 0.0
    
    prompt = f"""Verify if this answer is fully supported by the contexts:

Answer: {answer}

Contexts:
{chr(10).join([f'- {c}' for c in contexts])}

Respond ONLY with 'Yes' or 'No': 
"""
    
    try:
        response = llm(prompt).strip().lower()
        return 1.0 if 'yes' in response else 0.0
    except:
        return 0.0

# Initialize similarity model once
similarity_model = SentenceTransformer('all-MiniLM-L6-v2')

def calculate_similarity(generated: str, reference: str) -> float:
    """Calculate semantic similarity using local embeddings"""
    emb1 = similarity_model.encode([generated])
    emb2 = similarity_model.encode([reference])
    return cosine_similarity(emb1, emb2)[0][0]

def calculate_bertscore_batch(generateds: List[str], references: List[str]) -> dict:
    """Calculate BERTScore metrics for a batch of texts"""
    P, R, F1 = bert_score.score(
        generateds, 
        references, 
        lang="en",
        model_type=BERTSCORE_MODEL,
        batch_size=8,
        device="cpu"
    )
    return {
        "precision": P.numpy(),
        "recall": R.numpy(),
        "f1": F1.numpy()
    }

def evaluate_rag_system(test_data: List[dict], retriever: EnhancedMedicalRetriever):
    """Full evaluation with BERTScore metrics"""
    # Phase 1: Generate all answers
    all_questions = []
    all_generated = []
    all_references = []
    all_contexts = []
    
    print("Generating answers...")
    for example in tqdm(test_data):
        try:
            contexts = retriever.retrieve_context(example["question"])
            answer = retriever.generate_answer(example["question"], contexts[:3])
            
            all_questions.append(example["question"])
            all_generated.append(answer)
            all_references.append(example["reference_answer"])
            all_contexts.append([c["text"] for c in contexts])
        except Exception as e:
            print(f"Error processing {example['question']}: {str(e)}")
            # Maintain list alignment
            all_questions.append(example["question"])
            all_generated.append("")
            all_references.append("")
            all_contexts.append([])

    # Phase 2: Calculate metrics
    print("Calculating metrics...")
    results = []
    
    # Batch calculate BERTScore
    bert_scores = calculate_bertscore_batch(all_generated, all_references)
    
    # Individual metrics
    for idx in tqdm(range(len(all_questions))):
        try:
            faithfulness = calculate_faithfulness(
                all_generated[idx],
                all_contexts[idx],
                retriever.llm
            )
            
            similarity = calculate_similarity(
                all_generated[idx],
                all_references[idx]
            )
            
            results.append({
                "question": all_questions[idx],
                "faithfulness": faithfulness,
                "semantic_similarity": similarity,
                "bertscore_precision": bert_scores["precision"][idx],
                "bertscore_recall": bert_scores["recall"][idx],
                "bertscore_f1": bert_scores["f1"][idx],
                "generated_answer": all_generated[idx],
                "reference_answer": all_references[idx]
            })
        except Exception as e:
            print(f"Error processing metrics for {all_questions[idx]}: {str(e)}")
    
    return pd.DataFrame(results)

def format_response(results: List[Dict], query_intents: List[str]) -> str:
    """Format response with metadata"""
    response = [
        "### Detected Query Intents:",
        f"{', '.join(query_intents) or 'None detected'}\n",
        "### Most Relevant Contexts:"
    ]
    for idx, res in enumerate(results, 1):
        response.append(
            f"{idx}. {res['text']}\n"
            f"   - Source: {res['source']}\n"
            f"   - Intent matches: {res['intent_matches']}\n"
            f"   - Relevance score: {res['score']}"
        )
    return "\n".join(response)

def chat_interface(query, history):
    """Main chat interface"""
    results = retriever.retrieve_context(query)
    query_intents = retriever.classify_intents(query)
    answer = retriever.generate_answer(query, results)
    metadata = format_response(results, query_intents)
    return f"{answer}\n\n---\n\n{metadata}"

if __name__ == "__main__":
    # Load test data
    try:
        test_data = load_test_data(TEST_DATA_PATH)
        print(f"Loaded {len(test_data)} test cases")
    except Exception as e:
        print(f"Error loading test data: {str(e)}")
        exit()

    # Initialize components
    retriever = EnhancedMedicalRetriever()
    
    # Run evaluation
    df = evaluate_rag_system(test_data, retriever)
    
    # Save and show results
    df.to_csv("evaluation_results.csv", index=False)
    print("\nEvaluation Results:")
    print(f"Average Faithfulness: {df['faithfulness'].mean():.2f}")
    print(f"Average Semantic Similarity: {df['semantic_similarity'].mean():.2f}")
    print(f"BERTScore Precision: {df['bertscore_precision'].mean():.2f}")
    print(f"BERTScore Recall: {df['bertscore_recall'].mean():.2f}")
    print(f"BERTScore F1: {df['bertscore_f1'].mean():.2f}")
    print(f"Processed {len(df)}/{len(test_data)} questions successfully")