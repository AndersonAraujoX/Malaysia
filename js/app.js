/**
 * Main Web Application Controller & Leaflet / Visualizations Integration
 * Traveling Salesperson Routing Model for Malaysian Cities
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
                        alert("The application requires at least 3 cities to run the TSP.");
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
        qubitCountBadge.textContent = `${numSelected} Cities | Routing Model`;
    }

    // 3. Setup Tabs
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
                    label: 'Route Distance (km)',
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

    // 5. Update Map Polylines
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
            statQuantumDist.textContent = "No valid route";
        }
    }

    // 6. Execute Solver Runner
    async function runOptimization() {
        if (runBtn) {
            runBtn.disabled = true;
            runBtn.innerHTML = `<span>⏳ Optimizing Route...</span>`;
        }

        const selectedCities = MALAYSIA_CITIES.filter(c => state.selectedCityIds.has(c.id));
        const tInit = 5000.0;
        const maxIter = 15000;
        const alpha = 0.9992;

        // 1. Classical Solution
        const classicalRes = solveClassicalTSP(selectedCities, state.distMatrixFull);
        state.lastClassicalResult = classicalRes;

        // 2. Initialize Routing Optimization Engine with high-performance parameters
        const solverEngine = new JSSimulatedAnnealingEngine(selectedCities, state.distMatrixFull, tInit, alpha);

        if (state.energyChart) {
            state.energyChart.data.labels = [];
            state.energyChart.data.datasets[0].data = [];
            state.energyChart.update();
        }

        // 3. Run Simulation
        const solverRes = await solverEngine.runSolver(maxIter, (step, currentEnergy) => {
            if (state.energyChart) {
                state.energyChart.data.labels.push(`Step ${step}`);
                state.energyChart.data.datasets[0].data.push(currentEnergy);
                state.energyChart.update();
            }
        });

        state.lastSaResult = solverRes;

        // 4. Update Comparison Table
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            const sample = solverRes.bestValidSample;
            if (sample) {
                const tr = document.createElement('tr');
                const finalTemp = solverRes.optimalParams[0] ? solverRes.optimalParams[0].toFixed(2) : '0.00';
                tr.innerHTML = `
                    <td><code style="color:#00f2fe;">Routing Model</code></td>
                    <td><span class="tag-valid">VALID</span></td>
                    <td style="font-weight: 700; color: #00f2fe;">${sample.totalDistance.toFixed(1)} km</td>
                    <td style="font-family: var(--font-mono);">${finalTemp} K</td>
                    <td style="font-size:0.82rem; color:#94a3b8; line-height: 1.4;">${sample.cityNames.join(' ➔ ')}</td>
                `;
                tableBody.appendChild(tr);
            }
        }

        // 5. Update Map Routes
        drawRoutes(classicalRes, solverRes, selectedCities);

        if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = `<span>⚡ Execute Routing Model</span>`;
        }
    }

    if (runBtn) {
        runBtn.addEventListener('click', runOptimization);
    }

    initMap();
    renderCityList();
    updateBadge();
    initCharts();

    setTimeout(() => {
        runOptimization();
    }, 500);
});
