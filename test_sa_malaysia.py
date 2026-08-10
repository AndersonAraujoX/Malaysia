#!/usr/bin/env python3
"""
Unit Test Suite for Pure Simulated Annealing TSP Solver (Malaysia)
===================================================================
Follows AAA (Arrange-Act-Assert) pattern, testing formulation H = H_cost + λ * H_penalty (A=1)
and comparing λ = 0 vs λ = 1000.
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

class TestLambdaFormulation(unittest.TestCase):
    def test_random_tour_generation(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)

        # Act
        tour = solver.get_random_tour()

        # Assert
        self.assertEqual(len(tour), 20)
        self.assertEqual(len(set(tour)), 20)

    def test_lambda_0_vs_1000(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)

        # Act 1: λ = 0
        solver_0 = SimulatedAnnealingTSPSolver(CITIES, matrix, param_lambda=0.0, max_iter=20000)
        res_0 = solver_0.solve()

        # Act 2: λ = 1000
        solver_1000 = SimulatedAnnealingTSPSolver(CITIES, matrix, param_lambda=1000.0, max_iter=50000)
        res_1000 = solver_1000.solve()

        # Assert
        self.assertTrue(res_1000["is_valid"], "High λ must yield valid ground state")

if __name__ == "__main__":
    unittest.main()
