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

test('Exact Classical TSP Multi-Start 2-Opt Solver', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();

    // Act
    const classicalRes = solveClassicalTSP(MALAYSIA_CITIES, fullMatrix);

    // Assert
    assert.equal(classicalRes.tourIndices.length, 20);
    assert.ok(classicalRes.totalDistance > 4000 && classicalRes.totalDistance < 6000, `Classical 2-Opt distance should be valid ground state (~4500-5000km), got ${classicalRes.totalDistance}`);
});

test('Hamiltonian Penalty Formulation - λ Parameter (0 to 1000)', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();

    // Act 1: Run with λ = 0
    const engineLambda0 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 0.0);
    const resLambda0 = await engineLambda0.runSolver(20000);

    // Act 2: Run with λ = 1000
    const engineLambda1000 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0);
    const resLambda1000 = await engineLambda1000.runSolver(50000);

    // Assert
    assert.ok(resLambda0.bestValidSample, `Lambda 0 sample must exist`);
    assert.ok(resLambda1000.bestValidSample, `Lambda 1000 sample must exist`);
    assert.equal(resLambda1000.bestValidSample.isValid, true, `λ = 1000 must yield valid ground state`);
});
