#!/usr/bin/env bash
# Script para criar e configurar o ambiente virtual Python para o QAOA TSP Malásia

set -e

ENV_DIR="venv"

echo "================================================================="
echo " 🚀 Criando ambiente virtual Python (venv) no projeto..."
echo "================================================================="

if [ ! -d "$ENV_DIR" ]; then
    python3 -m venv "$ENV_DIR"
    echo "✅ Ambiente virtual '$ENV_DIR' criado com sucesso!"
else
    echo "ℹ️ O ambiente virtual '$ENV_DIR' já existe."
fi

echo ""
echo "📦 Instalando/Atualizando dependências do requirements.txt..."
echo "-----------------------------------------------------------------"

# Ativar ambiente virtual
source "$ENV_DIR/bin/activate"

# Atualizar pip
pip install --upgrade pip setuptools wheel

# Instalar requisitos
pip install -r requirements.txt

echo ""
echo "================================================================="
echo " 🎉 Ambiente configurado com sucesso!"
echo " Para ativar o ambiente manualmente no seu terminal, execute:"
echo "   source venv/bin/activate"
echo ""
echo " Para rodar o script QAOA:"
echo "   python3 qaoa_malaysia.py"
echo "================================================================="
