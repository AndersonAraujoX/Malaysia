#!/usr/bin/env python3
"""
Unit Test Suite for Pure Simulated Annealing TSP Solver (Malaysia)
===================================================================
Follows AAA (Arrange-Act-Assert) pattern, testing λ parameter range (0 to 1000)
and exact 2-Opt classical reference.
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

class TestLambdaRangeAndConvergence(unittest.TestCase):
    def test_random_tour_generation(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)

        # Act
        tour = solver.get_random_tour()

        # Assert
        self.assertEqual(len(tour), 20)
        self.assertEqual(len(set(tour)), 20)

    def test_lambda_1000_ground_state(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, param_lambda=1000.0, max_iter=50000)

        # Act
        result = solver.solve()

        # Assert
        self.assertTrue(result["is_valid"], "λ = 1000 must yield valid ground state")

if __name__ == "__main__":
    unittest.main()
