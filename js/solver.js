/**
 * High-Performance Simulated Annealing & Metaheuristic TSP Solver (JavaScript)
 * Traveling Salesperson Problem for Malaysian Cities
 */

class JSSimulatedAnnealingEngine {
    constructor(selectedCities, distMatrixFull, tInitial = 5000.0, alpha = 0.9992) {
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

    /**
     * Generates Nearest Neighbor initial tour for faster convergence
     */
    getNearestNeighborTour(startIdx = 0) {
        if (this.N === 0) return [];
        const unvisited = new Set(Array.from({ length: this.N }, (_, i) => i));
        const tour = [startIdx];
        unvisited.delete(startIdx);

        let current = startIdx;
        while (unvisited.size > 0) {
            let nearest = -1;
            let minDist = Infinity;
            for (const neighbor of unvisited) {
                const d = this.distMatrix[current][neighbor];
                if (d < minDist) {
                    minDist = d;
                    nearest = neighbor;
                }
            }
            tour.push(nearest);
            unvisited.delete(nearest);
            current = nearest;
        }
        return tour;
    }

    /**
     * Unbiased 2-Opt subsegment reversal across all indices [0 .. N-1]
     */
    getNeighbor2Opt(tour) {
        if (this.N < 4) return tour.slice();
        const newTour = tour.slice();
        
        let i = Math.floor(Math.random() * (this.N - 1));
        let j = Math.floor(Math.random() * (this.N - i - 1)) + i + 1;
        
        // Avoid reversing the entire cycle (which yields identical distance)
        if (i === 0 && j === this.N - 1) {
            j = this.N - 2;
        }
        
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

    /**
     * Executes multi-start Simulated Annealing optimization with reheating
     */
    async runSolver(maxIter = 15000, onProgress = null) {
        if (this.N === 0) {
            return {
                optimalParams: [0],
                finalExpectation: 0,
                history: [],
                topSamples: [],
                bestValidSample: null
            };
        }

        if (this.N <= 3) {
            const tour = Array.from({ length: this.N }, (_, i) => i);
            const dist = this.calculateTourDistance(tour);
            const cityNames = tour.map(i => this.selectedCities[i].name);
            const sample = {
                bitstring: tour.join(' ➔ '),
                probability: 1.0,
                energy: dist,
                isValid: true,
                tourIndices: tour,
                cityNames: cityNames,
                totalDistance: dist
            };
            return {
                optimalParams: [0],
                finalExpectation: dist,
                history: [dist],
                topSamples: [sample],
                bestValidSample: sample
            };
        }

        let globalBestTour = this.getNearestNeighborTour(0);
        let globalBestCost = this.calculateTourDistance(globalBestTour);

        const history = [];
        const restarts = 3;
        const iterPerRestart = Math.floor(maxIter / restarts);
        const updateInterval = Math.max(1, Math.floor(maxIter / 50));

        let currentStep = 0;

        for (let r = 0; r < restarts; r++) {
            // Start each restart with a different initial heuristic tour or perturbed best
            let currentTour = (r === 0) ? globalBestTour.slice() : this.getNeighbor2Opt(globalBestTour);
            let currentCost = this.calculateTourDistance(currentTour);

            let T = this.tInitial;

            for (let step = 1; step <= iterPerRestart; step++) {
                currentStep++;
                const neighborTour = this.getNeighbor2Opt(currentTour);
                const neighborCost = this.calculateTourDistance(neighborTour);
                const deltaE = neighborCost - currentCost;

                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / T)) {
                    currentTour = neighborTour;
                    currentCost = neighborCost;

                    if (currentCost < globalBestCost) {
                        globalBestTour = currentTour.slice();
                        globalBestCost = currentCost;
                    }
                }

                history.push(currentCost);
                T *= this.alpha;

                if (onProgress && currentStep % updateInterval === 0) {
                    onProgress(currentStep, currentCost);
                }

                if (T < 1e-5) break;
            }
        }

        const cityNames = globalBestTour.map(i => this.selectedCities[i].name);

        const bestSample = {
            bitstring: globalBestTour.join(' ➔ '),
            probability: 1.0,
            energy: globalBestCost,
            isValid: true,
            tourIndices: globalBestTour,
            cityNames: cityNames,
            totalDistance: globalBestCost
        };

        return {
            optimalParams: [this.tInitial * Math.pow(this.alpha, iterPerRestart)],
            finalExpectation: globalBestCost,
            history: history,
            topSamples: [bestSample],
            bestValidSample: bestSample
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JSSimulatedAnnealingEngine };
}
