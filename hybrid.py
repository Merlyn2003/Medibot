from flask import Flask, request, jsonify
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
from langchain_community.llms import LlamaCpp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
QDRANT_URL = "http://localhost:6333"
COLLECTION_NAME = "try_db"
EMBEDDING_MODEL = "NeuML/pubmedbert-base-embeddings"
LLM_MODEL_PATH = "ggml-model-Q4_K_M.gguf"  # <- Change this!
INTENT_BOOST = 0.15

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
        self.llm = LlamaCpp(model_path=LLM_MODEL_PATH, temperature=0.3, max_tokens=2048, top_p=1, n_ctx=2048)

        self.qdrant.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="intents",
            field_schema=models.PayloadSchemaType.KEYWORD
        )

    def classify_intents(self, query):
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

    def retrieve_context(self, query):
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
                "source": hit.payload.get("source", "Unknown"),
                "original_score": round(hit.score, 3)
            })
        return sorted(boosted_results, key=lambda x: x["score"], reverse=True), query_intents

    def generate_answer(self, query, context_chunks):
        context_text = "\n".join([f"{i+1}. {chunk['text']}" for i, chunk in enumerate(context_chunks)])
        prompt = f"""You are a helpful medical assistant. Use the following context to answer the query.

Context:
{context_text}

Query: {query}

Answer:"""
        response = self.llm(prompt)
        return response.strip()

retriever = EnhancedMedicalRetriever()

def format_response(results, query_intents):
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
            f"   - Relevance score: {res['score']} (base: {res['original_score']})"
        )
    return "\n".join(response)

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        query = data.get("query")
        if not query:
            return jsonify({"error": "No query provided"}), 400

        results, query_intents = retriever.retrieve_context(query)
        answer = retriever.generate_answer(query, results)
        metadata = format_response(results, query_intents)

        return jsonify({
            "answer": answer,
            "query_intents": query_intents,
            "contexts": results,
            "response_metadata": metadata
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
