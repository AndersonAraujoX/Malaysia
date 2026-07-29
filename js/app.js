/**
 * Main Web Application Controller & Leaflet / Visualizations Integration
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Global Application State
    const state = {
        distMatrixFull: buildFullDistanceMatrix(),
        selectedCityIds: new Set([0, 1, 2, 3, 4, 5, 6]), // All 7 cities
        map: null,
        markersMap: new Map(),
        classicalPolyline: null,
        qaoaPolyline: null,
        energyChart: null,
        stateHistogramChart: null,
        lastQaoaResult: null,
        lastClassicalResult: null
    };

    // DOM Element References
    const cityListEl = document.getElementById('cityList');
    const encodingModeEl = document.getElementById('encodingMode');
    const layersSlider = document.getElementById('qaoaLayers');
    const layersValEl = document.getElementById('layersVal');
    const maxIterSlider = document.getElementById('maxIter');
    const maxIterValEl = document.getElementById('maxIterVal');
    const runBtn = document.getElementById('runBtn');
    const qubitCountBadge = document.getElementById('qubitCountBadge');
    const statQuantumDist = document.getElementById('statQuantumDist');
    const statClassicalDist = document.getElementById('statClassicalDist');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // 1. Initialize Leaflet Dark Map
    function initMap() {
        state.map = L.map('map', {
            center: [4.1000, 108.5000],
            zoom: 6,
            zoomControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(state.map);

        renderCityMarkers();
    }

    function renderCityMarkers() {
        state.markersMap.forEach(m => state.map.removeLayer(m));
        state.markersMap.clear();

        MALAYSIA_CITIES.forEach(city => {
            const isSelected = state.selectedCityIds.has(city.id);
            const iconHtml = `
                <div class="map-marker-pin ${isSelected ? 'active' : 'disabled'}" style="
                    background: ${isSelected ? 'linear-gradient(135deg, #00f2fe, #9d4edd)' : '#334155'};
                    color: #fff;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    border: 2px solid ${isSelected ? '#ffffff' : '#64748b'};
                    box-shadow: ${isSelected ? '0 0 14px #00f2fe' : 'none'};
                ">
                    ${city.icon}
                </div>
            `;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-div-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([city.lat, city.lon], { icon: customIcon }).addTo(state.map);
            
            const popupContent = `
                <div class="city-popup">
                    <div class="city-popup-title">${city.icon} ${city.name}</div>
                    <div style="font-size: 0.78rem; color: #00f2fe; margin-bottom: 6px;">${city.state} (${city.region})</div>
                    <div class="city-popup-desc">${city.desc}</div>
                </div>
            `;
            marker.bindPopup(popupContent);
            state.markersMap.set(city.id, marker);
        });
    }

    // 2. Render Sidebar City Selector List
    function renderCityList() {
        cityListEl.innerHTML = '';
        MALAYSIA_CITIES.forEach(city => {
            const isSelected = state.selectedCityIds.has(city.id);
            const item = document.createElement('div');
            item.className = `city-item ${isSelected ? 'active' : ''}`;
            item.innerHTML = `
                <div class="city-info">
                    <span class="city-icon">${city.icon}</span>
                    <div>
                        <div class="city-name">${city.name}</div>
                        <div class="city-region">${city.state}</div>
                    </div>
                </div>
                <div class="checkbox-custom"></div>
            `;

            item.addEventListener('click', () => {
                if (state.selectedCityIds.has(city.id)) {
                    if (state.selectedCityIds.size <= 3) {
                        alert("A aplicação necessita de no mínimo 3 cidades para rodar o TSP.");
                        return;
                    }
                    state.selectedCityIds.delete(city.id);
                } else {
                    state.selectedCityIds.add(city.id);
                }
                renderCityList();
                renderCityMarkers();
                updateQubitCount();
            });

            cityListEl.appendChild(item);
        });
    }

    function updateQubitCount() {
        const numSelected = state.selectedCityIds.size;
        const mode = encodingModeEl.value;
        
        if (mode === 'sa') {
            qubitCountBadge.textContent = `${numSelected} Cidades | Simulated Annealing (Metaheurística)`;
        } else if (mode === 'log') {
            const bitsPerStep = Math.ceil(Math.log2(numSelected));
            const qubitsFull = numSelected * bitsPerStep;
            const qubitsFixed = (numSelected - 1) * bitsPerStep;
            qubitCountBadge.textContent = `${numSelected} Cidades | ${qubitsFixed} Qubits Log(N)`;
        } else {
            const numQubits = (numSelected - 1) * (numSelected - 1);
            qubitCountBadge.textContent = `${numSelected} Cidades | ${numQubits} Qubits One-Hot`;
        }
    }

    encodingModeEl.addEventListener('change', updateQubitCount);

    // 3. Setup Sliders & Tabs
    layersSlider.addEventListener('input', (e) => {
        layersValEl.textContent = e.target.value;
    });

    maxIterSlider.addEventListener('input', (e) => {
        maxIterValEl.textContent = e.target.value;
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 4. Initialize Chart.js Instances
    function initCharts() {
        const energyCtx = document.getElementById('energyChart').getContext('2d');
        state.energyChart = new Chart(energyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Energia / Custo <E>',
                    data: [],
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0, 242, 254, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8' } } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });

        const stateCtx = document.getElementById('stateHistogramChart').getContext('2d');
        state.stateHistogramChart = new Chart(stateCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Probabilidade de Medição |c_s|^2 (%)',
                    data: [],
                    backgroundColor: [],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8' } } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Fira Code' } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, max: 100 }
                }
            }
        });
    }

    // 5. Draw QUBO Matrix Heatmap Canvas
    function drawQUBOHeatmap(qaoaEngine) {
        const canvas = document.getElementById('quboCanvas');
        const ctx = canvas.getContext('2d');
        const Q = qaoaEngine.Q;
        const n = qaoaEngine.numQubits || Q.length;

        const cellSize = Math.min(30, Math.floor(260 / n));
        canvas.width = n * cellSize;
        canvas.height = n * cellSize;

        let maxVal = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (Math.abs(Q[i][j]) > maxVal) maxVal = Math.abs(Q[i][j]);
            }
        }
        if (maxVal === 0) maxVal = 1;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = Q[i][j];
                const norm = Math.abs(val) / maxVal;
                
                if (val > 0) {
                    ctx.fillStyle = `rgba(0, 242, 254, ${Math.min(1.0, norm + 0.15)})`;
                } else if (val < 0) {
                    ctx.fillStyle = `rgba(247, 37, 133, ${Math.min(1.0, norm + 0.15)})`;
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                }

                ctx.fillRect(j * cellSize, i * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }

    // 6. Draw Circuit / Metaheuristic Visualizer
    function renderCircuitDiagram(numQubits, layers, mode) {
        const container = document.getElementById('circuitContainer');
        let html = '';
        
        if (mode === 'sa') {
            html += `<div style="color: #00f2fe; font-weight: bold; margin-bottom: 8px;">🔥 Têmpera Simulada (Simulated Annealing):</div>`;
            html += `<div class="qubit-line"><span class="gate gate-h">T_0 = 1000K</span> ─── <span class="gate gate-uc">Metropolis 2-Opt</span> ─── <span class="gate gate-ub">Cooling α=0.992</span> ─── <span class="gate gate-m">Best Tour</span></div>`;
            container.innerHTML = html;
            return;
        }

        for (let q = 0; q < Math.min(6, numQubits); q++) {
            html += `<div class="qubit-line">`;
            html += `<span style="width: 50px; color: #00f2fe;">|q_${q}⟩:</span>`;
            html += `<span class="gate gate-h">H</span> ─── `;
            for (let p = 1; p <= layers; p++) {
                html += `<span class="gate gate-uc">U(C, γ_${p})</span> ─── `;
                html += `<span class="gate gate-ub">U(B, β_${p})</span> ─── `;
            }
            html += `<span class="gate gate-m">M</span>`;
            html += `</div>`;
        }
        if (numQubits > 6) {
            html += `<div style="color: #64748b; margin-top: 6px;">... + ${numQubits - 6} linhas de qubits adicionais</div>`;
        }
        container.innerHTML = html;
    }

    // 7. Update Map Polylines
    function drawRoutes(classicalResult, qaoaBestSample, selectedCities) {
        if (state.classicalPolyline) state.map.removeLayer(state.classicalPolyline);
        if (state.qaoaPolyline) state.map.removeLayer(state.qaoaPolyline);

        if (classicalResult && classicalResult.tourIndices) {
            const classLatLons = classicalResult.tourIndices.map(idx => {
                const c = selectedCities[idx];
                return [c.lat, c.lon];
            });
            classLatLons.push(classLatLons[0]);

            state.classicalPolyline = L.polyline(classLatLons, {
                color: '#10b981',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.85
            }).addTo(state.map);

            statClassicalDist.textContent = `${classicalResult.totalDistance.toFixed(1)} km`;
        }

        if (qaoaBestSample && qaoaBestSample.isValid && qaoaBestSample.tourIndices) {
            const qaoaLatLons = qaoaBestSample.tourIndices.map(idx => {
                const c = selectedCities[idx];
                return [c.lat, c.lon];
            });
            qaoaLatLons.push(qaoaLatLons[0]);

            state.qaoaPolyline = L.polyline(qaoaLatLons, {
                color: '#00f2fe',
                weight: 5,
                opacity: 0.95
            }).addTo(state.map);

            statQuantumDist.textContent = `${qaoaBestSample.totalDistance.toFixed(1)} km`;
        } else {
            statQuantumDist.textContent = "Sem rota válida";
        }
    }

    // 8. Execute Solver Runner
    async function runOptimization() {
        runBtn.disabled = true;
        runBtn.innerHTML = `<span>⏳ Otimizando...</span>`;

        const selectedCities = MALAYSIA_CITIES.filter(c => state.selectedCityIds.has(c.id));
        const layers = parseInt(layersSlider.value, 10);
        const maxIter = parseInt(maxIterSlider.value, 10);
        const encodingMode = encodingModeEl.value;

        // 1. Classical Exact Solution
        const classicalRes = solveClassicalTSP(selectedCities, state.distMatrixFull);
        state.lastClassicalResult = classicalRes;

        // 2. Initialize Selected Engine
        let solverEngine;
        if (encodingMode === 'sa') {
            solverEngine = new JSSimulatedAnnealingEngine(selectedCities, state.distMatrixFull, 1000.0, 0.992);
        } else if (encodingMode === 'log') {
            solverEngine = new JSLogQaoaEngine(selectedCities, state.distMatrixFull, true);
        } else {
            solverEngine = new JSQaoaEngine(selectedCities, state.distMatrixFull);
        }

        // 3. Render QUBO Heatmap & Circuit Structure
        drawQUBOHeatmap(solverEngine);
        renderCircuitDiagram(solverEngine.numQubits || 9, layers, encodingMode);

        state.energyChart.data.labels = [];
        state.energyChart.data.datasets[0].data = [];
        state.energyChart.update();

        // 4. Run Simulation
        const solverRes = await solverEngine.runQAOA(layers, maxIter, (step, currentEnergy) => {
            state.energyChart.data.labels.push(`Passo ${step}`);
            state.energyChart.data.datasets[0].data.push(currentEnergy);
            state.energyChart.update();
        });

        state.lastQaoaResult = solverRes;

        // 5. Update State Histogram
        const topSamples = solverRes.topSamples;
        state.stateHistogramChart.data.labels = topSamples.map(s => `|${s.bitstring}>`);
        state.stateHistogramChart.data.datasets[0].data = topSamples.map(s => (s.probability * 100).toFixed(1));
        state.stateHistogramChart.data.datasets[0].backgroundColor = topSamples.map(s => 
            s.isValid ? '#00f2fe' : 'rgba(247, 37, 133, 0.6)'
        );
        state.stateHistogramChart.update();

        // 6. Update Comparison Table
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        topSamples.forEach(sample => {
            const tr = document.createElement('tr');
            const statusTag = sample.isValid 
                ? `<span class="tag-valid">VÁLIDO</span>` 
                : `<span class="tag-invalid">INVÁLIDO</span>`;
            
            const routeStr = sample.isValid ? sample.cityNames.join(' ➔ ') : 'Violação de restrições';
            const distStr = sample.isValid ? `${sample.totalDistance.toFixed(1)} km` : '-';

            tr.innerHTML = `
                <td><code style="color:#00f2fe;">|${sample.bitstring}></code></td>
                <td>${(sample.probability * 100).toFixed(2)}%</td>
                <td>${sample.energy.toFixed(1)}</td>
                <td>${statusTag}</td>
                <td>${distStr}</td>
                <td style="font-size:0.8rem; color:#94a3b8;">${routeStr}</td>
            `;
            tableBody.appendChild(tr);
        });

        // 7. Update Map
        drawRoutes(classicalRes, solverRes.bestValidSample, selectedCities);

        runBtn.disabled = false;
        runBtn.innerHTML = `<span>⚡ Executar Otimizador</span>`;
    }

    runBtn.addEventListener('click', runOptimization);

    initMap();
    renderCityList();
    updateQubitCount();
    initCharts();

    setTimeout(() => {
        runOptimization();
    }, 500);
});
