#!/usr/bin/env python3
"""
Unit Test Suite for Simulated Annealing TSP Solver (Malaysia)
=============================================================
Follows AAA (Arrange-Act-Assert) pattern, covering happy paths, edge cases,
nearest neighbor heuristic, and boundary behavior.
"""

import unittest
import numpy as np
from sa_malaysia import CITIES, haversine_distance, build_distance_matrix, SimulatedAnnealingTSPSolver

class TestHaversineDistance(unittest.TestCase):
    def test_haversine_happy_path(self):
        # Arrange
        kl = CITIES[0] # Kuala Lumpur
        gt = CITIES[1] # George Town

        # Act
        dist = haversine_distance(kl["lat"], kl["lon"], gt["lat"], gt["lon"])

        # Assert
        self.assertTrue(250.0 < dist < 400.0, f"Expected ~300km, got {dist}")

    def test_haversine_same_coordinates_edge_case(self):
        # Arrange
        kl = CITIES[0]

        # Act
        dist = haversine_distance(kl["lat"], kl["lon"], kl["lat"], kl["lon"])

        # Assert
        self.assertEqual(dist, 0.0)

class TestDistanceMatrix(unittest.TestCase):
    def test_build_distance_matrix_happy_path(self):
        # Arrange & Act
        matrix = build_distance_matrix(CITIES)

        # Assert
        self.assertEqual(matrix.shape, (20, 20))
        self.assertEqual(matrix[0, 0], 0.0)
        self.assertTrue(matrix[0, 1] > 0.0)

class TestSimulatedAnnealingSolver(unittest.TestCase):
    def test_nearest_neighbor_tour_happy_path(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix)

        # Act
        tour = solver.get_nearest_neighbor_tour(0)
        dist = solver.calculate_tour_distance(tour)

        # Assert
        self.assertEqual(len(tour), 20)
        self.assertTrue(dist > 0.0)

    def test_solver_happy_path(self):
        # Arrange
        matrix = build_distance_matrix(CITIES)
        solver = SimulatedAnnealingTSPSolver(CITIES, matrix, t_initial=5000.0, alpha=0.9992, max_iter=1500)

        # Act
        result = solver.solve()

        # Assert
        self.assertEqual(len(result["best_tour_indices"]), 20)
        self.assertEqual(len(result["best_tour_names"]), 20)
        self.assertTrue(result["best_distance_km"] > 0.0)
        self.assertTrue(len(result["history"]) > 0)

    def test_solver_edge_case_empty_cities(self):
        # Arrange
        empty_cities = []
        matrix = np.zeros((0, 0))
        solver = SimulatedAnnealingTSPSolver(empty_cities, matrix)

        # Act
        result = solver.solve()

        # Assert
        self.assertEqual(result["best_tour_indices"], [])
        self.assertEqual(result["best_distance_km"], 0.0)

    def test_solver_edge_case_small_subset(self):
        # Arrange
        small_cities = CITIES[:3]
        matrix = build_distance_matrix(small_cities)
        solver = SimulatedAnnealingTSPSolver(small_cities, matrix, max_iter=50)

        # Act
        result = solver.solve()

        # Assert
        self.assertEqual(len(result["best_tour_indices"]), 3)
        self.assertTrue(result["best_distance_km"] > 0.0)

if __name__ == "__main__":
    unittest.main()
