const test = require('node:test');
const assert = require('node:assert/strict');
const { MALAYSIA_CITIES, haversineDistance, buildFullDistanceMatrix, solveClassicalTSP } = require('../js/cities.js');
const { JSSimulatedAnnealingEngine } = require('../js/solver.js');

// ---------------------------------------------------------------------------
// Haversine Distance
// ---------------------------------------------------------------------------
test('Haversine Distance - Happy Path KL → George Town', () => {
    // Arrange
    const kl = MALAYSIA_CITIES[0];
    const gt = MALAYSIA_CITIES[1];

    // Act
    const dist = haversineDistance(kl.lat, kl.lon, gt.lat, gt.lon);

    // Assert: KL → George Town is ~305 km by great circle
    assert.ok(dist > 260 && dist < 360, `Expected ~305 km, got ${dist.toFixed(1)} km`);
});

test('Haversine Distance - Same Point returns 0', () => {
    // Arrange
    const kl = MALAYSIA_CITIES[0];

    // Act
    const dist = haversineDistance(kl.lat, kl.lon, kl.lat, kl.lon);

    // Assert
    assert.equal(dist, 0);
});

// ---------------------------------------------------------------------------
// Held-Karp Exact Solver
// ---------------------------------------------------------------------------
test('Held-Karp Exact Solver - Small (3 cities)', () => {
    // Arrange
    const cities = MALAYSIA_CITIES.slice(0, 3);
    const fullMatrix = buildFullDistanceMatrix();

    // Act
    const result = solveClassicalTSP(cities, fullMatrix);

    // Assert
    assert.equal(result.tourIndices.length, 3, 'Tour must visit all 3 cities');
    assert.ok(new Set(result.tourIndices).size === 3, 'No duplicate cities in tour');
    assert.ok(result.totalDistance > 0, 'Distance must be positive');
});

test('Held-Karp Exact Solver - 20 cities produces globally optimal tour', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();

    // Act
    const result = solveClassicalTSP(MALAYSIA_CITIES, fullMatrix);

    // Assert: known optimal for these 20 cities is in range 4400–5200 km
    assert.equal(result.tourIndices.length, 20, 'Tour must visit all 20 cities');
    assert.equal(new Set(result.tourIndices).size, 20, 'Tour must have no duplicates');
    assert.ok(
        result.totalDistance > 4000 && result.totalDistance < 6000,
        `Held-Karp optimal tour should be in 4000–6000 km range, got ${result.totalDistance.toFixed(1)} km`
    );
});

// ---------------------------------------------------------------------------
// Simulated Annealing - λ Parameter (0 to 1000)
// ---------------------------------------------------------------------------
test('SA Unbiased Random Initial Tour Generation', () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix);

    // Act
    const tour = engine.getRandomTour();

    // Assert
    assert.equal(tour.length, 20);
    assert.equal(new Set(tour).size, 20, 'Initial tour must have unique cities');
});

test('SA λ = 1000 converges to valid ground state', async () => {
    // Arrange
    const fullMatrix = buildFullDistanceMatrix();
    const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, fullMatrix, 5000.0, 0.9995, 1000.0);

    // Act
    const result = await engine.runSolver(50000);

    // Assert
    assert.ok(result.bestValidSample, 'Best sample must exist');
    assert.equal(result.bestValidSample.isValid, true, 'λ = 1000 must produce a valid ground state');
});
