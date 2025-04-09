import faiss
import json
import numpy as np
import gradio as gr
from whoosh.index import open_dir
from whoosh.qparser import QueryParser
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain_community.llms import LlamaCpp
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document
from langchain.vectorstores import FAISS
from langchain.schema.retriever import BaseRetriever

# Paths
INDEX_PATH = "faiss_index.bin"
METADATA_PATH = "metadata.json"
BM25_INDEX_DIR = "bm25_index"

# Load Embedding Model
embedding_model = HuggingFaceEmbeddings(model_name="NeuML/pubmedbert-base-embeddings")

# Load FAISS Index
index = faiss.read_index(INDEX_PATH)

# Load Metadata
with open(METADATA_PATH, "r", encoding="utf-8") as f:
    metadata = json.load(f)

# Load BM25 Index
bm25_index = open_dir(BM25_INDEX_DIR)

#pipeline missing got to add it

# Load LlamaCpp Model
local_llm = "ggml-model-Q4_K_M.gguf"
llm = LlamaCpp(model_path=local_llm, temperature=0.3, max_tokens=2048, top_p=1, n_ctx=2048)

# Define Prompt Template
prompt_template = """Use the following retrieved context to answer the user's question.
If you don't know the answer, just say you don't know. Don't make up an answer.

Context: {retrieved_chunks}
Chat History: {chat_history}
Question: {question}

Provide a helpful, detailed answer.
Answer:
"""

# Memory for conversation history
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# Custom Hybrid Retriever
class HybridRetriever(BaseRetriever):
    def get_relevant_documents(self, query):
        top_k = 5
        query_vector = np.array([embedding_model.embed_query(query)], dtype=np.float32)
        _, faiss_indices = index.search(query_vector, top_k)

        faiss_results = [list(metadata.keys())[i] for i in faiss_indices[0] if i < len(metadata)]

        with bm25_index.searcher() as searcher:
            parser = QueryParser("content", bm25_index.schema)
            bm25_query = parser.parse(query)
            bm25_results = [hit["content"] for hit in searcher.search(bm25_query, limit=top_k)]

        combined_results = {text: 2 for text in faiss_results}  # Higher weight for FAISS
        for text in bm25_results:
            combined_results[text] = combined_results.get(text, 0) + 1  # Boost if present in both

        sorted_results = sorted(combined_results.keys(), key=lambda x: combined_results[x], reverse=True)[:top_k]

        return [Document(page_content=text) for text in sorted_results]

# Instantiate the custom retriever
retriever = HybridRetriever()

# Create ConversationalRetrievalChain
chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory
)

# Generate Response with Conversational Memory
def chatbot(message, history):  # Accept both message and history
    response = chain.invoke({"question": message, "chat_history": history})
    return response["answer"]

# Launch Gradio Chat Interface
iface = gr.ChatInterface(fn=chatbot)
iface.launch()
