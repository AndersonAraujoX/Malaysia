const test = require('node:test');
const assert = require('node:assert/strict');
const { MALAYSIA_CITIES, haversineDistance, buildFullDistanceMatrix } = require('../js/cities.js');
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

test('Unbiased Random Initial Tour Generation', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix);

    // Act
    const tour = engine.getRandomTour();

    // Assert
    assert.equal(tour.length, 20, `Initial tour must contain 20 cities`);
    assert.equal(new Set(tour).size, 20, `Initial tour must contain unique cities`);
});

test('2-Opt Subsegment Reversal Neighborhood Operator', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix);
    const initialTour = [0, 1, 2, 3, 4, 5];

    // Act
    const reversed = engine.apply2Opt(initialTour, 1, 4);

    // Assert
    assert.deepEqual(reversed, [0, 4, 3, 2, 1, 5], `2-Opt should reverse subsegment [1..4]`);
});

test('Pure Simulated Annealing Ground State Convergence', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995);

    // Act
    const res = await engine.runSolver(50000);

    // Assert
    assert.ok(res.bestValidSample, `Solver must return bestValidSample`);
    assert.equal(res.bestValidSample.tourIndices.length, 20);
    assert.ok(res.bestValidSample.totalDistance > 0);
    assert.equal(res.bestValidSample.isValid, true);
    assert.ok(res.bestValidSample.hCost < 6000, `Pure SA with 2-Opt should converge to a good ground state distance (< 6000km), got ${res.bestValidSample.hCost}`);
});
