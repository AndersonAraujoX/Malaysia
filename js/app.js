/**
 * Main Web Application Controller & Leaflet Integration
 * Traveling Salesperson Routing Model with Explicit Hamiltonian Multipliers (A, B, C)
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
        lastSaResult: null,
        lastClassicalResult: null
    };

    // DOM Element References
    const cityListEl = document.getElementById('cityList');
    const runBtn = document.getElementById('runBtn');

    const paramASlider = document.getElementById('paramA');
    const valAEl = document.getElementById('valA');
    const paramBSlider = document.getElementById('paramB');
    const valBEl = document.getElementById('valB');
    const paramCSlider = document.getElementById('paramC');
    const valCEl = document.getElementById('valC');

    const qubitCountBadge = document.getElementById('qubitCountBadge');
    const statQuantumDist = document.getElementById('statQuantumDist');
    const statClassicalDist = document.getElementById('statClassicalDist');

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
        qubitCountBadge.textContent = `${numSelected} Cities | Hamiltonian Solver`;
    }

    if (paramASlider && valAEl) {
        paramASlider.addEventListener('input', (e) => valAEl.textContent = e.target.value);
    }
    if (paramBSlider && valBEl) {
        paramBSlider.addEventListener('input', (e) => valBEl.textContent = e.target.value);
    }
    if (paramCSlider && valCEl) {
        paramCSlider.addEventListener('input', (e) => valCEl.textContent = e.target.value);
    }

    // Helper: Safely resolve sample object
    function getSampleObject(saResult) {
        if (!saResult) return null;
        if (saResult.bestValidSample && typeof saResult.bestValidSample === 'object') {
            return saResult.bestValidSample;
        }
        if (Array.isArray(saResult.topSamples) && saResult.topSamples.length > 0) {
            return saResult.topSamples[0];
        }
        return null;
    }

    // 3. Update Map Polylines
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

        const sample = getSampleObject(saResult);
        if (sample && Array.isArray(sample.tourIndices)) {
            const saLatLons = sample.tourIndices.map(idx => {
                const c = selectedCities[idx];
                return [c.lat, c.lon];
            });
            saLatLons.push(saLatLons[0]);

            state.saPolyline = L.polyline(saLatLons, {
                color: '#00f2fe',
                weight: 5,
                opacity: 0.95
            }).addTo(state.map);

            const dist = typeof sample.hCost === 'number' ? sample.hCost : (sample.totalDistance || 0);
            statQuantumDist.textContent = `${dist.toFixed(1)} km`;
        } else {
            statQuantumDist.textContent = "No valid route";
        }
    }

    // 4. Execute Solver Runner
    async function runOptimization() {
        if (runBtn) {
            runBtn.disabled = true;
            runBtn.innerHTML = `<span>⏳ Finding Ground State...</span>`;
        }

        const selectedCities = MALAYSIA_CITIES.filter(c => state.selectedCityIds.has(c.id));
        const tInit = 5000.0;
        const maxIter = 50000;
        const alpha = 0.9995;

        const pA = paramASlider ? parseFloat(paramASlider.value) : 1000.0;
        const pB = paramBSlider ? parseFloat(paramBSlider.value) : 1000.0;
        const pC = paramCSlider ? parseFloat(paramCSlider.value) : 500.0;

        // 1. Classical Solution
        const classicalRes = solveClassicalTSP(selectedCities, state.distMatrixFull);
        state.lastClassicalResult = classicalRes;

        // 2. Initialize Routing Optimization Engine with Explicit Hamiltonian Parameters
        const solverEngine = new JSSimulatedAnnealingEngine(selectedCities, state.distMatrixFull, tInit, alpha, pA, pB, pC);

        // 3. Run Simulation
        const solverRes = await solverEngine.runSolver(maxIter);
        state.lastSaResult = solverRes;

        // 4. Update Comparison Table
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            const sample = getSampleObject(solverRes);
            if (sample) {
                const hCost = typeof sample.hCost === 'number' ? sample.hCost : 0;
                const hCity = typeof sample.hCity === 'number' ? sample.hCity : 0;
                const hStep = typeof sample.hStep === 'number' ? sample.hStep : 0;
                const hRegion = typeof sample.hRegion === 'number' ? sample.hRegion : 0;
                const energy = typeof sample.energy === 'number' ? sample.energy : 0;
                const cityNames = Array.isArray(sample.cityNames) ? sample.cityNames.join(' ➔ ') : '';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><code style="color:#00f2fe;">Hamiltonian SA</code></td>
                    <td><span class="tag-valid">${sample.isValid ? 'GROUND STATE' : 'EXCITED STATE'}</span></td>
                    <td style="font-weight: 700; color: #00f2fe;">${hCost.toFixed(1)} km</td>
                    <td style="color:#f59e0b;">${hCity.toFixed(1)}</td>
                    <td style="color:#ec4899;">${hStep.toFixed(1)}</td>
                    <td style="color:#3b82f6;">${hRegion.toFixed(1)}</td>
                    <td style="font-family: var(--font-mono); color:#a855f7; font-weight:700;">${energy.toFixed(1)}</td>
                    <td style="font-size:0.82rem; color:#94a3b8; line-height: 1.4;">${cityNames}</td>
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

    setTimeout(() => {
        runOptimization();
    }, 500);
});
