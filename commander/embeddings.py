from sentence_transformers import SentenceTransformer, util
from torch import Tensor
from commands import corpus

embedder = SentenceTransformer("all-MiniLM-L6-v2")

corpus_embeddings: Tensor = embedder.encode_document([text for command, text in corpus], convert_to_tensor=True)

def get_command(query):
    print(f"Getting command for '{query}'")

    query_embedding: Tensor = embedder.encode_query(query, convert_to_tensor=True)
    [[result]] = util.semantic_search(query_embedding, corpus_embeddings, top_k=1)
    corpus_id = result.get("corpus_id")
    print(corpus_id)
    if corpus_id is None:
        return None

    print(f"Returning '{corpus[corpus_id]}'")

    command, text = corpus[corpus_id]
    return command
