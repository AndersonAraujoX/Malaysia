/**
 * Malaysia 20 Important Cities Data & Geographical Distance Utilities
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
        desc: "Capital do estado de Penang e Patrimônio Mundial da UNESCO. Polo industrial de semicondutores ('Vale do Silício do Oriente') e capital gastronômica."
    },
    {
        id: 2,
        name: "Johor Bahru",
        state: "Johor",
        region: "Peninsular",
        lat: 1.4927,
        lon: 103.7414,
        icon: "🌉",
        desc: "Localizada no extremo sul, conectada a Singapura por ponte. Maior motor industrial e logístico do sul malaio."
    },
    {
        id: 3,
        name: "Malaca (Melaka)",
        state: "Melaka",
        region: "Peninsular",
        lat: 2.1896,
        lon: 102.2501,
        icon: "⛵",
        desc: "Cidade histórica UNESCO. Teve papel central no comércio marítimo global de especiarias e preserva influências malaias e europeias."
    },
    {
        id: 4,
        name: "Kota Kinabalu",
        state: "Sabah",
        region: "Bornéu",
        lat: 5.9804,
        lon: 116.0735,
        icon: "🏔️",
        desc: "Capital de Sabah na ilha de Bornéu. Porta de entrada para o turismo de natureza no Bornéu e Monte Kinabalu."
    },
    {
        id: 5,
        name: "Kuching",
        state: "Sarawak",
        region: "Bornéu",
        lat: 1.5533,
        lon: 110.3592,
        icon: "🐱",
        desc: "Capital de Sarawak (maior estado malaio em Bornéu). Coração econômico, administrativo e cultural do noroeste da ilha."
    },
    {
        id: 6,
        name: "Ipoh",
        state: "Perak",
        region: "Peninsular",
        lat: 4.5975,
        lon: 101.0901,
        icon: "⛰️",
        desc: "Capital de Perak, desenvolvida durante o ciclo da mineração de estanho. Famosa por sua gastronomia e proximidade com Cameron Highlands."
    },
    {
        id: 7,
        name: "Kuantan",
        state: "Pahang",
        region: "Peninsular",
        lat: 3.8077,
        lon: 103.3260,
        icon: "🏖️",
        desc: "Capital de Pahang e maior centro comercial e portuário da Costa Leste da Malásia Peninsular, famosa por suas praias."
    },
    {
        id: 8,
        name: "Kuala Terengganu",
        state: "Terengganu",
        region: "Peninsular",
        lat: 5.3302,
        lon: 103.1408,
        icon: "🕌",
        desc: "Capital real de Terengganu, famosa pela arquitetura islâmica clássica, artesanato de batik e proximidade com as Ilhas Redang."
    },
    {
        id: 9,
        name: "Kota Bharu",
        state: "Kelantan",
        region: "Peninsular",
        lat: 6.1254,
        lon: 102.2381,
        icon: "🎨",
        desc: "Capital cultural de Kelantan, próxima à fronteira com a Tailândia, berço das tradições malaias de sombras (Wayang Kulit) e pipas (Wau)."
    },
    {
        id: 10,
        name: "Alor Setar",
        state: "Kedah",
        region: "Peninsular",
        lat: 6.1248,
        lon: 100.3678,
        icon: "🌾",
        desc: "Capital de Kedah, conhecida como o 'Cortejo de Arroz' da Malásia devido às suas vastas plantações de arroz."
    },
    {
        id: 11,
        name: "Seremban",
        state: "Negeri Sembilan",
        region: "Peninsular",
        lat: 2.7258,
        lon: 101.9424,
        icon: "🏠",
        desc: "Capital de Negeri Sembilan, famosa pela arquitetura tradicional Minangkabau de telhados curvados em forma de chifres."
    },
    {
        id: 12,
        name: "Kangar",
        state: "Perlis",
        region: "Peninsular",
        lat: 6.4414,
        lon: 100.1986,
        icon: "🌱",
        desc: "Menor capital estadual da Malásia, localizada no extremo norte de Perlis, famosa por suas formações rochosas e cavernas."
    },
    {
        id: 13,
        name: "Miri",
        state: "Sarawak",
        region: "Bornéu",
        lat: 4.3995,
        lon: 113.9914,
        icon: "🛢️",
        desc: "Berço da indústria de petróleo da Malásia e porta de entrada para o Parque Nacional de Gunung Mulu (Patrimônio UNESCO)."
    },
    {
        id: 14,
        name: "Sandakan",
        state: "Sabah",
        region: "Bornéu",
        lat: 5.8394,
        lon: 118.1172,
        icon: "🦧",
        desc: "Antiga capital de Sabah, centro mundial de ecoturismo e lar do famoso Centro de Reabilitação de Orangotangos de Sepilok."
    },
    {
        id: 15,
        name: "Sibu",
        state: "Sarawak",
        region: "Bornéu",
        lat: 2.3000,
        lon: 111.8167,
        icon: "🌊",
        desc: "Principal porto fluvial no rio Rajang (o mais longo da Malásia), coração comercial do interior de Sarawak."
    },
    {
        id: 16,
        name: "Tawau",
        state: "Sabah",
        region: "Bornéu",
        lat: 4.2447,
        lon: 117.8912,
        icon: "🏝️",
        desc: "Cidade costeira no sudeste de Sabah, porta de acesso para o arquipélago de Semporna e mergulho em Sipadan."
    },
    {
        id: 17,
        name: "Putrajaya",
        state: "Território Federal",
        region: "Peninsular",
        lat: 2.9264,
        lon: 101.6964,
        icon: "🏛️",
        desc: "Centro administrativo federal planejado da Malásia, famoso por suas pontes grandiosas e arquitetura futurista."
    },
    {
        id: 18,
        name: "Bintulu",
        state: "Sarawak",
        region: "Bornéu",
        lat: 3.1667,
        lon: 113.0333,
        icon: "⚡",
        desc: "Polo industrial de gás natural liquefeito (GNL) e energia da Malásia Oriental, localizado entre Miri e Sibu."
    },
    {
        id: 19,
        name: "Klang",
        state: "Selangor",
        region: "Peninsular",
        lat: 3.0449,
        lon: 101.4456,
        icon: "⚓",
        desc: "Cidade real de Selangor e lar do Port Klang, o maior e mais movimentado porto marítimo de carga da Malásia."
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
 * Classical Benchmark Solver (Exact Brute-Force for N<=8, 2-Opt Local Search for N>8)
 */
function solveClassicalTSP(selectedCities, distMatrixFull) {
    const n = selectedCities.length;
    
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
