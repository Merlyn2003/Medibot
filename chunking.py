import os
import json
import faiss
import numpy as np
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader
from whoosh.index import create_in
from whoosh.fields import Schema, TEXT, ID
from whoosh.qparser import QueryParser

# Paths
INDEX_PATH = "faiss_index.bin"
METADATA_PATH = "metadata.json"
BM25_INDEX_DIR = "bm25_index"

# Load Embedding Model
embedding_model = HuggingFaceEmbeddings(model_name="NeuML/pubmedbert-base-embeddings")

# Load Intent Classification Model
model_name = "microsoft/phi-2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(model_name)
llm_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)

VALID_INTENTS = ["disease_info", "treatment_info", "symptom_info", "cause_info", "general"]

# Intent Classification
def classify_text(text, text_type="query"):
    prompt = f"Classify this medical {text_type} into multiple categories from: {VALID_INTENTS}. Return only valid labels. Text: {text}"
    response = llm_pipeline(prompt, max_new_tokens=50, truncation=True, return_full_text=False)
    categories = response[0]['generated_text'].strip().lower()
    return [label for label in VALID_INTENTS if label in categories] or ["general"]

# Load & Chunk PDFs
def load_and_chunk_documents(directory_path):
    if not os.path.exists(directory_path):
        print("⚠️ Directory not found:", directory_path)
        return []
    loader = DirectoryLoader(directory_path, glob="**/*.pdf", show_progress=True)
    documents = loader.load()
    if not documents:
        print("⚠️ No documents found in directory:", directory_path)
        return []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=70)
    return text_splitter.split_documents(documents)

# Index Chunks in FAISS & BM25
def index_chunks(chunks):
    if not chunks:
        print("⚠️ No chunks to index.")
        return

    vectors = []
    metadata = {}

    # Initialize BM25 Index
    if not os.path.exists(BM25_INDEX_DIR):
        os.mkdir(BM25_INDEX_DIR)
    schema = Schema(id=ID(stored=True), content=TEXT(stored=True))
    ix = create_in(BM25_INDEX_DIR, schema)
    writer = ix.writer()

    for i, chunk in enumerate(chunks):
        text = chunk.page_content.strip()
        if not text:
            continue  # Skip empty chunks

        # Generate embedding & classify
        chunk_vector = embedding_model.embed_query(text)
        vectors.append(chunk_vector)
        intents = classify_text(text, "chunk")

        # Store metadata
        metadata[text] = intents

        # Add chunk to BM25 index
        writer.add_document(id=str(i), content=text)

    # Commit BM25 index
    writer.commit()

    # Store FAISS index
    vectors_np = np.array(vectors, dtype=np.float32)
    index = faiss.IndexFlatL2(vectors_np.shape[1])
    index.add(vectors_np)
    faiss.write_index(index, INDEX_PATH)

    # Save metadata
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("✔️ FAISS & BM25 indexes created successfully!")

if __name__ == "__main__":
    medical_chunks = load_and_chunk_documents(r"C:\Users\merly\OneDrive\Desktop\ARO\healthcare\hi")
    index_chunks(medical_chunks)
