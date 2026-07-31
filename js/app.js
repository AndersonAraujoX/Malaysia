/**
 * Main Web Application Controller & Leaflet / Visualizations Integration
 * Simulated Annealing & TSP for Malaysian Cities
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Global Application State (All 20 cities selected by default)
    const state = {
        distMatrixFull: buildFullDistanceMatrix(),
        selectedCityIds: new Set(Array.from({ length: 20 }, (_, i) => i)),
        map: null,
        markersMap: new Map(),
        classicalPolyline: null,
        saPolyline: null,
        energyChart: null,
        lastSaResult: null,
        lastClassicalResult: null
    };

    // DOM Element References
    const cityListEl = document.getElementById('cityList');
    const tInitialSlider = document.getElementById('tInitial');
    const tValEl = document.getElementById('tVal');
    const maxIterSlider = document.getElementById('maxIter');
    const maxIterValEl = document.getElementById('maxIterVal');
    const runBtn = document.getElementById('runBtn');
    const qubitCountBadge = document.getElementById('qubitCountBadge');
    const statQuantumDist = document.getElementById('statQuantumDist');
    const statClassicalDist = document.getElementById('statClassicalDist');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnSelectMain7 = document.getElementById('btnSelectMain7');
    const btnSelectAll20 = document.getElementById('btnSelectAll20');

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
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    border: 2px solid ${isSelected ? '#ffffff' : '#64748b'};
                    box-shadow: ${isSelected ? '0 0 12px #00f2fe' : 'none'};
                ">
                    ${city.icon}
                </div>
            `;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
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
                updateBadge();
            });

            cityListEl.appendChild(item);
        });
    }

    function updateBadge() {
        const numSelected = state.selectedCityIds.size;
        qubitCountBadge.textContent = `${numSelected} Cidades | Simulated Annealing (Metaheurística)`;
    }

    if (btnSelectMain7) {
        btnSelectMain7.addEventListener('click', () => {
            state.selectedCityIds = new Set([0, 1, 2, 3, 4, 5, 6]);
            renderCityList();
            renderCityMarkers();
            updateBadge();
        });
    }

    if (btnSelectAll20) {
        btnSelectAll20.addEventListener('click', () => {
            state.selectedCityIds = new Set(Array.from({ length: 20 }, (_, i) => i));
            renderCityList();
            renderCityMarkers();
            updateBadge();
        });
    }

    // 3. Setup Sliders & Tabs
    if (tInitialSlider) {
        tInitialSlider.addEventListener('input', (e) => {
            if (tValEl) tValEl.textContent = `${e.target.value} K`;
        });
    }

    if (maxIterSlider) {
        maxIterSlider.addEventListener('input', (e) => {
            if (maxIterValEl) maxIterValEl.textContent = e.target.value;
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // 4. Initialize Chart.js Instance
    function initCharts() {
        const energyCanvas = document.getElementById('energyChart');
        if (!energyCanvas) return;
        const energyCtx = energyCanvas.getContext('2d');
        state.energyChart = new Chart(energyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Energia / Custo da Rota (km)',
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
    }

    // 5. Draw Matrix Heatmap Canvas Safely
    function drawQUBOHeatmap(solverEngine) {
        const canvas = document.getElementById('quboCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const Q = solverEngine ? solverEngine.Q : null;
        if (!Q || !Q.length) return;

        const n = Q.length;
        const cellSize = Math.min(30, Math.floor(260 / n));
        canvas.width = n * cellSize;
        canvas.height = n * cellSize;

        let maxVal = 0;
        for (let i = 0; i < n; i++) {
            if (!Q[i]) continue;
            for (let j = 0; j < Q[i].length; j++) {
                if (Math.abs(Q[i][j]) > maxVal) maxVal = Math.abs(Q[i][j]);
            }
        }
        if (maxVal === 0) maxVal = 1;

        for (let i = 0; i < n; i++) {
            if (!Q[i]) continue;
            for (let j = 0; j < Q[i].length; j++) {
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

    // 6. Update Map Polylines
    function drawRoutes(classicalResult, saResult, selectedCities) {
        if (state.classicalPolyline) state.map.removeLayer(state.classicalPolyline);
        if (state.saPolyline) state.map.removeLayer(state.saPolyline);

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

        if (saResult && saResult.bestValidSample && saResult.bestValidSample.tourIndices) {
            const saLatLons = saResult.bestValidSample.tourIndices.map(idx => {
                const c = selectedCities[idx];
                return [c.lat, c.lon];
            });
            saLatLons.push(saLatLons[0]);

            state.saPolyline = L.polyline(saLatLons, {
                color: '#00f2fe',
                weight: 5,
                opacity: 0.95
            }).addTo(state.map);

            statQuantumDist.textContent = `${saResult.bestValidSample.totalDistance.toFixed(1)} km`;
        } else {
            statQuantumDist.textContent = "Sem rota válida";
        }
    }

    // 7. Execute Solver Runner
    async function runOptimization() {
        runBtn.disabled = true;
        runBtn.innerHTML = `<span>⏳ Otimizando...</span>`;

        const selectedCities = MALAYSIA_CITIES.filter(c => state.selectedCityIds.has(c.id));
        const tInit = tInitialSlider ? parseInt(tInitialSlider.value, 10) : 1000;
        const maxIter = maxIterSlider ? parseInt(maxIterSlider.value, 10) : 1000;

        // 1. Classical Exact Solution
        const classicalRes = solveClassicalTSP(selectedCities, state.distMatrixFull);
        state.lastClassicalResult = classicalRes;

        // 2. Initialize Simulated Annealing Engine
        const solverEngine = new JSSimulatedAnnealingEngine(selectedCities, state.distMatrixFull, tInit, 0.995);

        // 3. Render Matrix Heatmap
        drawQUBOHeatmap(solverEngine);

        if (state.energyChart) {
            state.energyChart.data.labels = [];
            state.energyChart.data.datasets[0].data = [];
            state.energyChart.update();
        }

        // 4. Run Simulation
        const solverRes = await solverEngine.runSolver(maxIter, (step, currentEnergy) => {
            if (state.energyChart) {
                state.energyChart.data.labels.push(`Passo ${step}`);
                state.energyChart.data.datasets[0].data.push(currentEnergy);
                state.energyChart.update();
            }
        });

        state.lastSaResult = solverRes;

        // 5. Update Comparison Table
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            const sample = solverRes.bestValidSample;
            if (sample) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><code style="color:#00f2fe;">Simulated Annealing</code></td>
                    <td><span class="tag-valid">VÁLIDO</span></td>
                    <td>${sample.totalDistance.toFixed(1)} km</td>
                    <td style="font-size:0.85rem; color:#94a3b8;">${sample.cityNames.join(' ➔ ')}</td>
                `;
                tableBody.appendChild(tr);
            }
        }

        // 6. Update Map Routes
        drawRoutes(classicalRes, solverRes, selectedCities);

        runBtn.disabled = false;
        runBtn.innerHTML = `<span>⚡ Executar Simulated Annealing</span>`;
    }

    runBtn.addEventListener('click', runOptimization);

    initMap();
    renderCityList();
    updateBadge();
    initCharts();

    setTimeout(() => {
        runOptimization();
    }, 500);
});
