#!/usr/bin/env bash
# Resolve black binary: Backend/.venv → ~/miniconda3 tfg env → system PATH
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -x "$REPO_ROOT/Backend/.venv/bin/black" ]; then
    BLACK="$REPO_ROOT/Backend/.venv/bin/black"
elif [ -x "$HOME/miniconda3/envs/tfg/bin/black" ]; then
    BLACK="$HOME/miniconda3/envs/tfg/bin/black"
else
    BLACK="black"
fi

# Strip the leading "Backend/" prefix from each path and collect into array
files=()
for f in "$@"; do
    files+=("${f#Backend/}")
done

cd "$REPO_ROOT/Backend" || exit 1
exec "$BLACK" "${files[@]}"
