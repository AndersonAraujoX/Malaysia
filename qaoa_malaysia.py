#!/usr/bin/env python3
"""
QAOA & Simulated Annealing Traveling Salesperson Problem (TSP) - Malaysia 7 Cities
====================================================================================
Supports:
  1. Simulated Annealing (SA) - Metropolis-Hastings 2-opt cooling solver
  2. QAOA Compact Logarithmic Encoding: N * ceil(log2 N) = 21/18 qubits
  3. QAOA One-Hot Encoding: (N-1)^2 qubits (36 qubits)
"""

import math
import random
import itertools
import numpy as np
from scipy.optimize import minimize

# -----------------------------------------------------------------------------
# 1. City Data & Haversine Distance Matrix
# -----------------------------------------------------------------------------
CITIES = [
    {
        "id": 0,
        "name": "Kuala Lumpur",
        "state": "Federal Territory of Kuala Lumpur",
        "region": "Peninsular Malaysia",
        "lat": 3.1390,
        "lon": 101.6869,
        "desc": "Capital nacional e maior metrópole do país."
    },
    {
        "id": 1,
        "name": "George Town",
        "state": "Penang",
        "region": "Peninsular Malaysia",
        "lat": 5.4164,
        "lon": 100.3327,
        "desc": "Capital do estado de Penang e Patrimônio Mundial da UNESCO."
    },
    {
        "id": 2,
        "name": "Johor Bahru",
        "state": "Johor",
        "region": "Peninsular Malaysia",
        "lat": 1.4927,
        "lon": 103.7414,
        "desc": "Capital de Johor e motor industrial do sul malaio."
    },
    {
        "id": 3,
        "name": "Malaca (Melaka)",
        "state": "Melaka",
        "region": "Peninsular Malaysia",
        "lat": 2.1896,
        "lon": 102.2501,
        "desc": "Cidade histórica e Patrimônio Mundial da UNESCO."
    },
    {
        "id": 4,
        "name": "Kota Kinabalu",
        "state": "Sabah",
        "region": "Borneo (East Malaysia)",
        "lat": 5.9804,
        "lon": 116.0735,
        "desc": "Capital de Sabah, na ilha de Bornéu."
    },
    {
        "id": 5,
        "name": "Kuching",
        "state": "Sarawak",
        "region": "Borneo (East Malaysia)",
        "lat": 1.5533,
        "lon": 110.3592,
        "desc": "Capital de Sarawak, coração econômico do noroeste do Bornéu."
    },
    {
        "id": 6,
        "name": "Ipoh",
        "state": "Perak",
        "region": "Peninsular Malaysia",
        "lat": 4.5975,
        "lon": 101.0901,
        "desc": "Capital do estado de Perak e proximidade com Cameron Highlands."
    }
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def build_distance_matrix(cities):
    n = len(cities)
    dist_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                dist_matrix[i, j] = haversine_distance(
                    cities[i]["lat"], cities[i]["lon"],
                    cities[j]["lat"], cities[j]["lon"]
                )
    return dist_matrix

def solve_tsp_brute_force(dist_matrix):
    n = len(dist_matrix)
    start_city = 0
    other_cities = list(range(1, n))
    best_cost = float('inf')
    best_tour = None
    for perm in itertools.permutations(other_cities):
        tour = [start_city] + list(perm)
        cost = sum(dist_matrix[tour[k], tour[(k + 1) % n]] for k in range(n))
        if cost < best_cost:
            best_cost = cost
            best_tour = tour
    return best_tour, best_cost

# -----------------------------------------------------------------------------
# 2. Simulated Annealing Solver (SA)
# -----------------------------------------------------------------------------
class SimulatedAnnealingTSPSolver:
    def __init__(self, cities, dist_matrix, t_initial=500.0, alpha=0.995, max_iter=2500):
        self.cities = cities
        self.N = len(cities)
        self.dist_matrix = dist_matrix
        self.t_initial = t_initial
        self.alpha = alpha
        self.max_iter = max_iter

    def calculate_tour_distance(self, tour):
        dist = 0.0
        for k in range(self.N):
            dist += self.dist_matrix[tour[k], tour[(k + 1) % self.N]]
        return dist

    def get_neighbor_2opt(self, tour):
        new_tour = tour.copy()
        i = random.randint(1, self.N - 2)
        j = random.randint(i + 1, self.N - 1)
        new_tour[i:j+1] = reversed(new_tour[i:j+1])
        return new_tour

    def solve(self):
        current_tour = list(range(self.N))
        current_cost = self.calculate_tour_distance(current_tour)

        best_tour = current_tour.copy()
        best_cost = current_cost

        T = self.t_initial
        history = []

        for step in range(self.max_iter):
            neighbor_tour = self.get_neighbor_2opt(current_tour)
            neighbor_cost = self.calculate_tour_distance(neighbor_tour)
            delta_E = neighbor_cost - current_cost

            if delta_E < 0 or random.random() < math.exp(-delta_E / T):
                current_tour = neighbor_tour
                current_cost = neighbor_cost

                if current_cost < best_cost:
                    best_tour = current_tour.copy()
                    best_cost = current_cost

            history.append({
                "step": step,
                "temp": T,
                "current_cost": current_cost,
                "best_cost": best_cost
            })

            T *= self.alpha
            if T < 1e-4:
                break

        return {
            "best_tour_indices": best_tour,
            "best_tour_names": [self.cities[i]["name"] for i in best_tour],
            "best_distance_km": best_cost,
            "history": history
        }

# -----------------------------------------------------------------------------
# 3. Compact Logarithmic QAOA Solver (N * log2 N qubits)
# -----------------------------------------------------------------------------
class QAOATSPLogSolver:
    def __init__(self, cities_subset, dist_matrix_full, fix_origin=True):
        self.cities = cities_subset
        self.N = len(cities_subset)
        self.fix_origin = fix_origin
        
        self.dist_matrix = np.zeros((self.N, self.N))
        for i in range(self.N):
            for j in range(self.N):
                self.dist_matrix[i, j] = dist_matrix_full[cities_subset[i]["id"], cities_subset[j]["id"]]
                
        self.bits_per_step = math.ceil(math.log2(self.N))
        self.num_steps = self.N - 1 if fix_origin else self.N
        self.num_qubits = self.num_steps * self.bits_per_step
        self.num_states = 1 << self.num_qubits
        
        max_d = np.max(self.dist_matrix)
        self.penalty_duplicate = max_d * 4.0
        self.penalty_invalid_city = max_d * 6.0

    def decode_bitstring(self, bitstring):
        tour = []
        if self.fix_origin:
            tour.append(0)
            
        for step in range(self.num_steps):
            start_bit = step * self.bits_per_step
            chunk = bitstring[start_bit : start_bit + self.bits_per_step]
            city_idx = 0
            for b_i, bit in enumerate(chunk):
                city_idx += bit * (1 << b_i)
            tour.append(city_idx)
            
        out_of_bounds = any(c >= self.N for c in tour)
        unique_cities = len(set(tour)) == self.N
        is_valid = (not out_of_bounds) and unique_cities
        
        if is_valid:
            dist = sum(self.dist_matrix[tour[k], tour[(k + 1) % self.N]] for k in range(self.N))
            return True, tour, dist
        else:
            cost = 0.0
            visited = set()
            for c in tour:
                if c >= self.N:
                    cost += self.penalty_invalid_city
                elif c in visited:
                    cost += self.penalty_duplicate
                else:
                    visited.add(c)
            cost += (self.N - len(visited)) * self.penalty_duplicate
            return False, tour, cost

    def run_qaoa_simulation(self, p=1, maxiter=40):
        energies = np.zeros(self.num_states)
        for s in range(self.num_states):
            bits = [(s >> b) & 1 for b in range(self.num_qubits)]
            valid, tour, cost_or_dist = self.decode_bitstring(bits)
            energies[s] = cost_or_dist if valid else (cost_or_dist + 500.0)

        def cost_function(params):
            gammas = params[:p]
            betas = params[p:]
            state = np.ones(self.num_states, dtype=complex) / np.sqrt(self.num_states)
            
            for k in range(p):
                g, b = gammas[k], betas[k]
                state *= np.exp(-1j * g * energies)
                cos_b = np.cos(b)
                sin_b = -1j * np.sin(b)
                for q in range(self.num_qubits):
                    bit_mask = 1 << q
                    state_paired = np.copy(state)
                    idx0 = np.arange(self.num_states)
                    idx1 = idx0 ^ bit_mask
                    state = cos_b * state + sin_b * state_paired[idx1]

            probs = np.abs(state) ** 2
            return np.sum(probs * energies)

        init_params = np.concatenate([np.full(p, 0.5), np.full(p, 0.5)])
        res = minimize(cost_function, init_params, method='COBYLA', options={'maxiter': maxiter})
        
        opt_params = res.x
        gammas, betas = opt_params[:p], opt_params[p:]
        state = np.ones(self.num_states, dtype=complex) / np.sqrt(self.num_states)
        for k in range(p):
            state *= np.exp(-1j * gammas[k] * energies)
            cos_b, sin_b = np.cos(betas[k]), -1j * np.sin(betas[k])
            for q in range(self.num_qubits):
                bit_mask = 1 << q
                state_paired = np.copy(state)
                idx0 = np.arange(self.num_states)
                idx1 = idx0 ^ bit_mask
                state = cos_b * state + sin_b * state_paired[idx1]

        probs = np.abs(state) ** 2
        top_indices = np.argsort(probs)[::-1][:10]
        top_samples = []
        for idx in top_indices:
            bits = [(idx >> b) & 1 for b in range(self.num_qubits)]
            valid, tour, dist_or_cost = self.decode_bitstring(bits)
            global_tour = [self.cities[c]["name"] for c in tour if c < self.N] if valid else None
            top_samples.append({
                "bitstring": "".join(str(b) for b in bits),
                "prob": float(probs[idx]),
                "energy": float(energies[idx]),
                "is_valid": valid,
                "tour": global_tour,
                "distance_km": float(dist_or_cost) if valid else None
            })

        return {
            "num_qubits": self.num_qubits,
            "final_expectation": float(res.fun),
            "top_samples": top_samples
        }

if __name__ == "__main__":
    print("=" * 75)
    print("  MALAYSIA 7 CITIES TSP SOLVER - SA & QAOA")
    print("=" * 75)
    
    dist_mat = build_distance_matrix(CITIES)
    best_tour_idx, best_dist = solve_tsp_brute_force(dist_mat)
    best_tour_names = [CITIES[idx]["name"] for idx in best_tour_idx]
    print(f"\n1. Solução Exata Clássica (Brute-Force):")
    print(f"   Rota: {' -> '.join(best_tour_names)} -> {best_tour_names[0]}")
    print(f"   Distância Total: {best_dist:.2f} km")

    print(f"\n2. Executando Simulated Annealing (SA):")
    sa_solver = SimulatedAnnealingTSPSolver(CITIES, dist_mat, t_initial=500.0, alpha=0.992, max_iter=2500)
    sa_res = sa_solver.solve()
    print(f"   Rota SA: {' -> '.join(sa_res['best_tour_names'])} -> {sa_res['best_tour_names'][0]}")
    print(f"   Distância SA: {sa_res['best_distance_km']:.2f} km")

    print(f"\n3. Executando QAOA Logarítmico (18 Qubits):")
    solver_18 = QAOATSPLogSolver(CITIES, dist_mat, fix_origin=True)
    res = solver_18.run_qaoa_simulation(p=1, maxiter=30)
    print(f"   Expectativa de Energia <E>: {res['final_expectation']:.2f}")

    print("\n" + "=" * 75)
