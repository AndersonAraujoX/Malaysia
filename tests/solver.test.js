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

test('Solve Classical TSP - Happy Path (Small Subset <= 8 cities)', () => {
    // Arrange
    const selected = MALAYSIA_CITIES.slice(0, 5);
    const fullMatrix = buildFullDistanceMatrix();

    // Act
    const result = solveClassicalTSP(selected, fullMatrix);

    // Assert
    assert.equal(result.tourIndices.length, 5);
    assert.equal(result.cityNames.length, 5);
    assert.ok(result.totalDistance > 0);
});

test('Solve Classical TSP - Edge Case: Empty Selection', () => {
    // Arrange
    const selected = [];
    const fullMatrix = buildFullDistanceMatrix();

    // Act
    const result = solveClassicalTSP(selected, fullMatrix);

    // Assert
    assert.equal(result.totalDistance, 0);
    assert.equal(result.tourIndices.length, 0);
});

test('JSSimulatedAnnealingEngine - Happy Path (Full 20 Cities)', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 1000.0, 0.99);

    // Act
    const res = await engine.runSolver(500);

    // Assert
    assert.ok(res.bestValidSample);
    assert.equal(res.bestValidSample.tourIndices.length, 20);
    assert.ok(res.bestValidSample.totalDistance > 0);
    assert.ok(res.history.length > 0);
});

test('JSSimulatedAnnealingEngine - Edge Case: Single City', async () => {
    // Arrange
    const selected = [MALAYSIA_CITIES[0]];
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(selected, fullMatrix, 100.0, 0.9);

    // Act
    const res = await engine.runSolver(50);

    // Assert
    assert.equal(res.bestValidSample.totalDistance, 0);
});
