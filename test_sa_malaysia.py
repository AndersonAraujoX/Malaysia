#!/usr/bin/env python3
"""
Unit Test Suite for Hamiltonian Simulated Annealing TSP Solver (Malaysia)
==========================================================================
Follows AAA (Arrange-Act-Assert) pattern, covering explicit Hamiltonian terms
(H_cost, H_city, H_step, H_region) and non-negativity guarantees.
"""

import unittest
import numpy as np
from sa_malaysia import CITIES, haversine_distance, build_distance_matrix, SimulatedAnnealingTSPSolver

class TestHaversineDistance(unittest.TestCase):
    def test_haversine_happy_path(self):
        # Arrange
        kl = CITIES[0]
        gt = CITIES[1]

        # Act
        dist = haversine_distance(kl["lat"], kl["lon"], gt["lat"], gt["lon"])

        # Assert
        self.assertTrue(250.0 < dist < 400.0)

class TestHamiltonianTerms(unittest.TestCase):
    def test_hamiltonian_breakdown(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, param_a=1000.0, param_b=1000.0, param_c=500.0)
        tour = list(range(20))

        # Act
        h = solver.calculate_hamiltonian(tour)

        # Assert
        self.assertTrue(h["h_cost"] > 0.0)
        self.assertEqual(h["h_city"], 0.0)
        self.assertEqual(h["h_step"], 0.0)
        self.assertTrue(h["total_hamiltonian"] >= h["h_cost"])

    def test_history_non_negativity(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, max_iter=2000)

        # Act
        result = solver.solve()

        # Assert
        min_energy = min(result["history"])
        self.assertTrue(min_energy >= 0.0, f"History energy must be non-negative, got {min_energy}")

if __name__ == "__main__":
    unittest.main()
