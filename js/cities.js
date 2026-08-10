/**
 * 20 Major Cities of Malaysia Metadata & Utilities
 */

const MALAYSIA_CITIES = [
    { id: 0, name: "Kuala Lumpur", state: "Federal Territory", region: "Peninsular", lat: 3.1390, lon: 101.6869, icon: "🏛️", desc: "Capital of Malaysia & Financial Hub" },
    { id: 1, name: "George Town", state: "Penang", region: "Peninsular", lat: 5.4164, lon: 100.3327, icon: "🏝️", desc: "UNESCO World Heritage Site & Tech Hub" },
    { id: 2, name: "Johor Bahru", state: "Johor", region: "Peninsular", lat: 1.4927, lon: 103.7414, icon: "🌉", desc: "Southern Gateway to Singapore" },
    { id: 3, name: "Melaka", state: "Melaka", region: "Peninsular", lat: 2.1896, lon: 102.2501, icon: "🏰", desc: "Historic Colonial Trading Port" },
    { id: 4, name: "Kota Kinabalu", state: "Sabah", region: "Borneo", lat: 5.9804, lon: 116.0735, icon: "🏔️", desc: "Capital of Sabah & Mount Kinabalu Gateway" },
    { id: 5, name: "Kuching", state: "Sarawak", region: "Borneo", lat: 1.5533, lon: 110.3592, icon: "🐱", desc: "Cat City & Capital of Sarawak" },
    { id: 6, name: "Ipoh", state: "Perak", region: "Peninsular", lat: 4.5975, lon: 101.0901, icon: "☕", desc: "Limestone Hills & White Coffee Culinary Capital" },
    { id: 7, name: "Kuantan", state: "Pahang", region: "Peninsular", lat: 3.8077, lon: 103.3260, icon: "🌊", desc: "East Coast Capital & South China Sea Port" },
    { id: 8, name: "Kuala Terengganu", state: "Terengganu", region: "Peninsular", lat: 5.3302, lon: 103.1408, icon: "🕌", desc: "Coastal Heritage & Crystal Mosque" },
    { id: 9, name: "Kota Bharu", state: "Kelantan", region: "Peninsular", lat: 6.1254, lon: 102.2381, icon: "🎨", desc: "Northern Cultural Cradle & Crafts" },
    { id: 10, name: "Alor Setar", state: "Kedah", region: "Peninsular", lat: 6.1248, lon: 100.3678, icon: "🌾", desc: "Rice Bowl of Malaysia" },
    { id: 11, name: "Seremban", state: "Negeri Sembilan", region: "Peninsular", lat: 2.7258, lon: 101.9424, icon: "🏠", desc: "Minangkabau Roof Architecture" },
    { id: 12, name: "Kangar", "state": "Perlis", region: "Peninsular", lat: 6.4414, lon: 100.1986, icon: "🥭", desc: "Northernmost State Capital" },
    { id: 13, name: "Miri", state: "Sarawak", region: "Borneo", lat: 4.3995, lon: 113.9914, icon: "🛢️", desc: "Oil City & Niah Caves Gateway" },
    { id: 14, name: "Sandakan", state: "Sabah", region: "Borneo", lat: 5.8394, lon: 118.1172, icon: "🦧", desc: "Orangutan Sanctuary & Ecotourism Hub" },
    { id: 15, name: "Sibu", state: "Sarawak", region: "Borneo", lat: 2.3000, lon: 111.8167, icon: "⛵", desc: "Rajang River Basin Trade Hub" },
    { id: 16, name: "Tawau", state: "Sabah", region: "Borneo", lat: 4.2447, lon: 117.8912, icon: "🍫", desc: "Southeastern Cocoa & Seafood Port" },
    { id: 17, name: "Putrajaya", state: "Federal Territory", region: "Peninsular", lat: 2.9264, lon: 101.6964, icon: "🏛️", desc: "Administrative Centre of Malaysia" },
    { id: 18, name: "Bintulu", state: "Sarawak", region: "Borneo", lat: 3.1667, lon: 113.0333, icon: "⚡", desc: "Energy & Deepwater Industrial Port" },
    { id: 19, name: "Klang", state: "Selangor", region: "Peninsular", lat: 3.0449, lon: 101.4456, icon: "⚓", desc: "Royal Town & Container Port Hub" }
];

/**
 * Calculates Haversine distance in km between two lat/lon pairs
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Builds N x N full Haversine distance matrix for all 20 cities
 */
function buildFullDistanceMatrix() {
    const n = MALAYSIA_CITIES.length;
    const matrix = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                matrix[i][j] = haversineDistance(
                    MALAYSIA_CITIES[i].lat, MALAYSIA_CITIES[i].lon,
                    MALAYSIA_CITIES[j].lat, MALAYSIA_CITIES[j].lon
                );
            }
        }
    }
    return matrix;
}

/**
 * Exact Classical TSP Solver using Held-Karp Dynamic Programming Algorithm.
 *
 * Complexity: O(n² · 2ⁿ) time, O(n · 2ⁿ) space.
 * Guarantees the globally optimal tour for any number of cities.
 *
 * For n ≤ 20 (this app's full set): ~100M ops, ~100MB RAM — feasible in browser.
 * For n > 20, use a heuristic instead (e.g. Multi-Start 2-Opt).
 *
 * Algorithm Steps:
 *   1. Initialize: dp[{0}][0] = 0 (start at city 0, zero distance)
 *   2. For each subset S containing city 0, for each last city u ∈ S:
 *        dp[S ∪ {v}][v] = min(dp[S][u] + dist[u][v]) for all v ∉ S
 *   3. Optimal tour cost = min_u(dp[FULL][u] + dist[u][0])
 *   4. Reconstruct path by tracing parent pointers back to city 0
 *
 * @param {Array} selectedCities - Array of city objects with .id, .lat, .lon
 * @param {Array} distMatrixFull - 20×20 precomputed Haversine distance matrix
 * @returns {{ tourIndices, cityNames, totalDistance }}
 */
function solveClassicalTSP(selectedCities, distMatrixFull) {
    const n = selectedCities.length;

    // --- Edge cases ---
    if (n === 0) return { tourIndices: [], cityNames: [], totalDistance: 0 };
    if (n === 1) return { tourIndices: [0], cityNames: [selectedCities[0].name], totalDistance: 0 };
    if (n === 2) return {
        tourIndices: [0, 1],
        cityNames: selectedCities.map(c => c.name),
        totalDistance: distMatrixFull[selectedCities[0].id][selectedCities[1].id] * 2
    };

    // --- Build local sub-distance matrix (local indices 0..n-1) ---
    const dist = new Array(n);
    for (let i = 0; i < n; i++) {
        dist[i] = new Float64Array(n);
        for (let j = 0; j < n; j++) {
            dist[i][j] = distMatrixFull[selectedCities[i].id][selectedCities[j].id];
        }
    }

    const FULL_MASK = (1 << n) - 1;
    const INF = Infinity;

    // --- Held-Karp DP Tables ---
    // dp[mask * n + i] = minimum distance to visit all cities in `mask`, ending at city i
    // parent[mask * n + i] = predecessor city of i in the optimal sub-path
    const dpSize = (1 << n) * n;
    const dp = new Float32Array(dpSize).fill(INF);
    const parent = new Int8Array(dpSize).fill(-1);

    // Start: visit only city 0 with zero distance
    dp[(1 << 0) * n + 0] = 0;

    // --- DP Fill: iterate over all masks in ascending order ---
    for (let mask = 1; mask <= FULL_MASK; mask++) {
        // Only process masks that include the starting city (city 0)
        if (!(mask & 1)) continue;

        const baseIdx = mask * n;

        for (let u = 0; u < n; u++) {
            // u must be in the current mask
            if (!(mask & (1 << u))) continue;

            const dpU = dp[baseIdx + u];
            if (dpU === INF) continue;

            // Try extending the path from u to each unvisited city v
            for (let v = 0; v < n; v++) {
                if (mask & (1 << v)) continue; // v already visited

                const newMask = mask | (1 << v);
                const newCost = dpU + dist[u][v];
                const newIdx = newMask * n + v;

                if (newCost < dp[newIdx]) {
                    dp[newIdx] = newCost;
                    parent[newIdx] = u;
                }
            }
        }
    }

    // --- Find the globally optimal last city before returning to city 0 ---
    let bestCost = INF;
    let bestEnd = -1;
    const fullBase = FULL_MASK * n;

    for (let u = 1; u < n; u++) {
        if (dp[fullBase + u] === INF) continue;
        const roundTripCost = dp[fullBase + u] + dist[u][0];
        if (roundTripCost < bestCost) {
            bestCost = roundTripCost;
            bestEnd = u;
        }
    }

    // --- Reconstruct optimal tour by tracing parent pointers ---
    const tour = [];
    let mask = FULL_MASK;
    let curr = bestEnd;

    while (curr !== -1) {
        tour.push(curr);
        const prev = parent[mask * n + curr];
        mask ^= (1 << curr); // remove curr from mask
        curr = prev;
    }

    tour.reverse();

    return {
        tourIndices: tour,
        cityNames: tour.map(idx => selectedCities[idx].name),
        totalDistance: bestCost
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MALAYSIA_CITIES,
        haversineDistance,
        buildFullDistanceMatrix,
        solveClassicalTSP
    };
}
