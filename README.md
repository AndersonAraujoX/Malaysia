# 🇲🇾 Caixeiro Viajante nas Cidades da Malásia (Simulated Annealing)

> **Solução do Problema do Caixeiro Viajante (TSP) para 20 cidades estratégicas da Malásia usando Simulated Annealing (Têmpera Simulada).**

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Simulated Annealing](https://img.shields.io/badge/Metaheuristic-Simulated%20Annealing-f59e0b?style=for-the-badge&logo=fire&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Web_App-GitHub_Pages-2ea44f?style=for-the-badge&logo=github&logoColor=white)

---

## 📌 Visão Geral

Este repositório contém uma aplicação completa (Python e Web Interativa com Leaflet.js) para solucionar o **Problema do Caixeiro Viajante (TSP)** selecionando 20 importantes metrópoles e capitais da Malásia (Peninsular e Bornéu).

O projeto implementa a metaheurística **Simulated Annealing (Têmpera Simulada)** baseada no algoritmo estocástico de resfriamento de **Metropolis-Hastings** com trocas de arestas **2-Opt**.

---

## 🗺️ Cidades da Malásia Incluídas (20)

| # | Cidade | Estado / Região | Lat / Lon | Destaque |
|---|--------|-----------------|-----------|----------|
| 1 | **Kuala Lumpur** | Território Federal | 3.1390° N, 101.6869° E | Capital nacional e centro financeiro/cultural. |
| 2 | **George Town** | Penang | 5.4164° N, 100.3327° E | UNESCO, polo de semicondutores e capital gastronômica. |
| 3 | **Johor Bahru** | Johor | 1.4927° N, 103.7414° E | Motor industrial do sul malaio, ligada a Singapura. |
| 4 | **Malaca (Melaka)** | Melaka | 2.1896° N, 102.2501° E | Cidade histórica UNESCO da rota global de especiarias. |
| 5 | **Kota Kinabalu** | Sabah (Bornéu) | 5.9804° N, 116.0735° E | Porta de entrada para a natureza do Bornéu e Monte Kinabalu. |
| 6 | **Kuching** | Sarawak (Bornéu) | 1.5533° N, 110.3592° E | Coração econômico e cultural do noroeste do Bornéu. |
| 7 | **Ipoh** | Perak | 4.5975° N, 101.0901° E | Capital histórica da mineração e proximidades de Cameron Highlands. |
| 8 | **Kuantan** | Pahang | 3.8077° N, 103.3260° E | Maior porto e centro comercial da Costa Leste. |
| 9 | **Kuala Terengganu** | Terengganu | 5.3302° N, 103.1408° E | Capital real, artesanato de batik e Ilhas Redang. |
| 10 | **Kota Bharu** | Kelantan | 6.1254° N, 102.2381° E | Capital cultural do norte da Costa Leste. |
| 11 | **Alor Setar** | Kedah | 6.1248° N, 100.3678° E | Capital do arroz da Malásia Peninsular. |
| 12 | **Seremban** | Negeri Sembilan | 2.7258° N, 101.9424° E | Herança arquitetônica Minangkabau. |
| 13 | **Kangar** | Perlis | 6.4414° N, 100.1986° E | Menor capital estadual no extremo norte. |
| 14 | **Miri** | Sarawak (Bornéu) | 4.3995° N, 113.9914° E | Polo petrolífero e acesso às Cavernas de Mulu. |
| 15 | **Sandakan** | Sabah (Bornéu) | 5.8394° N, 118.1172° E | Ecoturismo mundial e orangotangos de Sepilok. |
| 16 | **Sibu** | Sarawak (Bornéu) | 2.3000° N, 111.8167° E | Porto fluvial no rio Rajang. |
| 17 | **Tawau** | Sabah (Bornéu) | 4.2447° N, 117.8912° E | Porta de acesso ao mergulho em Sipadan. |
| 18 | **Putrajaya** | Território Federal | 2.9264° N, 101.6964° E | Centro administrativo federal planejado. |
| 19 | **Bintulu** | Sarawak (Bornéu) | 3.1667° N, 113.0333° E | Polo industrial de gás natural liquefeito (GNL). |
| 20 | **Klang** | Selangor | 3.0449° N, 101.4456° E | Cidade real e maior porto marítimo da Malásia. |

---

## 🧮 Matemática & Algoritmo

### Distância Física (Fórmula de Haversine)
$$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

### Critério de Metropolis-Hastings (Simulated Annealing)
$$P(\Delta E) = \begin{cases} 1 & \text{se } \Delta E < 0 \\ \exp\left(-\frac{\Delta E}{T}\right) & \text{se } \Delta E \ge 0 \end{cases}$$

---

## 🚀 Como Rodar Localmente

### 1. Criar o Ambiente Virtual Python (`venv`)
```bash
bash setup_env.sh
```

### 2. Rodar o Solver em Python
```bash
python3 sa_malaysia.py
```

### 3. Rodar a Interface Web Localmente
```bash
python3 -m http.server 8000
```
E acesse **`http://localhost:8000`** no navegador.

---

## 🌐 Publicação no GitHub Pages

Este repositório está configurado com **GitHub Actions** (`.github/workflows/deploy.yml`). 

O site interativo é publicado publicamente no link:
👉 **[https://AndersonAraujoX.github.io/Malaysia/](https://AndersonAraujoX.github.io/Malaysia/)**

---

## 📂 Estrutura dos Arquivos

```
.
├── index.html              # Aplicação Web Interativa (Dashboard)
├── style.css               # Tema dark glassmorphic e estilos
├── js/
│   ├── cities.js           # Dados das 20 cidades e cálculo de Haversine
│   ├── qaoa.js             # Motor JS de Simulated Annealing
│   └── app.js              # Controlador Leaflet.js e Chart.js
├── sa_malaysia.py          # Solver Python Simulated Annealing
├── qaoa_malaysia.py        # Executor auxiliar Python
├── setup_env.sh            # Script de automação do ambiente venv
├── run.sh                  # Executor auxiliar em Python
├── requirements.txt        # Dependências Python
└── .github/
    └── workflows/
        └── deploy.yml      # Implantação automática no GitHub Pages
```
