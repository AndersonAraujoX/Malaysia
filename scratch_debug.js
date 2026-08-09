const { MALAYSIA_CITIES, buildFullDistanceMatrix } = require('./js/cities.js');
const { JSSimulatedAnnealingEngine } = require('./js/solver.js');

const matrix = buildFullDistanceMatrix();
const engine = new JSSimulatedAnnealingEngine(MALAYSIA_CITIES, matrix, 5000.0, 0.9995, 1000.0, 1000.0, 500.0);

engine.runSolver(50000).then(res => {
    console.log("Min history energy:", Math.min(...res.history));
    console.log("Max history energy:", Math.max(...res.history));
    console.log("Final expectation:", res.finalExpectation);
    console.log("Sample total energy:", res.bestValidSample.energy);
});
