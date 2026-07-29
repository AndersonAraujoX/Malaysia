# 🇲🇾 Caixeiro Viajante nas Cidades da Malásia (QAOA & Simulated Annealing)

> **Solução do Problema do Caixeiro Viajante (TSP) para 7 cidades estratégicas da Malásia usando Algoritmo Quântico Variacional (QAOA) e Têmpera Simulada (Simulated Annealing).**

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Quantum QAOA](https://img.shields.io/badge/Quantum-QAOA-00f2fe?style=for-the-badge&logo=atom&logoColor=white)
![Simulated Annealing](https://img.shields.io/badge/Metaheuristic-Simulated%20Annealing-f59e0b?style=for-the-badge&logo=fire&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Web_App-GitHub_Pages-2ea44f?style=for-the-badge&logo=github&logoColor=white)

---

## 📌 Visão Geral

Este repositório contém uma aplicação completa (Python e Web Interativa com Leaflet.js) para solucionar o **Problema do Caixeiro Viajante (TSP)** selecionando 7 importantes metrópoles e capitais da Malásia (Peninsular e Bornéu).

O projeto implementa e compara três abordagens de otimização:
1. **Solução Exata Clássica (Brute-Force / 2-Opt)**: Referência de menor distância física.
2. **QAOA Quântico (Quantum Approximate Optimization Algorithm)**:
   - **Codificação Logarítmica Compacta ($N \log N$)**: **18 Qubits** para 7 cidades.
   - **Codificação Quadrática One-Hot ($N^2$)**: **36 Qubits** para 7 cidades.
3. **Simulated Annealing (Têmpera Simulada - SA)**: Metaheurística estocástica com resfriamento de Metropolis-Hastings.

---

## 🗺️ Cidades da Malásia Incluídas

| # | Cidade | Estado / Região | Lat / Lon | Destaque |
|---|--------|-----------------|-----------|----------|
| 1 | **Kuala Lumpur** | Território Federal | 3.1390° N, 101.6869° E | Capital nacional e centro financeiro/cultural. |
| 2 | **George Town** | Penang | 5.4164° N, 100.3327° E | UNESCO, polo de semicondutores e capital gastronômica. |
| 3 | **Johor Bahru** | Johor | 1.4927° N, 103.7414° E | Motor industrial do sul malaio, ligada a Singapura. |
| 4 | **Malaca (Melaka)** | Melaka | 2.1896° N, 102.2501° E | Cidade histórica UNESCO da rota global de especiarias. |
| 5 | **Kota Kinabalu** | Sabah (Bornéu) | 5.9804° N, 116.0735° E | Porta de entrada para a natureza do Bornéu e Monte Kinabalu. |
| 6 | **Kuching** | Sarawak (Bornéu) | 1.5533° N, 110.3592° E | Coração econômico e cultural do noroeste do Bornéu. |
| 7 | **Ipoh** | Perak | 4.5975° N, 101.0901° E | Capital histórica da mineração e proximidades de Cameron Highlands. |

---

## ⚛️ Formulação Matemática

### Distância Física (Fórmula de Haversine)
$$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

### Algoritmo Quântico (QAOA)
Ansätz variacional quântico com alternância de operadores de custo $U(C, \gamma)$ e mistura $U(B, \beta)$:
$$|\gamma, \beta\rangle = \prod_{k=1}^p e^{-i \beta_k H_B} e^{-i \gamma_k H_C} |+\rangle^{\otimes n}$$

---

## 🚀 Como Rodar Localmente

### 1. Criar o Ambiente Virtual Python (`venv`)
```bash
bash setup_env.sh
```

### 2. Rodar o Solver em Python
```bash
# Executa Simulated Annealing & QAOA
bash run.sh
```
ou
```bash
python3 sa_malaysia.py
python3 qaoa_malaysia.py
```

### 3. Rodar a Interface Web Localmente
```bash
python3 -m http.server 8000
```
E acesse **`http://localhost:8000`** no navegador.

---

## 🌐 Publicação no GitHub Pages

Este repositório já está configurado com **GitHub Actions** (`.github/workflows/deploy.yml`). 

Para publicar e gerar seu link público no GitHub Pages:

1. Suba os arquivos para o GitHub:
   ```bash
   git add .
   git commit -m "feat: QAOA and Simulated Annealing TSP Malaysia solver"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
   git push -u origin main
   ```
2. No seu repositório no GitHub, vá em **Settings** ➔ **Pages**:
   - Em **Source**, selecione **GitHub Actions**.
3. O site estará disponível publicamente no link:
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`

---

## 📂 Estrutura dos Arquivos

```
.
├── index.html              # Aplicação Web Interativa (Dashboard)
├── style.css               # Tema dark glassmorphic e estilos quânticos
├── js/
│   ├── cities.js           # Dados das 7 cidades e cálculo de Haversine
│   ├── qaoa.js             # Motor JS de QAOA e Simulated Annealing
│   └── app.js              # Controlador Leaflet.js e Chart.js
├── qaoa_malaysia.py        # Solver Python QAOA & QUBO
├── sa_malaysia.py          # Solver Python Simulated Annealing
├── setup_env.sh            # Script de automação do ambiente venv
├── run.sh                  # Execuror auxiliar em Python
├── requirements.txt        # Dependências Python
└── .github/
    └── workflows/
        └── deploy.yml      # Implantação automática no GitHub Pages
```
