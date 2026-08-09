/**
 * High-Performance Hybrid Simulated Annealing & Metaheuristic TSP Solver (JavaScript)
 * Features Explicit Hamiltonian Operator Formulation:
 * H = H_cost + A * H_city + B * H_step + C * H_region
 * Supports Unconstrained State Exploration (City Replacements & Duplicates)
 */

class JSSimulatedAnnealingEngine {
    constructor(selectedCities, distMatrixFull, tInitial = 5000.0, alpha = 0.9995, paramA = 1000.0, paramB = 1000.0, paramC = 500.0) {
        this.selectedCities = selectedCities || [];
        this.N = this.selectedCities.length;
        this.tInitial = tInitial;
        this.alpha = alpha;
        this.paramA = paramA;
        this.paramB = paramB;
        this.paramC = paramC;

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
     * H = H_cost + A * H_city + B * H_step + C * H_region
     */
    calculateHamiltonian(tour) {
        if (!tour || tour.length === 0) {
            return { hCost: 0, hCity: 0, hStep: 0, hRegion: 0, missingCities: 0, crossings: 0, totalHamiltonian: 0 };
        }

        // 1. H_cost: Physical distance
        const hCost = this.calculateTourDistance(tour);

        // 2. A * H_city: Uniqueness penalty (missing/duplicate cities)
        const uniqueSet = new Set(tour);
        const missingCities = this.N - uniqueSet.size;
        const hCity = missingCities * this.paramA;

        // 3. B * H_step: Step length mismatch penalty
        const hStep = Math.abs(this.N - tour.length) * this.paramB;

        // 4. C * H_region: Excess inter-island sea crossing penalty (> 2 crossings)
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
        const hRegion = excessCrossings * this.paramC;

        const totalHamiltonian = hCost + hCity + hStep + hRegion;

        return {
            hCost,
            hCity,
            hStep,
            hRegion,
            missingCities,
            crossings,
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
        newTour.splice(to, 0, node);
        return newTour;
    }

    applyReplacement(tour, idx, newCityId) {
        const newTour = tour.slice();
        newTour[idx] = newCityId;
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
                    const candidate = this.apply2Opt(currentTour, i, j);
                    const candidateEnergy = this.calculateTotalEnergy(candidate);
                    if (candidateEnergy < currentEnergy - 1e-6) {
                        currentTour = candidate;
                        currentEnergy = candidateEnergy;
                        improved = true;
                    }
                }
            }
        }
        return { tour: currentTour, energy: currentEnergy };
    }

    /**
     * High-Performance Hybrid Simulated Annealing Execution for Hamiltonian Ground State
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
                isValid: (h.hCity === 0 && h.hStep === 0 && h.hRegion === 0),
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

        let globalBestTour = (this.paramA === 0 && this.paramB === 0 && this.paramC === 0) ? 
            Array.from({ length: this.N }, (_, i) => i) : 
            this.getBestNearestNeighborTour();
            
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
                const moveProb = Math.random();
                let candidateTour;

                if (moveProb < 0.65) {
                    let i = Math.floor(Math.random() * (this.N - 1));
                    let j = Math.floor(Math.random() * (this.N - i - 1)) + i + 1;
                    if (i === 0 && j === this.N - 1) j = this.N - 2;
                    candidateTour = this.apply2Opt(currentTour, i, j);
                } else if (moveProb < 0.85) {
                    let i = Math.floor(Math.random() * this.N);
                    let j = Math.floor(Math.random() * this.N);
                    candidateTour = this.applyInsertion(currentTour, i, j);
                } else {
                    let i = Math.floor(Math.random() * this.N);
                    let newCityId = Math.floor(Math.random() * this.N);
                    candidateTour = this.applyReplacement(currentTour, i, newCityId);
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

        if (this.paramA >= 1000) {
            const refined = this.refine2Opt(globalBestTour);
            globalBestTour = refined.tour;
        }

        const hFinal = this.calculateHamiltonian(globalBestTour);
        const cityNames = globalBestTour.map(i => this.selectedCities[i].name);

        const bestSample = {
            bitstring: globalBestTour.join(' ➔ '),
            probability: 1.0,
            energy: hFinal.totalHamiltonian,
            isValid: (hFinal.hCity === 0 && hFinal.hStep === 0 && hFinal.hRegion === 0),
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
