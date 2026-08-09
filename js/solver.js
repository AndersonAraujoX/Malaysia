/**
 * Simulated Annealing & Metaheuristic TSP Solver (JavaScript)
 * Traveling Salesperson Problem for Malaysian Cities
 */

class JSSimulatedAnnealingEngine {
    constructor(selectedCities, distMatrixFull, tInitial = 2000.0, alpha = 0.998) {
        this.selectedCities = selectedCities || [];
        this.N = this.selectedCities.length;
        this.tInitial = tInitial;
        this.alpha = alpha;

        this.distMatrix = Array.from({ length: this.N }, () => new Float64Array(this.N));
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                const origI = this.selectedCities[i].id;
                const origJ = this.selectedCities[j].id;
                this.distMatrix[i][j] = distMatrixFull ? distMatrixFull[origI][origJ] : 0;
            }
        }
    }

    calculateTourDistance(tour) {
        if (!tour || tour.length === 0) return 0;
        let dist = 0.0;
        for (let k = 0; k < this.N; k++) {
            dist += this.distMatrix[tour[k]][tour[(k + 1) % this.N]];
        }
        return dist;
    }

    getNeighbor2Opt(tour) {
        if (this.N < 4) return tour.slice();
        const newTour = tour.slice();
        const i = Math.floor(Math.random() * (this.N - 2)) + 1;
        const j = Math.floor(Math.random() * (this.N - i - 1)) + i + 1;
        
        let left = i, right = j;
        while (left < right) {
            const tmp = newTour[left];
            newTour[left] = newTour[right];
            newTour[right] = tmp;
            left++;
            right--;
        }
        return newTour;
    }

    async runSolver(maxIter = 5000, onProgress = null) {
        if (this.N === 0) {
            return {
                optimalParams: [0],
                finalExpectation: 0,
                history: [],
                topSamples: [],
                bestValidSample: null
            };
        }

        let currentTour = Array.from({ length: this.N }, (_, i) => i);
        let currentCost = this.calculateTourDistance(currentTour);

        let bestTour = currentTour.slice();
        let bestCost = currentCost;

        let T = this.tInitial;
        const history = [];
        const updateInterval = Math.max(1, Math.floor(maxIter / 30));

        for (let step = 1; step <= maxIter; step++) {
            const neighborTour = this.getNeighbor2Opt(currentTour);
            const neighborCost = this.calculateTourDistance(neighborTour);
            const deltaE = neighborCost - currentCost;

            if (deltaE < 0 || Math.random() < Math.exp(-deltaE / T)) {
                currentTour = neighborTour;
                currentCost = neighborCost;

                if (currentCost < bestCost) {
                    bestTour = currentTour.slice();
                    bestCost = currentCost;
                }
            }

            history.push(currentCost);
            T *= this.alpha;

            if (onProgress && step % updateInterval === 0) {
                onProgress(step, currentCost);
            }

            if (T < 1e-4) break;
        }

        const cityNames = bestTour.map(i => this.selectedCities[i].name);

        const bestSample = {
            bitstring: bestTour.join(' ➔ '),
            probability: 1.0,
            energy: bestCost,
            isValid: true,
            tourIndices: bestTour,
            cityNames: cityNames,
            totalDistance: bestCost
        };

        return {
            optimalParams: [T],
            finalExpectation: bestCost,
            history: history,
            topSamples: [bestSample],
            bestValidSample: bestSample
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JSSimulatedAnnealingEngine };
}
