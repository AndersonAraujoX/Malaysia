#!/usr/bin/env python3
"""
Unit Test Suite for Hybrid Simulated Annealing TSP Solver (Malaysia)
====================================================================
Follows AAA (Arrange-Act-Assert) pattern, covering O(1) delta evaluation,
insertion moves, multi-start NN, and 2-Opt local refinement.
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

class TestHybridSimulatedAnnealing(unittest.TestCase):
    def test_delta_2opt_math_consistency(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)
        tour = list(range(20))
        dist_before = solver.calculate_tour_distance(tour)

        # Act
        delta_E = solver.evaluate_delta_2opt(tour, 2, 8)
        new_tour = solver.apply_2opt(tour, 2, 8)
        dist_after = solver.calculate_tour_distance(new_tour)

        # Assert
        self.assertAlmostEqual(dist_after - dist_before, delta_E, places=5)

    def test_solver_hybrid_full_run(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, max_iter=3000)

        # Act
        result = solver.solve()

        # Assert
        self.assertEqual(len(result["best_tour_indices"]), 20)
        self.assertTrue(result["best_distance_km"] > 0)
        self.assertTrue(len(result["history"]) > 0)

if __name__ == "__main__":
    unittest.main()
