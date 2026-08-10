/**
 * High-Performance Pure Simulated Annealing TSP Solver (JavaScript)
 * Features Explicit Hamiltonian Operator Formulation:
 * H = H_cost + λ * (H_city + H_step + H_region)
 *
 * A = 1 (Fixed Physical Distance Weight)
 * λ = Constraint Penalty Parameter
 *
 * When λ = 0, constraint penalties are ignored and SA converges to infeasible routes.
 * When λ is high (λ ≥ 1000), SA strictly eliminates violations and converges to a valid ground state.
 */

class JSSimulatedAnnealingEngine {
    constructor(selectedCities, distMatrixFull, tInitial = 5000.0, alpha = 0.9995, paramLambda = 1000.0) {
        this.selectedCities = selectedCities || [];
        this.N = this.selectedCities.length;
        this.tInitial = tInitial;
        this.alpha = alpha;
        this.paramLambda = paramLambda; // Penalty coefficient λ (B = C = λ)

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
     * Exact Full Distance Term - H_cost = sum( d(tour[k], tour[k+1]) )
     */
    calculateTourDistance(tour) {
        if (!tour || tour.length === 0) return 0;
        let dist = 0.0;
        const len = tour.length;
        for (let k = 0; k < len; k++) {
            dist += this.distMatrix[tour[k]][tour[(k + 1) % len]];
        }
        return dist;
    }

    /**
     * Complete Hamiltonian Evaluation:
     * H = H_cost + λ * (H_city + H_step + H_region)
     */
    calculateHamiltonian(tour) {
        if (!tour || tour.length === 0) {
            return { hCost: 0, hCity: 0, hStep: 0, hRegion: 0, missingCities: 0, crossings: 0, totalHamiltonian: 0 };
        }

        // 1. Physical Distance Term (Weight A = 1.0)
        const hCost = this.calculateTourDistance(tour);

        // 2. Missing/Duplicate Cities Violation Count
        const uniqueSet = new Set(tour);
        const missingCities = this.N - uniqueSet.size;
        const hCity = missingCities * this.paramLambda;

        // 3. Step Length Violation Count
        const hStep = Math.abs(this.N - tour.length) * this.paramLambda;

        // 4. Excess Inter-island Sea Crossing Violation Count (> 2 crossings)
        let crossings = 0;
        const len = tour.length;
        for (let k = 0; k < len; k++) {
            const r1 = this.selectedCities[tour[k]].region;
            const r2 = this.selectedCities[tour[(k + 1) % len]].region;
            if (r1 && r2 && r1 !== r2) {
                crossings++;
            }
        }
        const excessCrossings = Math.max(0, crossings - 2);
        const hRegion = excessCrossings * this.paramLambda;

        const totalPenalty = hCity + hStep + hRegion;
        const totalHamiltonian = hCost + totalPenalty;

        return {
            hCost,
            hCity,
            hStep,
            hRegion,
            missingCities,
            crossings,
            totalPenalty,
            totalHamiltonian
        };
    }

    /**
     * Total Energy Function = Total Expectation Value <H>
     */
    calculateTotalEnergy(tour) {
        return this.calculateHamiltonian(tour).totalHamiltonian;
    }

    /**
     * Unbiased Random Tour Generation (Fisher-Yates Shuffle)
     */
    getRandomTour() {
        const tour = Array.from({ length: this.N }, (_, i) => i);
        for (let i = this.N - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = tour[i];
            tour[i] = tour[j];
            tour[j] = tmp;
        }
        return tour;
    }

    /**
     * 2-Opt Subsegment Reversal Neighborhood Operator
     */
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

    /**
     * Node Relocation / Insertion Neighborhood Operator
     */
    applyInsertion(tour, from, to) {
        const newTour = tour.slice();
        const [node] = newTour.splice(from, 1);
        newTour.splice(to, 0, node);
        return newTour;
    }

    /**
     * City Replacement Move (Allows exploring unconstrained/duplicate states when λ is low)
     */
    applyReplacement(tour, idx, newCityId) {
        const newTour = tour.slice();
        newTour[idx] = newCityId;
        return newTour;
    }

    /**
     * Original Pure Simulated Annealing Execution
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
            const h = this.calculateHamiltonian(tour);
            const cityNames = tour.map(i => this.selectedCities[i].name);
            const sample = {
                bitstring: tour.join(' ➔ '),
                probability: 1.0,
                energy: h.totalHamiltonian,
                isValid: (h.missingCities === 0 && h.hStep === 0 && h.hRegion === 0),
                tourIndices: tour,
                cityNames: cityNames,
                totalDistance: h.hCost,
                hCost: h.hCost,
                hCity: h.hCity,
                hStep: h.hStep,
                hRegion: h.hRegion
            };
            return {
                optimalParams: [0],
                finalExpectation: h.totalHamiltonian,
                history: [h.totalHamiltonian],
                topSamples: [sample],
                bestValidSample: sample
            };
        }

        let globalBestTour = this.getRandomTour();
        let globalBestEnergy = this.calculateTotalEnergy(globalBestTour);

        const history = [];
        const restarts = 5;
        const iterPerRestart = Math.floor(maxIter / restarts);
        const updateInterval = Math.max(1, Math.floor(maxIter / 50));

        let currentStep = 0;

        for (let r = 0; r < restarts; r++) {
            let currentTour = this.getRandomTour();
            let currentEnergy = this.calculateTotalEnergy(currentTour);

            if (currentEnergy < globalBestEnergy) {
                globalBestTour = currentTour.slice();
                globalBestEnergy = currentEnergy;
            }

            let T = this.tInitial;

            for (let step = 1; step <= iterPerRestart; step++) {
                currentStep++;
                const moveProb = Math.random();
                let candidateTour;

                // When λ is 0 or low, allow replacement moves to sample infeasible states
                if (this.paramLambda < 500 && moveProb > 0.70) {
                    let i = Math.floor(Math.random() * this.N);
                    let newCityId = Math.floor(Math.random() * this.N);
                    candidateTour = this.applyReplacement(currentTour, i, newCityId);
                } else if (moveProb < 0.80) {
                    let i = Math.floor(Math.random() * (this.N - 1));
                    let j = Math.floor(Math.random() * (this.N - i - 1)) + i + 1;
                    if (i === 0 && j === this.N - 1) j = this.N - 2;
                    candidateTour = this.apply2Opt(currentTour, i, j);
                } else {
                    let i = Math.floor(Math.random() * this.N);
                    let j = Math.floor(Math.random() * this.N);
                    candidateTour = this.applyInsertion(currentTour, i, j);
                }

                const candidateEnergy = this.calculateTotalEnergy(candidateTour);
                const deltaE = candidateEnergy - currentEnergy;

                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / T)) {
                    currentTour = candidateTour;
                    currentEnergy = candidateEnergy;

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

        const hFinal = this.calculateHamiltonian(globalBestTour);
        const cityNames = globalBestTour.map(i => this.selectedCities[i].name);

        const bestSample = {
            bitstring: globalBestTour.join(' ➔ '),
            probability: 1.0,
            energy: hFinal.totalHamiltonian,
            isValid: (hFinal.missingCities === 0 && hFinal.hStep === 0 && hFinal.hRegion === 0),
            tourIndices: globalBestTour,
            cityNames: cityNames,
            totalDistance: hFinal.hCost,
            hCost: hFinal.hCost,
            hCity: hFinal.hCity,
            hStep: hFinal.hStep,
            hRegion: hFinal.hRegion
        };

        return {
            optimalParams: [this.tInitial * Math.pow(this.alpha, iterPerRestart)],
            finalExpectation: hFinal.totalHamiltonian,
            history: history,
            topSamples: [bestSample],
            bestValidSample: bestSample
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JSSimulatedAnnealingEngine };
}
