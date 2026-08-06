// const axios = require('axios');
// const captainModel = require('../models/captain.model');

// module.exports.getAddressCoordinate = async (address) => {
//     const apiKey = process.env.GOOGLE_MAPS_API;
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

//     try {
//         const response = await axios.get(url);
//         if (response.data.status === 'OK') {
//             const location = response.data.results[ 0 ].geometry.location;
//             return {
//                 ltd: location.lat,
//                 lng: location.lng
//             };
//         } else {
//             throw new Error('Unable to fetch coordinates');
//         }
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// }

// module.exports.getDistanceTime = async (origin, destination) => {
//     if (!origin || !destination) {
//         throw new Error('Origin and destination are required');
//     }

//     const apiKey = process.env.GOOGLE_MAPS_API;
//     const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

//     try {
//         const response = await axios.get(url);
//         if (response.data.status === 'OK') {
//             if (response.data.rows[ 0 ].elements[ 0 ].status === 'ZERO_RESULTS') {
//                 throw new Error('No routes found');
//             }
//             return response.data.rows[ 0 ].elements[ 0 ];
//         } else {
//             throw new Error('Unable to fetch distance and time');
//         }
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// module.exports.getAutoCompleteSuggestions = async (input) => {
//     if (!input) {
//         throw new Error('query is required');
//     }

//     const apiKey = process.env.GOOGLE_MAPS_API;
//     const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

//     try {
//         const response = await axios.get(url);
//         if (response.data.status === 'OK') {
//             return response.data.predictions.map(prediction => prediction.description).filter(value => value);
//         } else {
//             throw new Error('Unable to fetch suggestions');
//         }
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

// module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
//     // radius in km
//     const captains = await captainModel.find({
//         location: {
//             $geoWithin: {
//                 $centerSphere: [ [ ltd, lng ], radius / 6371 ]
//             }
//         }
//     });

//     return captains;
// }


const axios = require('axios');
const captainModel = require('../models/captain.model');

// ---- Geoapify Version ----
// Sob API call e ekhon GEOAPIFY_API_KEY use hocche (Google Maps er bodole)

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&format=json&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.results && response.data.results.length > 0) {
            const location = response.data.results[0];
            return {
                ltd: location.lat,
                lng: location.lon
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    try {
        // Step 1: origin o destination address -> coordinates e convert kora
        // (Geoapify Routing API sorasori address newy na, khali lat/lon newy)
        const originCoords = await module.exports.getAddressCoordinate(origin);
        const destCoords = await module.exports.getAddressCoordinate(destination);

        // Step 2: Routing API diye distance & time ber kora
        const waypoints = `${originCoords.ltd},${originCoords.lng}|${destCoords.ltd},${destCoords.lng}`;
        const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=drive&apiKey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data.features && response.data.features.length > 0) {
            const props = response.data.features[0].properties;

            if (!props || props.distance === undefined) {
                throw new Error('No routes found');
            }

            // Google er format er sathe compatible thakar jonno eibhabe return kora hocche
            return {
                distance: {
                    value: props.distance, // meters
                    text: `${(props.distance / 1000).toFixed(1)} km`
                },
                duration: {
                    value: props.time, // seconds
                    text: `${Math.ceil(props.time / 60)} mins`
                }
            };
        } else {
            throw new Error('Unable to fetch distance and time');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&format=json&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.results) {
            return response.data.results
                .map(result => result.formatted)
                .filter(value => value);
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    // radius in km
    // MongoDB $centerSphere requires [longitude, latitude] order — NOT [lat, lng]
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ lng, ltd ], radius / 6371 ]
            }
        }
    });

    return captains;
}