#!/usr/bin/env python3
"""
Simulated Annealing (SA) TSP Solver - 7 Important Cities of Malaysia
====================================================================
This module solves the Traveling Salesperson Problem (TSP) for the 7 major 
cities of Malaysia using Simulated Annealing (Metropolis-Hastings algorithm).

Cities:
1. Kuala Lumpur
2. George Town (Penang)
3. Johor Bahru
4. Malaca (Melaka)
5. Kota Kinabalu (Sabah, Bornéu)
6. Kuching (Sarawak, Bornéu)
7. Ipoh (Perak)
"""

import math
import random
import numpy as np

CITIES = [
    {"id": 0, "name": "Kuala Lumpur", "state": "Federal Territory", "lat": 3.1390, "lon": 101.6869},
    {"id": 1, "name": "George Town", "state": "Penang", "lat": 5.4164, "lon": 100.3327},
    {"id": 2, "name": "Johor Bahru", "state": "Johor", "lat": 1.4927, "lon": 103.7414},
    {"id": 3, "name": "Malaca (Melaka)", "state": "Melaka", "lat": 2.1896, "lon": 102.2501},
    {"id": 4, "name": "Kota Kinabalu", "state": "Sabah", "lat": 5.9804, "lon": 116.0735},
    {"id": 5, "name": "Kuching", "state": "Sarawak", "lat": 1.5533, "lon": 110.3592},
    {"id": 6, "name": "Ipoh", "state": "Perak", "lat": 4.5975, "lon": 101.0901}
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
    matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i, j] = haversine_distance(
                    cities[i]["lat"], cities[i]["lon"],
                    cities[j]["lat"], cities[j]["lon"]
                )
    return matrix

class SimulatedAnnealingTSPSolver:
    def __init__(self, cities, dist_matrix, t_initial=1000.0, alpha=0.995, max_iter=2000):
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
        """Generates a neighbor tour using 2-opt edge swap."""
        new_tour = tour.copy()
        # Pick two distinct indices (excluding fixed start city at 0)
        i = random.randint(1, self.N - 2)
        j = random.randint(i + 1, self.N - 1)
        # Reverse segment between i and j
        new_tour[i:j+1] = reversed(new_tour[i:j+1])
        return new_tour

    def solve(self):
        # Initial tour: [0, 1, 2, ..., N-1]
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

            # Metropolis Acceptance Criterion
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

            # Geometric Cooling Schedule
            T *= self.alpha
            if T < 1e-4:
                break

        return {
            "best_tour_indices": best_tour,
            "best_tour_names": [self.cities[i]["name"] for i in best_tour],
            "best_distance_km": best_cost,
            "history": history
        }

if __name__ == "__main__":
    print("=" * 70)
    print("  SIMULATED ANNEALING TSP SOLVER - MALAYSIA 7 CITIES")
    print("=" * 70)

    dist_mat = build_distance_matrix(CITIES)
    sa_solver = SimulatedAnnealingTSPSolver(CITIES, dist_mat, t_initial=500.0, alpha=0.992, max_iter=3000)
    result = sa_solver.solve()

    print("\n1. Rota Encontrada via Simulated Annealing:")
    print(f"   Rota: {' -> '.join(result['best_tour_names'])} -> {result['best_tour_names'][0]}")
    print(f"   Distância Total: {result['best_distance_km']:.2f} km")
    print(f"   Iterações Executadas: {len(result['history'])}")
    print("=" * 70)
