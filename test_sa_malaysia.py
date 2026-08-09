#!/usr/bin/env python3
"""
Unit Test Suite for Constrained Simulated Annealing TSP Solver (Malaysia)
========================================================================
Follows AAA (Arrange-Act-Assert) pattern, covering constraint penalty terms
(uniqueness penalty & regional transit penalty) and total energy calculation.
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

class TestConstraintPenalties(unittest.TestCase):
    def test_uniqueness_penalty(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)
        invalid_tour = [0] * 20

        # Act
        penalty = solver.calculate_penalty(invalid_tour)

        # Assert
        self.assertTrue(penalty >= 10000.0)

    def test_regional_transit_penalty(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, lambda_region_penalty=500.0)
        # 0: KL (Peninsular), 4: KK (Borneo), 1: GT (Peninsular), 5: Kuching (Borneo), etc.
        alternating_tour = [0, 4, 1, 5, 2, 13, 3, 14, 6, 15, 7, 16, 8, 18, 9, 10, 11, 12, 17, 19]

        # Act
        penalty = solver.calculate_penalty(alternating_tour)

        # Assert
        self.assertTrue(penalty > 0.0)

    def test_total_energy_function(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)
        tour = list(range(20))

        # Act
        base_dist = solver.calculate_tour_distance(tour)
        penalty = solver.calculate_penalty(tour)
        total_energy = solver.calculate_total_energy(tour)

        # Assert
        self.assertEqual(total_energy, base_dist + penalty)

if __name__ == "__main__":
    unittest.main()
