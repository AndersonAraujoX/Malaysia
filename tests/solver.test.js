const test = require('node:test');
const assert = require('node:assert/strict');
const { MALAYSIA_CITIES, haversineDistance, buildFullDistanceMatrix, solveClassicalTSP } = require('../js/cities.js');
const { JSSimulatedAnnealingEngine } = require('../js/solver.js');

test('Haversine Distance - Happy Path', () => {
    // Arrange
    const kl = MALAYSIA_CITIES[0]; // Kuala Lumpur
    const gt = MALAYSIA_CITIES[1]; // George Town

    // Act
    const dist = haversineDistance(kl.lat, kl.lon, gt.lat, gt.lon);

    // Assert
    assert.ok(dist > 250 && dist < 400, `Distance should be ~300km, got ${dist}`);
});

test('Constraint Penalty Terms - Zero Lambda vs Active Lambda', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const alternatingTour = [0, 4, 1, 5, 2, 13, 3, 14, 6, 15, 7, 16, 8, 18, 9, 10, 11, 12, 17, 19];

    // Act 1: Lambda = 0
    const engineZero = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 0.0);
    const penaltyZero = engineZero.calculatePenalty(alternatingTour);

    // Assert 1
    assert.equal(penaltyZero, 0, `When lambda = 0, penalty must be 0`);

    // Act 2: Lambda = 500
    const engineActive = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 500.0);
    const penaltyActive = engineActive.calculatePenalty(alternatingTour);

    // Assert 2
    assert.ok(penaltyActive > 0, `When lambda > 0, penalty must be active`);
});

test('Total Energy Function = Distance + Penalty', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 500.0);
    const tour = Array.from({ length: 20 }, (_, i) => i);

    // Act
    const baseDist = engine.calculateTourDistance(tour);
    const penalty = engine.calculatePenalty(tour);
    const totalEnergy = engine.calculateTotalEnergy(tour);

    // Assert
    assert.equal(totalEnergy, baseDist + penalty);
});

test('Constrained Hybrid JSSimulatedAnnealingEngine - Dynamic Lambda Run', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 500.0);

    // Act
    const res = await engine.runSolver(5000);

    // Assert
    assert.ok(res.bestValidSample);
    assert.equal(res.bestValidSample.tourIndices.length, 20);
    assert.ok(res.bestValidSample.totalDistance > 0);
    assert.equal(res.bestValidSample.isValid, true);
});
