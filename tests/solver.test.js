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

test('Hamiltonian Calculation Breakdown - H_cost, H_city, H_step, H_region', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0, 1000.0, 500.0);
    const tour = Array.from({ length: 20 }, (_, i) => i);

    // Act
    const h = engine.calculateHamiltonian(tour);

    // Assert
    assert.ok(h.hCost > 0, `H_cost must be positive physical distance`);
    assert.equal(h.hCity, 0, `H_city should be 0 for valid permutation`);
    assert.equal(h.hStep, 0, `H_step should be 0 for valid tour length`);
    assert.ok(h.totalHamiltonian >= h.hCost, `Total Hamiltonian must equal or exceed H_cost`);
});

test('Energy History Non-Negativity Guarantee', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0, 1000.0, 500.0);

    // Act
    const res = await engine.runSolver(3000);

    // Assert
    const minEnergy = Math.min(...res.history);
    assert.ok(minEnergy >= 0, `History energy must NEVER drop below zero, got ${minEnergy}`);
});

test('Hamiltonian Ground State Solver Run', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0, 1000.0, 500.0);

    // Act
    const res = await engine.runSolver(5000);

    // Assert
    assert.ok(res.bestValidSample);
    assert.equal(res.bestValidSample.tourIndices.length, 20);
    assert.ok(res.bestValidSample.totalDistance > 0);
    assert.equal(res.bestValidSample.isValid, true);
});
