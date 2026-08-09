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

test('Haversine Distance - Edge Case: Same Location', () => {
    // Arrange
    const kl = MALAYSIA_CITIES[0];

    // Act
    const dist = haversineDistance(kl.lat, kl.lon, kl.lat, kl.lon);

    // Assert
    assert.equal(dist, 0);
});

test('Build Full Distance Matrix - Happy Path', () => {
    // Arrange & Act
    const matrix = buildFullDistanceMatrix();

    // Assert
    assert.equal(matrix.length, 20);
    assert.equal(matrix[0].length, 20);
    assert.equal(matrix[0][0], 0);
    assert.ok(matrix[0][1] > 0);
});

test('O(1) Delta 2-Opt Evaluation - Consistency Test', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix);
    const tour = Array.from({ length: 20 }, (_, i) => i);
    const initialDist = engine.calculateTourDistance(tour);

    // Act
    const deltaE = engine.evaluateDelta2Opt(tour, 2, 8);
    const newTour = engine.apply2Opt(tour, 2, 8);
    const newDist = engine.calculateTourDistance(newTour);

    // Assert
    assert.ok(Math.abs((newDist - initialDist) - deltaE) < 1e-5, `Delta math discrepancy!`);
});

test('Best Nearest Neighbor Selection across all starts', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix);

    // Act
    const bestNN = engine.getBestNearestNeighborTour();

    // Assert
    assert.equal(bestNN.length, 20);
    assert.ok(engine.calculateTourDistance(bestNN) > 0);
});

test('Hybrid JSSimulatedAnnealingEngine - Full 20 Cities', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995);

    // Act
    const res = await engine.runSolver(5000);

    // Assert
    assert.ok(res.bestValidSample);
    assert.equal(res.bestValidSample.tourIndices.length, 20);
    assert.ok(res.bestValidSample.totalDistance > 0);
    assert.ok(res.history.length > 0);
});
