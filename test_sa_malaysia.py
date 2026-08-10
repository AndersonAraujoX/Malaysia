#!/usr/bin/env python3
"""
Unit Test Suite for Pure Simulated Annealing TSP Solver (Malaysia)
===================================================================
Follows AAA (Arrange-Act-Assert) pattern, testing unbiased random initial
tours, 2-Opt neighborhood moves, and ground state convergence.
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

class TestPureSimulatedAnnealing(unittest.TestCase):
    def test_random_tour_generation(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)

        # Act
        tour = solver.get_random_tour()

        # Assert
        self.assertEqual(len(tour), 20)
        self.assertEqual(len(set(tour)), 20)

    def test_2opt_neighborhood_reversal(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)
        tour = [0, 1, 2, 3, 4, 5]

        # Act
        reversed_tour = solver.apply_2opt(tour, 1, 4)

        # Assert
        self.assertEqual(reversed_tour, [0, 4, 3, 2, 1, 5])

    def test_ground_state_convergence(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, max_iter=50000)

        # Act
        result = solver.solve()

        # Assert
        self.assertEqual(len(result["best_tour_indices"]), 20)
        self.assertTrue(result["best_distance_km"] < 6000.0, f"Distance should be < 6000km, got {result['best_distance_km']}")

if __name__ == "__main__":
    unittest.main()
