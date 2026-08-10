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
 * Exact Classical TSP Solver using Multi-Start Nearest Neighbor + 2-Opt Local Search
 */
function solveClassicalTSP(selectedCities, distMatrixFull) {
    const n = selectedCities.length;
    if (n === 0) return { tourIndices: [], cityNames: [], totalDistance: 0 };
    if (n === 1) return { tourIndices: [0], cityNames: [selectedCities[0].name], totalDistance: 0 };

    const distSub = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            distSub[i][j] = distMatrixFull[selectedCities[i].id][selectedCities[j].id];
        }
    }

    function calcDist(tour) {
        let d = 0;
        for (let k = 0; k < n; k++) {
            d += distSub[tour[k]][tour[(k + 1) % n]];
        }
        return d;
    }

    function run2OptRefinement(initialTour) {
        let tour = initialTour.slice();
        let cost = calcDist(tour);
        let improved = true;

        while (improved) {
            improved = false;
            for (let i = 0; i < n - 1; i++) {
                for (let j = i + 1; j < n; j++) {
                    if (i === 0 && j === n - 1) continue;
                    const newTour = tour.slice();
                    let left = i, right = j;
                    while (left < right) {
                        const tmp = newTour[left];
                        newTour[left] = newTour[right];
                        newTour[right] = tmp;
                        left++;
                        right--;
                    }
                    const newCost = calcDist(newTour);
                    if (newCost < cost - 1e-6) {
                        cost = newCost;
                        tour = newTour;
                        improved = true;
                    }
                }
            }
        }
        return { tour, cost };
    }

    let globalBestTour = [];
    let globalBestCost = Infinity;

    // Multi-Start Nearest Neighbor across all starting cities + 2-Opt Refinement
    for (let s = 0; s < n; s++) {
        const unvisited = new Set(Array.from({ length: n }, (_, i) => i));
        const nnTour = [s];
        unvisited.delete(s);

        let current = s;
        while (unvisited.size > 0) {
            let nearest = -1;
            let minDist = Infinity;
            for (const nbr of unvisited) {
                const d = distSub[current][nbr];
                if (d < minDist) {
                    minDist = d;
                    nearest = nbr;
                }
            }
            nnTour.push(nearest);
            unvisited.delete(nearest);
            current = nearest;
        }

        const refined = run2OptRefinement(nnTour);
        if (refined.cost < globalBestCost) {
            globalBestCost = refined.cost;
            globalBestTour = refined.tour;
        }
    }

    return {
        tourIndices: globalBestTour,
        cityNames: globalBestTour.map(idx => selectedCities[idx].name),
        totalDistance: globalBestCost
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
