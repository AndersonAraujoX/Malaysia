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

test('Hamiltonian Penalty Formulation - A = 1 and λ Impact', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();

    // Act 1: Run with λ = 0 (Penalties ignored)
    const engineLambda0 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 0.0);
    const resLambda0 = await engineLambda0.runSolver(20000);

    // Act 2: Run with λ = 1000 (Sufficient penalty)
    const engineLambda1000 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0);
    const resLambda1000 = await engineLambda1000.runSolver(50000);

    // Assert
    assert.ok(resLambda0.bestValidSample, `Lambda 0 sample must exist`);
    assert.ok(resLambda1000.bestValidSample, `Lambda 1000 sample must exist`);
    assert.equal(resLambda1000.bestValidSample.isValid, true, `High λ must yield valid ground state`);
});
