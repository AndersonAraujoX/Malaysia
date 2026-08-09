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

test('Hamiltonian Parameters A, B, C Dynamic Impact', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const tourWithDuplicates = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    // Act 1: A = 0
    const engineA0 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 0.0, 1000.0, 500.0);
    const h0 = engineA0.calculateHamiltonian(tourWithDuplicates);

    // Assert 1
    assert.equal(h0.hCity, 0, `When A = 0, hCity must be 0`);

    // Act 2: A = 2000
    const engineA2000 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 2000.0, 1000.0, 500.0);
    const h2000 = engineA2000.calculateHamiltonian(tourWithDuplicates);

    // Assert 2
    assert.equal(h2000.hCity, 2000.0, `When A = 2000 and 1 city missing, hCity must be 2000`);

    // Act 3: C scaling (Regional Transit Penalty)
    const validTour = Array.from({ length: 20 }, (_, i) => i); // Has 2 sea crossings
    const engineC500 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0, 1000.0, 500.0);
    const hC500 = engineC500.calculateHamiltonian(validTour);

    const engineC2000 = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0, 1000.0, 2000.0);
    const hC2000 = engineC2000.calculateHamiltonian(validTour);

    // Assert 3
    assert.ok(hC2000.hRegion > hC500.hRegion, `Higher C multiplier must increase hRegion in table`);
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
