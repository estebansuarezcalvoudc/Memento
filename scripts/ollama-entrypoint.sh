#!/bin/bash
set -e

# Start Ollama in background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama service to start..."
until ollama list > /dev/null 2>&1; do
    sleep 1
done

# Pull default models
echo "Pulling llama3.2:latest (chat model, ~4.7GB)..."
ollama pull llama3.2:latest
echo "Pulling nomic-embed-text (embedding model)..."
ollama pull nomic-embed-text

echo "Models ready. Starting Ollama..."
wait $OLLAMA_PID
