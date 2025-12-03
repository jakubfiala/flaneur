from flask import Flask, request

from embeddings import get_command

app = Flask(__name__)

headers = {
    "Access-Control-Allow-Origin": "http://localhost:8000",
    "Cache-Control": "max-age=3600",
}

print("Starting command server")

@app.route("/")
def main():
    print("Received command")
    query = request.args.get("query", None)
    if query is None:
        return "No query provided", 400

    command = get_command(query)
    if command is None:
        return "Oops", 500

    print(f"Returning '{command}'")
    return command, 200, headers
