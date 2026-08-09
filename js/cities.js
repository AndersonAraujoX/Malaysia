/**
 * Malaysia 20 Important Cities Data & Geographical Distance Utilities
 */

const MALAYSIA_CITIES = [
    {
        id: 0,
        name: "Kuala Lumpur",
        state: "Federal Territory",
        region: "Peninsular",
        lat: 3.1390,
        lon: 101.6869,
        icon: "🏛️",
        desc: "National capital and largest metropolis of Malaysia. Main financial, commercial, and cultural center of the country, famous for landmarks such as the Petronas Towers and Batu Caves."
    },
    {
        id: 1,
        name: "George Town",
        state: "Penang",
        region: "Peninsular",
        lat: 5.4164,
        lon: 100.3327,
        icon: "🏮",
        desc: "Capital of Penang state and UNESCO World Heritage Site. Major semiconductor manufacturing hub ('Silicon Valley of the East') and culinary capital."
    },
    {
        id: 2,
        name: "Johor Bahru",
        state: "Johor",
        region: "Peninsular",
        lat: 1.4927,
        lon: 103.7414,
        icon: "🌉",
        desc: "Located in the extreme south, connected to Singapore by a causeway. Largest industrial and logistical engine of southern Malaysia."
    },
    {
        id: 3,
        name: "Melaka",
        state: "Melaka",
        region: "Peninsular",
        lat: 2.1896,
        lon: 102.2501,
        icon: "⛵",
        desc: "Historic UNESCO city. Played a central role in the global maritime spice trade, preserving Malay and European heritage."
    },
    {
        id: 4,
        name: "Kota Kinabalu",
        state: "Sabah",
        region: "Borneo",
        lat: 5.9804,
        lon: 116.0735,
        icon: "🏔️",
        desc: "Capital of Sabah on Borneo island. Gateway to nature tourism in Borneo and Mount Kinabalu."
    },
    {
        id: 5,
        name: "Kuching",
        state: "Sarawak",
        region: "Borneo",
        lat: 1.5533,
        lon: 110.3592,
        icon: "🐱",
        desc: "Capital of Sarawak (largest Malaysian state in Borneo). Economic, administrative, and cultural heart of northwestern Borneo."
    },
    {
        id: 6,
        name: "Ipoh",
        state: "Perak",
        region: "Peninsular",
        lat: 4.5975,
        lon: 101.0901,
        icon: "⛰️",
        desc: "Capital of Perak, developed during the tin mining boom. Famous for its cuisine and proximity to Cameron Highlands."
    },
    {
        id: 7,
        name: "Kuantan",
        state: "Pahang",
        region: "Peninsular",
        lat: 3.8077,
        lon: 103.3260,
        icon: "🏖️",
        desc: "Capital of Pahang and largest commercial and port hub on the East Coast of Peninsular Malaysia, famous for its beaches."
    },
    {
        id: 8,
        name: "Kuala Terengganu",
        state: "Terengganu",
        region: "Peninsular",
        lat: 5.3302,
        lon: 103.1408,
        icon: "🕌",
        desc: "Royal capital of Terengganu, famous for classic Islamic architecture, batik handicrafts, and proximity to the Redang Islands."
    },
    {
        id: 9,
        name: "Kota Bharu",
        state: "Kelantan",
        region: "Peninsular",
        lat: 6.1254,
        lon: 102.2381,
        icon: "🎨",
        desc: "Cultural capital of Kelantan, near the Thailand border, cradle of Malay traditions such as shadow puppetry (Wayang Kulit) and kites (Wau)."
    },
    {
        id: 10,
        name: "Alor Setar",
        state: "Kedah",
        region: "Peninsular",
        lat: 6.1248,
        lon: 100.3678,
        icon: "🌾",
        desc: "Capital of Kedah, known as the 'Rice Bowl' of Malaysia due to its vast paddy fields."
    },
    {
        id: 11,
        name: "Seremban",
        state: "Negeri Sembilan",
        region: "Peninsular",
        lat: 2.7258,
        lon: 101.9424,
        icon: "🏠",
        desc: "Capital of Negeri Sembilan, famous for traditional Minangkabau architecture with horn-shaped curved roofs."
    },
    {
        id: 12,
        name: "Kangar",
        state: "Perlis",
        region: "Peninsular",
        lat: 6.4414,
        lon: 100.1986,
        icon: "🌱",
        desc: "Smallest state capital in Malaysia, located in the far north of Perlis, famous for limestone formations and caves."
    },
    {
        id: 13,
        name: "Miri",
        state: "Sarawak",
        region: "Borneo",
        lat: 4.3995,
        lon: 113.9914,
        icon: "🛢️",
        desc: "Birthplace of Malaysia's petroleum industry and gateway to Gunung Mulu National Park (UNESCO World Heritage Site)."
    },
    {
        id: 14,
        name: "Sandakan",
        state: "Sabah",
        region: "Borneo",
        lat: 5.8394,
        lon: 118.1172,
        icon: "🦧",
        desc: "Former capital of Sabah, global ecotourism hub and home to the famous Sepilok Orangutan Rehabilitation Centre."
    },
    {
        id: 15,
        name: "Sibu",
        state: "Sarawak",
        region: "Borneo",
        lat: 2.3000,
        lon: 111.8167,
        icon: "🌊",
        desc: "Major river port on the Rajang River (Malaysia's longest river), commercial heart of Sarawak's interior."
    },
    {
        id: 16,
        name: "Tawau",
        state: "Sabah",
        region: "Borneo",
        lat: 4.2447,
        lon: 117.8912,
        icon: "🏝️",
        desc: "Coastal city in southeastern Sabah, gateway to the Semporna archipelago and diving at Sipadan."
    },
    {
        id: 17,
        name: "Putrajaya",
        state: "Federal Territory",
        region: "Peninsular",
        lat: 2.9264,
        lon: 101.6964,
        icon: "🏛️",
        desc: "Planned federal administrative centre of Malaysia, famous for grand bridges and futuristic architecture."
    },
    {
        id: 18,
        name: "Bintulu",
        state: "Sarawak",
        region: "Borneo",
        lat: 3.1667,
        lon: 113.0333,
        icon: "⚡",
        desc: "Liquefied Natural Gas (LNG) and industrial energy hub of East Malaysia, situated between Miri and Sibu."
    },
    {
        id: 19,
        name: "Klang",
        state: "Selangor",
        region: "Peninsular",
        lat: 3.0449,
        lon: 101.4456,
        icon: "⚓",
        desc: "Royal city of Selangor and home to Port Klang, Malaysia's largest and busiest seaport."
    }
];

/**
 * Calculates Haversine distance in km between two (lat, lon) coordinates
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0; // km
    const dLat = (lat2 - lat1) * Math.PI / 180.0;
    const dLon = (lon2 - lon1) * Math.PI / 180.0;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Builds Full 20x20 Distance Matrix in km
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
 * Exact Classical TSP Solver using Brute-Force / 2-Opt for selected city indices
 */
function solveClassicalTSP(selectedCities, distMatrixFull) {
    if (!selectedCities || selectedCities.length === 0) {
        return { tourIndices: [], cityNames: [], totalDistance: 0 };
    }
    const n = selectedCities.length;
    
    // For <= 8 cities, use exact brute-force search
    if (n <= 8) {
        const indices = Array.from({ length: n }, (_, i) => i);
        const otherIndices = indices.slice(1);
        
        function permutations(arr) {
            if (arr.length <= 1) return [arr];
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                const current = arr[i];
                const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
                const perms = permutations(remaining);
                for (const p of perms) {
                    result.push([current].concat(p));
                }
            }
            return result;
        }

        let bestCost = Infinity;
        let bestTour = null;

        const perms = permutations(otherIndices);
        for (const p of perms) {
            const tour = [0, ...p];
            let cost = 0;
            for (let k = 0; k < n; k++) {
                const u = selectedCities[tour[k]].id;
                const v = selectedCities[tour[(k + 1) % n]].id;
                cost += distMatrixFull[u][v];
            }
            if (cost < bestCost) {
                bestCost = cost;
                bestTour = tour;
            }
        }

        return {
            tourIndices: bestTour,
            cityNames: bestTour.map(idx => selectedCities[idx].name),
            totalDistance: bestCost
        };
    }

    // For > 8 cities (e.g. 20 cities), use 2-Opt local search to find optimal tour instantly
    let bestTour = Array.from({ length: n }, (_, i) => i);
    let distSub = Array.from({ length: n }, () => new Float64Array(n));
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

    let bestCost = calcDist(bestTour);
    let improved = true;

    while (improved) {
        improved = false;
        for (let i = 1; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                const newTour = bestTour.slice();
                let left = i, right = j;
                while (left < right) {
                    const tmp = newTour[left];
                    newTour[left] = newTour[right];
                    newTour[right] = tmp;
                    left++; right--;
                }
                const newCost = calcDist(newTour);
                if (newCost < bestCost) {
                    bestCost = newCost;
                    bestTour = newTour;
                    improved = true;
                }
            }
        }
    }

    return {
        tourIndices: bestTour,
        cityNames: bestTour.map(idx => selectedCities[idx].name),
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
