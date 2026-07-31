#!/usr/bin/env bash
# Script auxiliar para executar o solver de Simulated Annealing usando o venv

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [ -f "$DIR/venv/bin/activate" ]; then
    source "$DIR/venv/bin/activate"
    python3 "$DIR/sa_malaysia.py" "$@"
else
    echo "⚠️ Ambiente virtual venv não encontrado!"
    echo "Execute primeiro: bash setup_env.sh"
    exit 1
fi
