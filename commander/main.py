from sentence_transformers import SentenceTransformer, util
from flask import Flask, request

embedder = SentenceTransformer("all-MiniLM-L6-v2")

corpus = [
    ("GO", "Go, keep moving, continue, walk on, travel"),
    ("TRIP", "Psychedelic trip, funky colors, hallucinations"),
    ("QUIET", "Silence, hush, keep quiet, turn off the music"),
    ("LOUD", "Turn the sound up, make it louder"),
]

corpus_embeddings = embedder.encode_document([text for command, text in corpus], convert_to_tensor=True)

app = Flask(__name__)

headers = {
    "Access-Control-Allow-Origin": "http://localhost:8000",
    "Cache-Control": "max-age=3600",
}

@app.route("/")
def main():
    query = request.args.get("query", None)
    if query is None:
        return "No query provided", 400

    print(f"Getting command for '{query}'")

    query_embedding = embedder.encode_query(query, convert_to_tensor=True)
    [[result]] = util.semantic_search(query_embedding, corpus_embeddings, top_k=1)
    corpus_id = result.get("corpus_id")

    if corpus_id is None:
        return "Oops", 500

    print(f"Returning '{corpus[corpus_id]}'")

    command, text = corpus[corpus_id]
    return command, 200, headers
