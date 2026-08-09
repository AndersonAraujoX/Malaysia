/**
 * High-Performance Hybrid Simulated Annealing & Metaheuristic TSP Solver (JavaScript)
 * Features Dynamic Constraint Penalty Terms (Uniqueness & Regional Transit Penalty),
 * O(1) Fast Delta Evaluation, Multi-Start NN Initialization, and 2-Opt Refinement.
 */

class JSSimulatedAnnealingEngine {
    constructor(selectedCities, distMatrixFull, tInitial = 5000.0, alpha = 0.9995, lambdaPenalty = 500.0) {
        this.selectedCities = selectedCities || [];
        this.N = this.selectedCities.length;
        this.tInitial = tInitial;
        this.alpha = alpha;
        this.lambdaPenalty = lambdaPenalty;

        this.distMatrix = Array.from({ length: this.N }, () => new Float64Array(this.N));
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                const origI = this.selectedCities[i].id;
                const origJ = this.selectedCities[j].id;
                this.distMatrix[i][j] = distMatrixFull ? distMatrixFull[origI][origJ] : 0;
            }
        }
    }

    /**
     * Exact Full Tour Distance Calculation - O(N)
     */
    calculateTourDistance(tour) {
        if (!tour || tour.length === 0) return 0;
        let dist = 0.0;
        for (let k = 0; k < this.N; k++) {
            dist += this.distMatrix[tour[k]][tour[(k + 1) % this.N]];
        }
        return dist;
    }

    /**
     * Constraint Penalty Function (scaled by lambdaPenalty multiplier):
     * - At lambdaPenalty = 0: Returns 0 (no penalty enforcement; SA evaluates pure distance).
     * - At lambdaPenalty > 0: Penalizes duplicate cities & excess inter-regional crossings (> 2 crossings).
     */
    calculatePenalty(tour) {
        if (!tour || tour.length === 0 || this.lambdaPenalty === 0) return 0;

        // 1. Uniqueness Penalty
        const uniqueCount = new Set(tour).size;
        const uniquenessPenalty = (this.N - uniqueCount) * (this.lambdaPenalty * 20.0);

        // 2. Regional Transit Penalty (Peninsular vs Borneo)
        let crossings = 0;
        for (let k = 0; k < this.N; k++) {
            const r1 = this.selectedCities[tour[k]].region;
            const r2 = this.selectedCities[tour[(k + 1) % this.N]].region;
            if (r1 && r2 && r1 !== r2) {
                crossings++;
            }
        }
        const excessCrossings = Math.max(0, crossings - 2);
        const regionPenalty = excessCrossings * this.lambdaPenalty;

        return uniquenessPenalty + regionPenalty;
    }

    /**
     * Total Energy Function = Base Distance + Constraint Penalty Terms
     */
    calculateTotalEnergy(tour) {
        return this.calculateTourDistance(tour) + this.calculatePenalty(tour);
    }

    /**
     * Best Nearest Neighbor Tour across all possible starting cities - O(N^2)
     */
    getBestNearestNeighborTour() {
        if (this.N === 0) return [];
        let bestTour = [];
        let bestEnergy = Infinity;

        for (let s = 0; s < this.N; s++) {
            const unvisited = new Set(Array.from({ length: this.N }, (_, i) => i));
            const tour = [s];
            unvisited.delete(s);

            let current = s;
            while (unvisited.size > 0) {
                let nearest = -1;
                let minDist = Infinity;
                for (const nbr of unvisited) {
                    const d = this.distMatrix[current][nbr];
                    if (d < minDist) {
                        minDist = d;
                        nearest = nbr;
                    }
                }
                tour.push(nearest);
                unvisited.delete(nearest);
                current = nearest;
            }

            const energy = this.calculateTotalEnergy(tour);
            if (energy < bestEnergy) {
                bestEnergy = energy;
                bestTour = tour;
            }
        }

        return bestTour;
    }

    /**
     * Delta E evaluation for 2-Opt subsegment reversal [i, j] including Constraint Penalty Delta
     */
    evaluateDelta2Opt(tour, i, j) {
        const u = tour[(i - 1 + this.N) % this.N];
        const v = tour[i];
        const w = tour[j];
        const x = tour[(j + 1) % this.N];

        const oldDist = this.distMatrix[u][v] + this.distMatrix[w][x];
        const newDist = this.distMatrix[u][w] + this.distMatrix[v][x];
        const distDelta = newDist - oldDist;

        if (this.lambdaPenalty === 0) return distDelta;

        const newTour = this.apply2Opt(tour, i, j);
        const penaltyDelta = this.calculatePenalty(newTour) - this.calculatePenalty(tour);

        return distDelta + penaltyDelta;
    }

    /**
     * Delta E evaluation for Node Insertion including Constraint Penalty Delta
     */
    evaluateDeltaInsertion(tour, from, to) {
        if (from === to || from === (to + 1) % this.N) return 0;

        const newTour = this.applyInsertion(tour, from, to);
        return this.calculateTotalEnergy(newTour) - this.calculateTotalEnergy(tour);
    }

    apply2Opt(tour, i, j) {
        const newTour = tour.slice();
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

    applyInsertion(tour, from, to) {
        const newTour = tour.slice();
        const [node] = newTour.splice(from, 1);
        const insertIdx = to > from ? to : to + 1;
        newTour.splice(insertIdx, 0, node);
        return newTour;
    }

    /**
     * Deterministic 2-Opt local search refinement pass
     */
    refine2Opt(tour) {
        let currentTour = tour.slice();
        let currentEnergy = this.calculateTotalEnergy(currentTour);
        let improved = true;

        while (improved) {
            improved = false;
            for (let i = 0; i < this.N - 1; i++) {
                for (let j = i + 1; j < this.N; j++) {
                    if (i === 0 && j === this.N - 1) continue;
                    const deltaE = this.evaluateDelta2Opt(currentTour, i, j);
                    if (deltaE < -1e-6) {
                        currentTour = this.apply2Opt(currentTour, i, j);
                        currentEnergy += deltaE;
                        improved = true;
                    }
                }
            }
        }
        return { tour: currentTour, energy: currentEnergy };
    }

    /**
     * High-Performance Hybrid Simulated Annealing Execution with Penalty Functions
     */
    async runSolver(maxIter = 50000, onProgress = null) {
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
            const penalty = this.calculatePenalty(tour);
            const cityNames = tour.map(i => this.selectedCities[i].name);
            const sample = {
                bitstring: tour.join(' ➔ '),
                probability: 1.0,
                energy: dist + penalty,
                isValid: penalty === 0,
                tourIndices: tour,
                cityNames: cityNames,
                totalDistance: dist,
                penalty: penalty
            };
            return {
                optimalParams: [0],
                finalExpectation: dist + penalty,
                history: [dist + penalty],
                topSamples: [sample],
                bestValidSample: sample
            };
        }

        let globalBestTour = (this.lambdaPenalty === 0) ? Array.from({ length: this.N }, (_, i) => i) : this.getBestNearestNeighborTour();
        let globalBestEnergy = this.calculateTotalEnergy(globalBestTour);

        const history = [];
        const restarts = 4;
        const iterPerRestart = Math.floor(maxIter / restarts);
        const updateInterval = Math.max(1, Math.floor(maxIter / 50));

        let currentStep = 0;

        for (let r = 0; r < restarts; r++) {
            let currentTour = (r === 0) ? globalBestTour.slice() : this.apply2Opt(globalBestTour, 1, Math.floor(this.N / 2));
            let currentEnergy = this.calculateTotalEnergy(currentTour);

            let T = this.tInitial;

            for (let step = 1; step <= iterPerRestart; step++) {
                currentStep++;
                const is2Opt = Math.random() < 0.75;
                let deltaE = 0;
                let i = 0, j = 0;

                if (is2Opt) {
                    i = Math.floor(Math.random() * (this.N - 1));
                    j = Math.floor(Math.random() * (this.N - i - 1)) + i + 1;
                    if (i === 0 && j === this.N - 1) j = this.N - 2;
                    deltaE = this.evaluateDelta2Opt(currentTour, i, j);
                } else {
                    i = Math.floor(Math.random() * this.N);
                    j = Math.floor(Math.random() * this.N);
                    deltaE = this.evaluateDeltaInsertion(currentTour, i, j);
                }

                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / T)) {
                    currentTour = is2Opt ? this.apply2Opt(currentTour, i, j) : this.applyInsertion(currentTour, i, j);
                    currentEnergy += deltaE;

                    if (currentEnergy < globalBestEnergy) {
                        globalBestTour = currentTour.slice();
                        globalBestEnergy = currentEnergy;
                    }
                }

                history.push(currentEnergy);
                T *= this.alpha;

                if (onProgress && currentStep % updateInterval === 0) {
                    onProgress(currentStep, currentEnergy);
                }
            }
        }

        // Post-processing: Apply deterministic 2-Opt refinement
        const refined = this.refine2Opt(globalBestTour);
        globalBestTour = refined.tour;

        const finalDist = this.calculateTourDistance(globalBestTour);
        const finalPenalty = this.calculatePenalty(globalBestTour);

        const cityNames = globalBestTour.map(i => this.selectedCities[i].name);

        const bestSample = {
            bitstring: globalBestTour.join(' ➔ '),
            probability: 1.0,
            energy: finalDist + finalPenalty,
            isValid: finalPenalty === 0,
            tourIndices: globalBestTour,
            cityNames: cityNames,
            totalDistance: finalDist,
            penalty: finalPenalty
        };

        return {
            optimalParams: [this.tInitial * Math.pow(this.alpha, iterPerRestart)],
            finalExpectation: finalDist + finalPenalty,
            history: history,
            topSamples: [bestSample],
            bestValidSample: bestSample
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JSSimulatedAnnealingEngine };
}
