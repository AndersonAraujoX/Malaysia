# 🇲🇾 Traveling Salesperson in Malaysian Cities (Simulated Annealing)

> **Solution to the Traveling Salesperson Problem (TSP) for 20 major cities of Malaysia using the Simulated Annealing metaheuristic.**

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Simulated Annealing](https://img.shields.io/badge/Metaheuristic-Simulated%20Annealing-f59e0b?style=for-the-badge&logo=fire&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Web_App-GitHub_Pages-2ea44f?style=for-the-badge&logo=github&logoColor=white)

---

## 📌 Overview

This repository contains a full application (Python CLI and Interactive Web App with Leaflet.js and Chart.js) to solve the **Traveling Salesperson Problem (TSP)** selecting 20 key metropolises and capitals across Malaysia (Peninsular and Borneo regions).

The project implements and compares two optimization approaches:
1. **Exact Classical Baseline (Brute-Force / 2-Opt)**: Minimum physical distance reference.
2. **Simulated Annealing (SA)**: Stochastic metaheuristic with Metropolis-Hastings 2-opt cooling.

---

## 🗺️ Included Malaysian Cities (20)

| # | City | State / Region | Lat / Lon | Highlight |
|---|------|----------------|-----------|-----------|
| 1 | **Kuala Lumpur** | Federal Territory | 3.1390° N, 101.6869° E | National capital, financial, and cultural center. |
| 2 | **George Town** | Penang | 5.4164° N, 100.3327° E | UNESCO World Heritage, semiconductor hub. |
| 3 | **Johor Bahru** | Johor | 1.4927° N, 103.7414° E | Industrial motor of southern Malaysia, connected to Singapore. |
| 4 | **Melaka** | Melaka | 2.1896° N, 102.2501° E | Historic UNESCO spice trade city. |
| 5 | **Kota Kinabalu** | Sabah (Borneo) | 5.9804° N, 116.0735° E | Gateway to Borneo nature and Mount Kinabalu. |
| 6 | **Kuching** | Sarawak (Borneo) | 1.5533° N, 110.3592° E | Economic and cultural heart of northwestern Borneo. |
| 7 | **Ipoh** | Perak | 4.5975° N, 101.0901° E | Historic tin mining capital. |
| 8 | **Kuantan** | Pahang | 3.8077° N, 103.3260° E | Major port and commercial center on the East Coast. |
| 9 | **Kuala Terengganu** | Terengganu | 5.3302° N, 103.1408° E | Royal capital, batik handicrafts, and Redang Islands. |
| 10 | **Kota Bharu** | Kelantan | 6.1254° N, 102.2381° E | Cultural capital of northern East Coast. |
| 11 | **Alor Setar** | Kedah | 6.1248° N, 100.3678° E | Rice bowl of Malaysia. |
| 12 | **Seremban** | Negeri Sembilan | 2.7258° N, 101.9424° E | Minangkabau architectural heritage. |
| 13 | **Kangar** | Perlis | 6.4414° N, 100.1986° E | Smallest state capital in the far north. |
| 14 | **Miri** | Sarawak (Borneo) | 4.3995° N, 113.9914° E | Petroleum hub and access to Mulu Caves. |
| 15 | **Sandakan** | Sabah (Borneo) | 5.8394° N, 118.1172° E | World ecotourism and Sepilok orangutans. |
| 16 | **Sibu** | Sarawak (Borneo) | 2.3000° N, 111.8167° E | River port on the Rajang River. |
| 17 | **Tawau** | Sabah (Borneo) | 4.2447° N, 117.8912° E | Gateway to Sipadan island diving. |
| 18 | **Putrajaya** | Federal Territory | 2.9264° N, 101.6964° E | Planned federal administrative center. |
| 19 | **Bintulu** | Sarawak (Borneo) | 3.1667° N, 113.0333° E | Liquefied natural gas (LNG) industrial hub. |
| 20 | **Klang** | Selangor | 3.0449° N, 101.4456° E | Royal city and Malaysia's largest seaport. |

---

## 🚀 How to Run Locally

### 1. Set Up Python Environment
```bash
bash setup_env.sh
```

### 2. Run Python Solver CLI
```bash
python3 sa_malaysia.py
```

### 3. Run Web Dashboard
```bash
python3 -m http.server 8000
```
Access **`http://localhost:8000`** in your web browser.

### 4. Run Unit Test Suites
```bash
# Run JavaScript unit tests
node --test tests/solver.test.js

# Run Python unit tests
python3 -m unittest test_sa_malaysia.py
```

---

## 📂 File Structure

```
.
├── index.html              # Interactive Web Dashboard (English)
├── style.css               # Dark glassmorphic theme styling
├── js/
│   ├── cities.js           # 20 Malaysian cities dataset & Haversine distance utilities
│   ├── solver.js           # JS Simulated Annealing optimization engine
│   └── app.js              # Leaflet.js map controller & Chart.js renderer
├── tests/
│   └── solver.test.js      # JS Unit test suite (Node.js test runner)
├── sa_malaysia.py          # Python Simulated Annealing solver
├── test_sa_malaysia.py     # Python Unit test suite (unittest framework)
├── setup_env.sh            # Virtual environment setup script
├── run.sh                  # Execution script helper
├── requirements.txt        # Python dependencies
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages CI/CD pipeline
```
