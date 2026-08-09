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

test('Constraint Penalty Terms - Uniqueness & Regional Transit', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 500.0);

    // Act 1: Duplicate city index (Invalid tour)
    const invalidTour = Array(20).fill(0);
    const uniquenessPenalty = engine.calculatePenalty(invalidTour);

    // Assert 1
    assert.ok(uniquenessPenalty >= 10000.0, `Should heavily penalize non-unique tours`);

    // Act 2: Alternating Peninsular <-> Borneo crossings (High regional transit penalty)
    // 0: KL (Peninsular), 4: KK (Borneo), 1: GT (Peninsular), 5: Kuching (Borneo), etc.
    const alternatingTour = [0, 4, 1, 5, 2, 13, 3, 14, 6, 15, 7, 16, 8, 18, 9, 10, 11, 12, 17, 19];
    const transitPenalty = engine.calculatePenalty(alternatingTour);

    // Assert 2
    assert.ok(transitPenalty > 0, `Should penalize excess inter-region crossings`);
});

test('Total Energy Function = Distance + Penalty', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix);
    const tour = Array.from({ length: 20 }, (_, i) => i);

    // Act
    const baseDist = engine.calculateTourDistance(tour);
    const penalty = engine.calculatePenalty(tour);
    const totalEnergy = engine.calculateTotalEnergy(tour);

    // Assert
    assert.equal(totalEnergy, baseDist + penalty);
});

test('Constrained Hybrid JSSimulatedAnnealingEngine - Full Run', async () => {
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
