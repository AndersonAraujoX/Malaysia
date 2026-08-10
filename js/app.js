/**
 * Main Web Application Controller & Leaflet Integration
 * Traveling Salesperson Routing Model with Constraint Penalty Parameter λ (A = 1)
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

    const paramLambdaSlider = document.getElementById('paramLambda');
    const valLambdaEl = document.getElementById('valLambda');

    const qubitCountBadge = document.getElementById('qubitCountBadge');
    const pillQuantum = document.getElementById('pillQuantum');
    const statQuantumLabel = document.getElementById('statQuantumLabel');
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

    if (paramLambdaSlider && valLambdaEl) {
        paramLambdaSlider.addEventListener('input', (e) => valLambdaEl.textContent = e.target.value);
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

            const isRouteValid = sample.isValid;
            state.saPolyline = L.polyline(saLatLons, {
                color: isRouteValid ? '#00f2fe' : '#ef4444',
                weight: 5,
                opacity: 0.95,
                dashArray: isRouteValid ? null : '8, 8'
            }).addTo(state.map);

            const dist = typeof sample.hCost === 'number' ? sample.hCost : (sample.totalDistance || 0);
            
            if (isRouteValid) {
                statQuantumLabel.textContent = "Hamiltonian Ground State:";
                statQuantumDist.textContent = `${dist.toFixed(1)} km`;
                if (pillQuantum) pillQuantum.style.borderColor = "rgba(0, 242, 254, 0.4)";
            } else {
                statQuantumLabel.textContent = "Infeasible Route (λ = 0):";
                statQuantumDist.textContent = `${dist.toFixed(1)} km (Duplicates)`;
                if (pillQuantum) pillQuantum.style.borderColor = "rgba(239, 68, 68, 0.7)";
            }
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

        const pLambda = paramLambdaSlider ? parseFloat(paramLambdaSlider.value) : 1000.0;

        // 1. Classical Solution
        const classicalRes = solveClassicalTSP(selectedCities, state.distMatrixFull);
        state.lastClassicalResult = classicalRes;

        // 2. Initialize Routing Optimization Engine with Penalty Parameter λ (A = 1)
        const solverEngine = new JSSimulatedAnnealingEngine(selectedCities, state.distMatrixFull, tInit, alpha, pLambda);

        // 3. Run Simulation
        const solverRes = await solverEngine.runSolver(maxIter);
        state.lastSaResult = solverRes;

        // 4. Update Map Routes
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
