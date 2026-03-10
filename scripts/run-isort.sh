#!/usr/bin/env bash
# Resolve isort binary: Backend/.venv → ~/miniconda3 tfg env → system PATH
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -x "$REPO_ROOT/Backend/.venv/bin/isort" ]; then
    ISORT="$REPO_ROOT/Backend/.venv/bin/isort"
elif [ -x "$HOME/miniconda3/envs/tfg/bin/isort" ]; then
    ISORT="$HOME/miniconda3/envs/tfg/bin/isort"
else
    ISORT="isort"
fi

# Strip the leading "Backend/" prefix from each path and collect into array
files=()
for f in "$@"; do
    files+=("${f#Backend/}")
done

cd "$REPO_ROOT/Backend" || exit 1
exec "$ISORT" --profile black "${files[@]}"
