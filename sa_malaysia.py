#!/usr/bin/env python3
"""
Simulated Annealing (SA) TSP Solver - 20 Important Cities of Malaysia
======================================================================
This module solves the Traveling Salesperson Problem (TSP) for 20 major 
cities of Malaysia using Simulated Annealing (Metropolis-Hastings 2-opt).
"""

import math
import random
import numpy as np

CITIES = [
    {"id": 0, "name": "Kuala Lumpur", "state": "Federal Territory", "lat": 3.1390, "lon": 101.6869},
    {"id": 1, "name": "George Town", "state": "Penang", "lat": 5.4164, "lon": 100.3327},
    {"id": 2, "name": "Johor Bahru", "state": "Johor", "lat": 1.4927, "lon": 103.7414},
    {"id": 3, "name": "Melaka", "state": "Melaka", "lat": 2.1896, "lon": 102.2501},
    {"id": 4, "name": "Kota Kinabalu", "state": "Sabah", "lat": 5.9804, "lon": 116.0735},
    {"id": 5, "name": "Kuching", "state": "Sarawak", "lat": 1.5533, "lon": 110.3592},
    {"id": 6, "name": "Ipoh", "state": "Perak", "lat": 4.5975, "lon": 101.0901},
    {"id": 7, "name": "Kuantan", "state": "Pahang", "lat": 3.8077, "lon": 103.3260},
    {"id": 8, "name": "Kuala Terengganu", "state": "Terengganu", "lat": 5.3302, "lon": 103.1408},
    {"id": 9, "name": "Kota Bharu", "state": "Kelantan", "lat": 6.1254, "lon": 102.2381},
    {"id": 10, "name": "Alor Setar", "state": "Kedah", "lat": 6.1248, "lon": 100.3678},
    {"id": 11, "name": "Seremban", "state": "Negeri Sembilan", "lat": 2.7258, "lon": 101.9424},
    {"id": 12, "name": "Kangar", "state": "Perlis", "lat": 6.4414, "lon": 100.1986},
    {"id": 13, "name": "Miri", "state": "Sarawak", "lat": 4.3995, "lon": 113.9914},
    {"id": 14, "name": "Sandakan", "state": "Sabah", "lat": 5.8394, "lon": 118.1172},
    {"id": 15, "name": "Sibu", "state": "Sarawak", "lat": 2.3000, "lon": 111.8167},
    {"id": 16, "name": "Tawau", "state": "Sabah", "lat": 4.2447, "lon": 117.8912},
    {"id": 17, "name": "Putrajaya", "state": "Federal Territory", "lat": 2.9264, "lon": 101.6964},
    {"id": 18, "name": "Bintulu", "state": "Sarawak", "lat": 3.1667, "lon": 113.0333},
    {"id": 19, "name": "Klang", "state": "Selangor", "lat": 3.0449, "lon": 101.4456}
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
    def __init__(self, cities, dist_matrix, t_initial=2000.0, alpha=0.998, max_iter=6000):
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
        if self.N < 4:
            return tour.copy()
        new_tour = tour.copy()
        i = random.randint(1, self.N - 2)
        j = random.randint(i + 1, self.N - 1)
        new_tour[i:j+1] = reversed(new_tour[i:j+1])
        return new_tour

    def solve(self):
        if self.N == 0:
            return {
                "best_tour_indices": [],
                "best_tour_names": [],
                "best_distance_km": 0.0,
                "history": []
            }

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

if __name__ == "__main__":
    print("=" * 75)
    print(f"  SIMULATED ANNEALING TSP SOLVER - MALAYSIA {len(CITIES)} CITIES")
    print("=" * 75)

    dist_mat = build_distance_matrix(CITIES)
    sa_solver = SimulatedAnnealingTSPSolver(CITIES, dist_mat, t_initial=2000.0, alpha=0.998, max_iter=6000)
    result = sa_solver.solve()

    print(f"\n1. Route Found via Simulated Annealing ({len(CITIES)} Cities):")
    print(f"   Route: {' -> '.join(result['best_tour_names'])} -> {result['best_tour_names'][0]}")
    print(f"   Total Distance: {result['best_distance_km']:.2f} km")
    print(f"   Executed Iterations: {len(result['history'])}")
    print("=" * 75)
