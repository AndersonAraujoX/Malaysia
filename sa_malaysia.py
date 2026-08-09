#!/usr/bin/env python3
"""
Simulated Annealing (SA) TSP Solver - 20 Important Cities of Malaysia
======================================================================
State-of-the-art Hybrid Simulated Annealing solver for 20 major cities of 
Malaysia featuring Explicit Hamiltonian Operator Formulation:
H = H_cost + A * H_city + B * H_step + C * H_region
"""

import math
import random
import numpy as np

CITIES = [
    {"id": 0, "name": "Kuala Lumpur", "state": "Federal Territory", "region": "Peninsular", "lat": 3.1390, "lon": 101.6869},
    {"id": 1, "name": "George Town", "state": "Penang", "region": "Peninsular", "lat": 5.4164, "lon": 100.3327},
    {"id": 2, "name": "Johor Bahru", "state": "Johor", "region": "Peninsular", "lat": 1.4927, "lon": 103.7414},
    {"id": 3, "name": "Melaka", "state": "Melaka", "region": "Peninsular", "lat": 2.1896, "lon": 102.2501},
    {"id": 4, "name": "Kota Kinabalu", "state": "Sabah", "region": "Borneo", "lat": 5.9804, "lon": 116.0735},
    {"id": 5, "name": "Kuching", "state": "Sarawak", "region": "Borneo", "lat": 1.5533, "lon": 110.3592},
    {"id": 6, "name": "Ipoh", "state": "Perak", "region": "Peninsular", "lat": 4.5975, "lon": 101.0901},
    {"id": 7, "name": "Kuantan", "state": "Pahang", "region": "Peninsular", "lat": 3.8077, "lon": 103.3260},
    {"id": 8, "name": "Kuala Terengganu", "state": "Terengganu", "region": "Peninsular", "lat": 5.3302, "lon": 103.1408},
    {"id": 9, "name": "Kota Bharu", "state": "Kelantan", "region": "Peninsular", "lat": 6.1254, "lon": 102.2381},
    {"id": 10, "name": "Alor Setar", "state": "Kedah", "region": "Peninsular", "lat": 6.1248, "lon": 100.3678},
    {"id": 11, "name": "Seremban", "state": "Negeri Sembilan", "region": "Peninsular", "lat": 2.7258, "lon": 101.9424},
    {"id": 12, "name": "Kangar", "state": "Perlis", "region": "Peninsular", "lat": 6.4414, "lon": 100.1986},
    {"id": 13, "name": "Miri", "state": "Sarawak", "region": "Borneo", "lat": 4.3995, "lon": 113.9914},
    {"id": 14, "name": "Sandakan", "state": "Sabah", "region": "Borneo", "lat": 5.8394, "lon": 118.1172},
    {"id": 15, "name": "Sibu", "state": "Sarawak", "region": "Borneo", "lat": 2.3000, "lon": 111.8167},
    {"id": 16, "name": "Tawau", "state": "Sabah", "region": "Borneo", "lat": 4.2447, "lon": 117.8912},
    {"id": 17, "name": "Putrajaya", "state": "Federal Territory", "region": "Peninsular", "lat": 2.9264, "lon": 101.6964},
    {"id": 18, "name": "Bintulu", "state": "Sarawak", "region": "Borneo", "lat": 3.1667, "lon": 113.0333},
    {"id": 19, "name": "Klang", "state": "Selangor", "region": "Peninsular", "lat": 3.0449, "lon": 101.4456}
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
    def __init__(self, cities, dist_matrix, t_initial=5000.0, alpha=0.9995, max_iter=50000, param_a=1000.0, param_b=1000.0, param_c=500.0):
        self.cities = cities
        self.N = len(cities)
        self.dist_matrix = dist_matrix
        self.t_initial = t_initial
        self.alpha = alpha
        self.max_iter = max_iter
        self.param_a = param_a
        self.param_b = param_b
        self.param_c = param_c

    def calculate_tour_distance(self, tour):
        if not tour or len(tour) == 0:
            return 0.0
        dist = 0.0
        for k in range(self.N):
            dist += self.dist_matrix[tour[k], tour[(k + 1) % self.N]]
        return dist

    def calculate_hamiltonian(self, tour):
        if not tour or len(tour) == 0:
            return {"h_cost": 0.0, "h_city": 0.0, "h_step": 0.0, "h_region": 0.0, "total_hamiltonian": 0.0}

        h_cost = self.calculate_tour_distance(tour)
        unique_count = len(set(tour))
        h_city = (self.N - unique_count) * self.param_a
        h_step = abs(self.N - len(tour)) * self.param_b

        crossings = 0
        for k in range(self.N):
            r1 = self.cities[tour[k]].get("region")
            r2 = self.cities[tour[(k + 1) % self.N]].get("region")
            if r1 and r2 and r1 != r2:
                crossings += 1

        excess_crossings = max(0, crossings - 2)
        h_region = excess_crossings * self.param_c
        total = h_cost + h_city + h_step + h_region

        return {
            "h_cost": h_cost,
            "h_city": h_city,
            "h_step": h_step,
            "h_region": h_region,
            "total_hamiltonian": total
        }

    def calculate_total_energy(self, tour):
        return self.calculate_hamiltonian(tour)["total_hamiltonian"]

    def get_best_nearest_neighbor_tour(self):
        if self.N == 0:
            return []
        best_tour = []
        best_energy = float('inf')

        for s in range(self.N):
            unvisited = set(range(self.N))
            tour = [s]
            unvisited.remove(s)

            current = s
            while unvisited:
                nearest = min(unvisited, key=lambda nbr: self.dist_matrix[current, nbr])
                tour.append(nearest)
                unvisited.remove(nearest)
                current = nearest

            energy = self.calculate_total_energy(tour)
            if energy < best_energy:
                best_energy = energy
                best_tour = tour

        return best_tour

    def apply_2opt(self, tour, i, j):
        new_tour = tour.copy()
        new_tour[i:j+1] = reversed(new_tour[i:j+1])
        return new_tour

    def apply_insertion(self, tour, frm, to):
        new_tour = tour.copy()
        node = new_tour.pop(frm)
        new_tour.insert(to, node)
        return new_tour

    def refine_2opt(self, tour):
        current_tour = tour.copy()
        current_energy = self.calculate_total_energy(current_tour)
        improved = True

        while improved:
            improved = False
            for i in range(self.N - 1):
                for j in range(i + 1, self.N):
                    if i == 0 and j == self.N - 1:
                        continue
                    candidate = self.apply_2opt(current_tour, i, j)
                    cand_energy = self.calculate_total_energy(candidate)
                    if cand_energy < current_energy - 1e-6:
                        current_tour = candidate
                        current_energy = cand_energy
                        improved = True

        return current_tour, current_energy

    def solve(self):
        if self.N == 0:
            return {
                "best_tour_indices": [],
                "best_tour_names": [],
                "best_distance_km": 0.0,
                "history": []
            }

        global_best_tour = self.get_best_nearest_neighbor_tour()
        global_best_energy = self.calculate_total_energy(global_best_tour)

        history = []
        restarts = 4
        iter_per_restart = max(1, self.max_iter // restarts)

        for r in range(restarts):
            current_tour = global_best_tour.copy() if r == 0 else self.apply_2opt(global_best_tour, 1, self.N // 2)
            current_energy = self.calculate_total_energy(current_tour)

            T = self.t_initial

            for step in range(iter_per_restart):
                is_2opt = random.random() < 0.75
                if is_2opt:
                    i = random.randint(0, self.N - 2)
                    j = random.randint(i + 1, self.N - 1)
                    if i == 0 and j == self.N - 1:
                        j = self.N - 2
                    candidate_tour = self.apply_2opt(current_tour, i, j)
                else:
                    i = random.randint(0, self.N - 1)
                    j = random.randint(0, self.N - 1)
                    candidate_tour = self.apply_insertion(current_tour, i, j)

                candidate_energy = self.calculate_total_energy(candidate_tour)
                delta_E = candidate_energy - current_energy

                if delta_E < 0 or random.random() < math.exp(-delta_E / T):
                    current_tour = candidate_tour
                    current_energy = candidate_energy

                    if current_energy < global_best_energy:
                        global_best_tour = current_tour.copy()
                        global_best_energy = current_energy

                history.append(current_energy)
                T *= self.alpha
                if T < 1e-5:
                    break

        global_best_tour, _ = self.refine_2opt(global_best_tour)
        h_final = self.calculate_hamiltonian(global_best_tour)

        return {
            "best_tour_indices": global_best_tour,
            "best_tour_names": [self.cities[i]["name"] for i in global_best_tour],
            "best_distance_km": h_final["h_cost"],
            "h_cost": h_final["h_cost"],
            "h_city": h_final["h_city"],
            "h_step": h_final["h_step"],
            "h_region": h_final["h_region"],
            "total_energy": h_final["total_hamiltonian"],
            "history": history
        }

if __name__ == "__main__":
    print("=" * 75)
    print(f"  HAMILTONIAN TSP SOLVER - MALAYSIA {len(CITIES)} CITIES")
    print("=" * 75)

    dist_mat = build_distance_matrix(CITIES)
    sa_solver = SimulatedAnnealingTSPSolver(CITIES, dist_mat, t_initial=5000.0, alpha=0.9995, max_iter=50000)
    result = sa_solver.solve()

    print(f"\n1. Ground State Route Found ({len(CITIES)} Cities):")
    print(f"   Route: {' -> '.join(result['best_tour_names'])} -> {result['best_tour_names'][0]}")
    print(f"   H_cost: {result['h_cost']:.2f} km")
    print(f"   A*H_city: {result['h_city']:.2f}")
    print(f"   B*H_step: {result['h_step']:.2f}")
    print(f"   C*H_region: {result['h_region']:.2f}")
    print(f"   Total Ground State Energy <H>: {result['total_energy']:.2f}")
    print(f"   Executed Iterations: {len(result['history'])}")
    print("=" * 75)
