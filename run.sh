#!/usr/bin/env bash
# Script auxiliar para executar o qaoa_malaysia.py usando o venv

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [ -f "$DIR/venv/bin/activate" ]; then
    source "$DIR/venv/bin/activate"
    python3 "$DIR/qaoa_malaysia.py" "$@"
else
    echo "⚠️ Ambiente virtual venv não encontrado!"
    echo "Execute primeiro: bash setup_env.sh"
    exit 1
fi
