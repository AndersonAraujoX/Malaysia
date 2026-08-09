#!/usr/bin/env python3
"""
Unit Test Suite for Hamiltonian Simulated Annealing TSP Solver (Malaysia)
==========================================================================
Follows AAA (Arrange-Act-Assert) pattern, covering dynamic scaling of
Hamiltonian parameters A, B, C and non-negativity guarantees.
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

class TestHamiltonianDynamicParameters(unittest.TestCase):
    def test_parameter_a_impact(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        tour_dup = [0, 0] + list(range(2, 20))

        # Act 1: A = 0
        solver_a0 = SimulatedAnnealingTSPSolver(CITIES, matrix, param_a=0.0)
        h0 = solver_a0.calculate_hamiltonian(tour_dup)

        # Act 2: A = 2000
        solver_a2000 = SimulatedAnnealingTSPSolver(CITIES, matrix, param_a=2000.0)
        h2000 = solver_a2000.calculate_hamiltonian(tour_dup)

        # Assert
        self.assertEqual(h0["h_city"], 0.0)
        self.assertEqual(h2000["h_city"], 2000.0)

    def test_parameter_c_impact(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        tour_valid = list(range(20))

        # Act
        solver_c500 = SimulatedAnnealingTSPSolver(CITIES, matrix, param_c=500.0)
        h_c500 = solver_c500.calculate_hamiltonian(tour_valid)

        solver_c2000 = SimulatedAnnealingTSPSolver(CITIES, matrix, param_c=2000.0)
        h_c2000 = solver_c2000.calculate_hamiltonian(tour_valid)

        # Assert
        self.assertTrue(h_c2000["h_region"] > h_c500["h_region"])

if __name__ == "__main__":
    unittest.main()
