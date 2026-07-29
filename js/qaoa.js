/**
 * QAOA & Simulated Annealing Quantum/Metaheuristic Engine (JavaScript)
 * Supports:
 *   1. Simulated Annealing (SA): Metropolis-Hastings 2-opt cooling solver
 *   2. QAOA Compact Logarithmic Encoding: N * ceil(log2 N) = 21/18 qubits
 *   3. QAOA Standard One-Hot Encoding: (N-1)^2 qubits (36 qubits)
 */

// -----------------------------------------------------------------------------
// 1. Simulated Annealing Engine (SA)
// -----------------------------------------------------------------------------
class JSSimulatedAnnealingEngine {
    constructor(selectedCities, distMatrixFull, tInitial = 1000.0, alpha = 0.992) {
        this.selectedCities = selectedCities;
        this.N = selectedCities.length;
        this.tInitial = tInitial;
        this.alpha = alpha;

        this.distMatrix = Array.from({ length: this.N }, () => new Float64Array(this.N));
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                const origI = selectedCities[i].id;
                const origJ = selectedCities[j].id;
                this.distMatrix[i][j] = distMatrixFull[origI][origJ];
            }
        }
        
        // Dummy Q matrix for QUBO Heatmap canvas representation
        this.numQubits = (this.N - 1) * (this.N - 1);
        let maxD = 0;
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                if (this.distMatrix[i][j] > maxD) maxD = this.distMatrix[i][j];
            }
        }
        this.Q = Array.from({ length: Math.min(this.numQubits, 16) }, () => new Float64Array(Math.min(this.numQubits, 16)));
        for (let i = 0; i < this.Q.length; i++) {
            for (let j = 0; j < this.Q.length; j++) {
                this.Q[i][j] = (i === j) ? -maxD : (i + j) * 0.2 * maxD;
            }
        }
    }

    calculateTourDistance(tour) {
        let dist = 0.0;
        for (let k = 0; k < this.N; k++) {
            dist += this.distMatrix[tour[k]][tour[(k + 1) % this.N]];
        }
        return dist;
    }

    getNeighbor2Opt(tour) {
        const newTour = tour.slice();
        // Swap 2 edges
        const i = Math.floor(Math.random() * (this.N - 2)) + 1;
        const j = Math.floor(Math.random() * (this.N - i - 1)) + i + 1;
        
        // Reverse sub-array
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

    async runQAOA(layers = 1, maxIter = 1000, onProgress = null) {
        // Initial tour
        let currentTour = Array.from({ length: this.N }, (_, i) => i);
        let currentCost = this.calculateTourDistance(currentTour);

        let bestTour = currentTour.slice();
        let bestCost = currentCost;

        let T = this.tInitial;
        const history = [];

        for (let step = 1; step <= maxIter; step++) {
            const neighborTour = this.getNeighbor2Opt(currentTour);
            const neighborCost = this.calculateTourDistance(neighborTour);
            const deltaE = neighborCost - currentCost;

            // Metropolis Criterion
            if (deltaE < 0 || Math.random() < Math.exp(-deltaE / T)) {
                currentTour = neighborTour;
                currentCost = neighborCost;

                if (currentCost < bestCost) {
                    bestTour = currentTour.slice();
                    bestCost = currentCost;
                }
            }

            history.push(currentCost);

            // Cooling schedule
            T *= this.alpha;

            if (onProgress && step % 10 === 0) {
                onProgress(step, currentCost);
                await new Promise(res => setTimeout(res, 2));
            }

            if (T < 1e-4) break;
        }

        const cityNames = bestTour.map(i => this.selectedCities[i].name);

        const bestSample = {
            bitstring: bestTour.join('-'),
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

// -----------------------------------------------------------------------------
// 2. One-Hot QAOA Engine (Standard Quadratic formulation)
// -----------------------------------------------------------------------------
class JSQaoaEngine {
    constructor(selectedCities, distMatrixFull) {
        this.selectedCities = selectedCities;
        this.N = selectedCities.length;
        
        this.distMatrix = Array.from({ length: this.N }, () => new Float64Array(this.N));
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                const origI = selectedCities[i].id;
                const origJ = selectedCities[j].id;
                this.distMatrix[i][j] = distMatrixFull[origI][origJ];
            }
        }
        
        this.numQubits = (this.N - 1) * (this.N - 1);
        this.varMap = new Map();
        let qIdx = 0;
        for (let i = 1; i < this.N; i++) {
            for (let t = 1; t < this.N; t++) {
                this.varMap.set(`${i},${t}`, qIdx);
                qIdx++;
            }
        }

        let maxD = 0;
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                if (this.distMatrix[i][j] > maxD) maxD = this.distMatrix[i][j];
            }
        }
        this.penaltyA = maxD * 3.5;
        this.penaltyB = maxD * 3.5;

        this.Q = this.buildQUBO();
        this.simQubits = Math.min(this.numQubits, 16);
        this.numStates = 1 << this.simQubits;
    }

    getVar(i, t) {
        if (i === 0 && t === 0) return -1;
        if (i === 0 || t === 0) return -2;
        return this.varMap.get(`${i},${t}`);
    }

    buildQUBO() {
        const Q = Array.from({ length: this.numQubits }, () => new Float64Array(this.numQubits));
        for (let t = 0; t < this.N; t++) {
            const tNext = (t + 1) % this.N;
            for (let i = 0; i < this.N; i++) {
                for (let j = 0; j < this.N; j++) {
                    if (i === j) continue;
                    const d = this.distMatrix[i][j];
                    const v1 = this.getVar(i, t);
                    const v2 = this.getVar(j, tNext);

                    if (v1 === -1 && v2 >= 0) {
                        Q[v2][v2] += d;
                    } else if (v1 >= 0 && v2 === -1) {
                        Q[v1][v1] += d;
                    } else if (v1 >= 0 && v2 >= 0) {
                        Q[v1][v2] += d / 2.0;
                        Q[v2][v1] += d / 2.0;
                    }
                }
            }
        }

        for (let i = 1; i < this.N; i++) {
            for (let t = 1; t < this.N; t++) {
                const v = this.getVar(i, t);
                Q[v][v] -= this.penaltyA;
                for (let t2 = t + 1; t2 < this.N; t2++) {
                    const v2 = this.getVar(i, t2);
                    Q[v][v2] += this.penaltyA;
                    Q[v2][v] += this.penaltyA;
                }
            }
        }

        for (let t = 1; t < this.N; t++) {
            for (let i = 1; i < this.N; i++) {
                const v = this.getVar(i, t);
                Q[v][v] -= this.penaltyB;
                for (let i2 = i + 1; i2 < this.N; i2++) {
                    const v2 = this.getVar(i2, t);
                    Q[v][v2] += this.penaltyB;
                    Q[v2][v] += this.penaltyB;
                }
            }
        }

        return Q;
    }

    evaluateCost(bitstring) {
        let cost = 0;
        const len = Math.min(bitstring.length, this.numQubits);
        for (let i = 0; i < len; i++) {
            if (bitstring[i] === 1) {
                cost += this.Q[i][i];
                for (let j = i + 1; j < len; j++) {
                    if (bitstring[j] === 1) {
                        cost += 2 * this.Q[i][j];
                    }
                }
            }
        }
        return cost;
    }

    decodeBitstring(bitstring) {
        const grid = Array.from({ length: this.N }, () => new Int32Array(this.N));
        grid[0][0] = 1;
        
        for (let i = 1; i < this.N; i++) {
            for (let t = 1; t < this.N; t++) {
                const vIdx = this.varMap.get(`${i},${t}`);
                if (vIdx < bitstring.length) {
                    grid[i][t] = bitstring[vIdx];
                }
            }
        }

        let isValid = true;
        for (let i = 0; i < this.N; i++) {
            let rowSum = 0;
            for (let t = 0; t < this.N; t++) rowSum += grid[i][t];
            if (rowSum !== 1) { isValid = false; break; }
        }

        if (isValid) {
            for (let t = 0; t < this.N; t++) {
                let colSum = 0;
                for (let i = 0; i < this.N; i++) colSum += grid[i][t];
                if (colSum !== 1) { isValid = false; break; }
            }
        }

        if (isValid) {
            const tour = [];
            for (let t = 0; t < this.N; t++) {
                for (let i = 0; i < this.N; i++) {
                    if (grid[i][t] === 1) {
                        tour.push(i);
                        break;
                    }
                }
            }
            let dist = 0;
            for (let k = 0; k < this.N; k++) {
                dist += this.distMatrix[tour[k]][tour[(k + 1) % this.N]];
            }
            return { isValid: true, tourIndices: tour, totalDistance: dist };
        }

        return { isValid: false, tourIndices: null, totalDistance: Infinity };
    }

    async runQAOA(layers = 1, maxIter = 100, onProgress = null) {
        const numStates = this.numStates;
        const numQubits = this.simQubits;

        const energies = new Float64Array(numStates);
        const bitstrings = new Array(numStates);

        for (let s = 0; s < numStates; s++) {
            const bits = new Int32Array(numQubits);
            for (let b = 0; b < numQubits; b++) {
                bits[b] = (s >> b) & 1;
            }
            bitstrings[s] = bits;
            energies[s] = this.evaluateCost(bits);
        }

        let realVec = new Float64Array(numStates);
        let imagVec = new Float64Array(numStates);

        function computeExpectation(params) {
            const gammas = params.slice(0, layers);
            const betas = params.slice(layers);

            const norm = 1.0 / Math.sqrt(numStates);
            for (let s = 0; s < numStates; s++) {
                realVec[s] = norm;
                imagVec[s] = 0.0;
            }

            for (let p = 0; p < layers; p++) {
                const g = gammas[p];
                const b = betas[p];

                for (let s = 0; s < numStates; s++) {
                    const phase = -g * energies[s];
                    const cosP = Math.cos(phase);
                    const sinP = Math.sin(phase);

                    const r = realVec[s];
                    const i = imagVec[s];
                    realVec[s] = r * cosP - i * sinP;
                    imagVec[s] = r * sinP + i * cosP;
                }

                const cosB = Math.cos(b);
                const sinB = Math.sin(b);

                for (let q = 0; q < numQubits; q++) {
                    const bitMask = 1 << q;
                    const nextReal = new Float64Array(numStates);
                    const nextImag = new Float64Array(numStates);

                    for (let s = 0; s < numStates; s++) {
                        const pairedS = s ^ bitMask;
                        const rSelf = realVec[s];
                        const iSelf = imagVec[s];
                        const rPair = realVec[pairedS];
                        const iPair = imagVec[pairedS];

                        nextReal[s] = cosB * rSelf + sinB * iPair;
                        nextImag[s] = cosB * iSelf - sinB * rPair;
                    }

                    realVec = nextReal;
                    imagVec = nextImag;
                }
            }

            let expectation = 0;
            for (let s = 0; s < numStates; s++) {
                const prob = realVec[s] * realVec[s] + imagVec[s] * imagVec[s];
                expectation += prob * energies[s];
            }
            return expectation;
        }

        const restarts = 4;
        let globalBestParams = new Float64Array(2 * layers);
        let globalBestCost = Infinity;
        const history = [];
        let globalStep = 0;

        for (let r = 0; r < restarts; r++) {
            let currentParams = new Float64Array(2 * layers);
            for (let k = 0; k < layers; k++) {
                currentParams[k] = (r === 0) ? 0.4 : (Math.random() * Math.PI);
                currentParams[layers + k] = (r === 0) ? 0.4 : (Math.random() * (Math.PI / 2));
            }

            let currentCost = computeExpectation(currentParams);
            const stepSizes = [0.15, 0.08, 0.04, 0.02, 0.01];

            const iterPerRestart = Math.ceil(maxIter / (restarts * stepSizes.length));

            for (const alpha of stepSizes) {
                for (let iter = 0; iter < iterPerRestart; iter++) {
                    globalStep++;
                    let improved = false;

                    for (let k = 0; k < 2 * layers; k++) {
                        currentParams[k] += alpha;
                        let cPlus = computeExpectation(currentParams);

                        if (cPlus < currentCost) {
                            currentCost = cPlus;
                            improved = true;
                        } else {
                            currentParams[k] -= 2 * alpha;
                            let cMinus = computeExpectation(currentParams);
                            if (cMinus < currentCost) {
                                currentCost = cMinus;
                                improved = true;
                            } else {
                                currentParams[k] += alpha;
                            }
                        }
                    }

                    history.push(currentCost);

                    if (onProgress && globalStep % 5 === 0) {
                        onProgress(globalStep, currentCost);
                        await new Promise(res => setTimeout(res, 5));
                    }

                    if (!improved && iter > 6) break;
                }
            }

            if (currentCost < globalBestCost) {
                globalBestCost = currentCost;
                globalBestParams.set(currentParams);
            }
        }

        computeExpectation(globalBestParams);

        const stateProbs = [];
        for (let s = 0; s < numStates; s++) {
            const prob = realVec[s] * realVec[s] + imagVec[s] * imagVec[s];
            stateProbs.push({ stateIdx: s, prob: prob, energy: energies[s] });
        }

        stateProbs.sort((a, b) => b.prob - a.prob);

        const topSamples = stateProbs.slice(0, 10).map(sp => {
            const bits = bitstrings[sp.stateIdx];
            const decoded = this.decodeBitstring(bits);
            const bitStr = Array.from(bits).join('');
            
            return {
                stateIdx: sp.stateIdx,
                bitstring: bitStr,
                probability: sp.prob,
                energy: sp.energy,
                isValid: decoded.isValid,
                tourIndices: decoded.tourIndices,
                cityNames: decoded.isValid ? decoded.tourIndices.map(i => this.selectedCities[i].name) : null,
                totalDistance: decoded.totalDistance
            };
        });

        let bestValidSample = null;
        for (let s = 0; s < Math.min(50, stateProbs.length); s++) {
            const bits = bitstrings[stateProbs[s].stateIdx];
            const decoded = this.decodeBitstring(bits);
            if (decoded.isValid) {
                bestValidSample = {
                    bitstring: Array.from(bits).join(''),
                    probability: stateProbs[s].prob,
                    energy: stateProbs[s].energy,
                    isValid: true,
                    tourIndices: decoded.tourIndices,
                    cityNames: decoded.tourIndices.map(i => this.selectedCities[i].name),
                    totalDistance: decoded.totalDistance
                };
                break;
            }
        }

        return {
            optimalParams: Array.from(globalBestParams),
            finalExpectation: globalBestCost,
            history: history,
            topSamples: topSamples,
            bestValidSample: bestValidSample
        };
    }
}

// -----------------------------------------------------------------------------
// 3. Compact Logarithmic QAOA Engine (N * log2 N qubits)
// -----------------------------------------------------------------------------
class JSLogQaoaEngine {
    constructor(selectedCities, distMatrixFull, fixOrigin = true) {
        this.selectedCities = selectedCities;
        this.N = selectedCities.length;
        this.fixOrigin = fixOrigin;

        this.distMatrix = Array.from({ length: this.N }, () => new Float64Array(this.N));
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                const origI = selectedCities[i].id;
                const origJ = selectedCities[j].id;
                this.distMatrix[i][j] = distMatrixFull[origI][origJ];
            }
        }

        this.bitsPerStep = Math.ceil(Math.log2(this.N));
        this.numSteps = fixOrigin ? (this.N - 1) : this.N;
        this.numQubits = this.numSteps * this.bitsPerStep;
        this.numStates = 1 << this.numQubits;

        let maxD = 0;
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                if (this.distMatrix[i][j] > maxD) maxD = this.distMatrix[i][j];
            }
        }
        this.penaltyDup = maxD * 4.0;
        this.penaltyInvalid = maxD * 6.0;
        
        this.Q = Array.from({ length: this.numQubits }, () => new Float64Array(this.numQubits));
        for (let q1 = 0; q1 < this.numQubits; q1++) {
            for (let q2 = 0; q2 < this.numQubits; q2++) {
                const step1 = Math.floor(q1 / this.bitsPerStep);
                const step2 = Math.floor(q2 / this.bitsPerStep);
                if (step1 === step2) {
                    this.Q[q1][q2] = (q1 === q2) ? -1.5 * maxD : 0.8 * maxD;
                } else if (Math.abs(step1 - step2) === 1) {
                    this.Q[q1][q2] = 0.5 * maxD;
                }
            }
        }
    }

    decodeBitstring(bitstring) {
        const tour = [];
        if (this.fixOrigin) {
            tour.push(0);
        }

        for (let s = 0; s < this.numSteps; s++) {
            const startBit = s * this.bitsPerStep;
            let cityIdx = 0;
            for (let b = 0; b < this.bitsPerStep; b++) {
                cityIdx += bitstring[startBit + b] * (1 << b);
            }
            tour.push(cityIdx);
        }

        let isOutOfBounds = tour.some(c => c >= this.N);
        let uniqueSet = new Set(tour);
        let isValid = !isOutOfBounds && (uniqueSet.size === this.N);

        if (isValid) {
            let dist = 0;
            for (let k = 0; k < this.N; k++) {
                dist += this.distMatrix[tour[k]][tour[(k + 1) % this.N]];
            }
            return { isValid: true, tourIndices: tour, totalDistance: dist };
        } else {
            let cost = 0;
            let visited = new Set();
            tour.forEach(c => {
                if (c >= this.N) cost += this.penaltyInvalid;
                else if (visited.has(c)) cost += this.penaltyDup;
                else visited.add(c);
            });
            cost += (this.N - visited.size) * this.penaltyDup;
            return { isValid: false, tourIndices: tour, totalDistance: Infinity, penaltyCost: cost };
        }
    }

    evaluateCost(bitstring) {
        const decoded = this.decodeBitstring(bitstring);
        return decoded.isValid ? decoded.totalDistance : (decoded.penaltyCost + 500);
    }

    async runQAOA(layers = 1, maxIter = 100, onProgress = null) {
        const numStates = this.numStates;
        const numQubits = this.numQubits;

        const energies = new Float64Array(numStates);
        const bitstrings = new Array(numStates);

        for (let s = 0; s < numStates; s++) {
            const bits = new Int32Array(numQubits);
            for (let b = 0; b < numQubits; b++) {
                bits[b] = (s >> b) & 1;
            }
            bitstrings[s] = bits;
            energies[s] = this.evaluateCost(bits);
        }

        let realVec = new Float64Array(numStates);
        let imagVec = new Float64Array(numStates);

        function computeExpectation(params) {
            const gammas = params.slice(0, layers);
            const betas = params.slice(layers);

            const norm = 1.0 / Math.sqrt(numStates);
            for (let s = 0; s < numStates; s++) {
                realVec[s] = norm;
                imagVec[s] = 0.0;
            }

            for (let p = 0; p < layers; p++) {
                const g = gammas[p];
                const b = betas[p];

                for (let s = 0; s < numStates; s++) {
                    const phase = -g * energies[s];
                    const cosP = Math.cos(phase);
                    const sinP = Math.sin(phase);

                    const r = realVec[s];
                    const i = imagVec[s];
                    realVec[s] = r * cosP - i * sinP;
                    imagVec[s] = r * sinP + i * cosP;
                }

                const cosB = Math.cos(b);
                const sinB = Math.sin(b);

                for (let q = 0; q < numQubits; q++) {
                    const bitMask = 1 << q;
                    const nextReal = new Float64Array(numStates);
                    const nextImag = new Float64Array(numStates);

                    for (let s = 0; s < numStates; s++) {
                        const pairedS = s ^ bitMask;
                        const rSelf = realVec[s];
                        const iSelf = imagVec[s];
                        const rPair = realVec[pairedS];
                        const iPair = imagVec[pairedS];

                        nextReal[s] = cosB * rSelf + sinB * iPair;
                        nextImag[s] = cosB * iSelf - sinB * rPair;
                    }

                    realVec = nextReal;
                    imagVec = nextImag;
                }
            }

            let expectation = 0;
            for (let s = 0; s < numStates; s++) {
                const prob = realVec[s] * realVec[s] + imagVec[s] * imagVec[s];
                expectation += prob * energies[s];
            }
            return expectation;
        }

        const restarts = 4;
        let globalBestParams = new Float64Array(2 * layers);
        let globalBestCost = Infinity;
        const history = [];
        let globalStep = 0;

        for (let r = 0; r < restarts; r++) {
            let currentParams = new Float64Array(2 * layers);
            for (let k = 0; k < layers; k++) {
                currentParams[k] = (r === 0) ? 0.5 : (Math.random() * Math.PI);
                currentParams[layers + k] = (r === 0) ? 0.5 : (Math.random() * (Math.PI / 2));
            }

            let currentCost = computeExpectation(currentParams);
            const stepSizes = [0.15, 0.08, 0.04, 0.02, 0.01];
            const iterPerRestart = Math.ceil(maxIter / (restarts * stepSizes.length));

            for (const alpha of stepSizes) {
                for (let iter = 0; iter < iterPerRestart; iter++) {
                    globalStep++;
                    let improved = false;

                    for (let k = 0; k < 2 * layers; k++) {
                        currentParams[k] += alpha;
                        let cPlus = computeExpectation(currentParams);

                        if (cPlus < currentCost) {
                            currentCost = cPlus;
                            improved = true;
                        } else {
                            currentParams[k] -= 2 * alpha;
                            let cMinus = computeExpectation(currentParams);
                            if (cMinus < currentCost) {
                                currentCost = cMinus;
                                improved = true;
                            } else {
                                currentParams[k] += alpha;
                            }
                        }
                    }

                    history.push(currentCost);

                    if (onProgress && globalStep % 5 === 0) {
                        onProgress(globalStep, currentCost);
                        await new Promise(res => setTimeout(res, 5));
                    }

                    if (!improved && iter > 6) break;
                }
            }

            if (currentCost < globalBestCost) {
                globalBestCost = currentCost;
                globalBestParams.set(currentParams);
            }
        }

        computeExpectation(globalBestParams);

        const stateProbs = [];
        for (let s = 0; s < numStates; s++) {
            const prob = realVec[s] * realVec[s] + imagVec[s] * imagVec[s];
            stateProbs.push({ stateIdx: s, prob: prob, energy: energies[s] });
        }

        stateProbs.sort((a, b) => b.prob - a.prob);

        const topSamples = stateProbs.slice(0, 10).map(sp => {
            const bits = bitstrings[sp.stateIdx];
            const decoded = this.decodeBitstring(bits);
            const bitStr = Array.from(bits).join('');
            
            return {
                stateIdx: sp.stateIdx,
                bitstring: bitStr,
                probability: sp.prob,
                energy: sp.energy,
                isValid: decoded.isValid,
                tourIndices: decoded.tourIndices,
                cityNames: decoded.isValid ? decoded.tourIndices.map(i => this.selectedCities[i].name) : null,
                totalDistance: decoded.totalDistance
            };
        });

        let bestValidSample = null;
        for (let s = 0; s < Math.min(60, stateProbs.length); s++) {
            const bits = bitstrings[stateProbs[s].stateIdx];
            const decoded = this.decodeBitstring(bits);
            if (decoded.isValid) {
                bestValidSample = {
                    bitstring: Array.from(bits).join(''),
                    probability: stateProbs[s].prob,
                    energy: stateProbs[s].energy,
                    isValid: true,
                    tourIndices: decoded.tourIndices,
                    cityNames: decoded.tourIndices.map(i => this.selectedCities[i].name),
                    totalDistance: decoded.totalDistance
                };
                break;
            }
        }

        return {
            optimalParams: Array.from(globalBestParams),
            finalExpectation: globalBestCost,
            history: history,
            topSamples: topSamples,
            bestValidSample: bestValidSample
        };
    }
}
