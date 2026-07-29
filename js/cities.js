/**
 * Malaysia 7 Cities Data & Geographical Distance Utilities
 */

const MALAYSIA_CITIES = [
    {
        id: 0,
        name: "Kuala Lumpur",
        state: "Território Federal",
        region: "Peninsular",
        lat: 3.1390,
        lon: 101.6869,
        icon: "🏛️",
        desc: "Capital nacional e maior metrópole do país. É o principal centro financeiro, comercial e cultural da Malásia, famosa por marcos como as Torres Petronas e as Batu Caves."
    },
    {
        id: 1,
        name: "George Town",
        state: "Penang",
        region: "Peninsular",
        lat: 5.4164,
        lon: 100.3327,
        icon: "🏮",
        desc: "Capital do estado de Penang e Patrimônio Mundial da UNESCO. É um polo industrial e de semicondutores conhecido como o 'Vale do Silício do Oriente', além de ser a capital gastronômica do país."
    },
    {
        id: 2,
        name: "Johor Bahru",
        state: "Johor",
        region: "Peninsular",
        lat: 1.4927,
        lon: 103.7414,
        icon: "🌉",
        desc: "Localizada no extremo sul, conectada a Singapura por ponte. É a capital de Johor e o centro da zona de desenvolvimento de Iskandar, funcionando como o maior motor industrial e logístico do sul malaio."
    },
    {
        id: 3,
        name: "Malaca (Melaka)",
        state: "Melaka",
        region: "Peninsular",
        lat: 2.1896,
        lon: 102.2501,
        icon: "⛵",
        desc: "Cidade histórica e Patrimônio Mundial da UNESCO. Teve papel central no comércio marítimo global de especiarias e preserva influências arquitetônicas malaias, portuguesas, holandesas e britânicas."
    },
    {
        id: 4,
        name: "Kota Kinabalu",
        state: "Sabah",
        region: "Bornéu",
        lat: 5.9804,
        lon: 116.0735,
        icon: "🏔️",
        desc: "Capital do estado de Sabah, na ilha de Bornéu. Serve como a principal porta de entrada para o turismo de natureza na região, acesso ao Monte Kinabalu e centro de comércio da Malásia Oriental."
    },
    {
        id: 5,
        name: "Kuching",
        state: "Sarawak",
        region: "Bornéu",
        lat: 1.5533,
        lon: 110.3592,
        icon: "🐱",
        desc: "Capital de Sarawak (o maior estado malaio em Bornéu). É o coração econômico, administrativo e cultural do noroeste da ilha."
    },
    {
        id: 6,
        name: "Ipoh",
        state: "Perak",
        region: "Peninsular",
        lat: 4.5975,
        lon: 101.0901,
        icon: "⛰️",
        desc: "Capital do estado de Perak, desenvolvida durante o ciclo da mineração de estanho no século XIX. É uma das maiores áreas urbanas do país, famosa por sua gastronomia e pela proximidade com as Cameron Highlands."
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
 * Builds Full 7x7 Distance Matrix in km
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
 * Exact Classical TSP Solver using Brute-Force for selected city indices
 */
function solveClassicalTSP(selectedCities, distMatrixFull) {
    const n = selectedCities.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Fix start city at indices[0]
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
