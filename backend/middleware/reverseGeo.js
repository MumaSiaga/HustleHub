const axios = require("axios");

async function getCityFromCoordinates(lat, lng) {
  try {
    const MAP_KEY = process.env.MAP_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAP_KEY}`;

    const response = await axios.get(url);

    const results = response.data.results;
    if (!results || results.length === 0) return null;

    const addressComponents = results[0].address_components;

    // Get street, sublocality, and city
    const street = addressComponents.find(c => c.types.includes("route"))?.long_name;
    const sublocality = addressComponents.find(c => c.types.includes("sublocality") || c.types.includes("neighborhood"))?.long_name;
    const city = addressComponents.find(c => c.types.includes("locality") || c.types.includes("administrative_area_level_2"))?.long_name;

    // Combine parts (skip nulls)
    const parts = [street, sublocality, city].filter(Boolean);
    return parts.join(", ");

  } catch (error) {
    console.error("❌ Error reverse geocoding:", error.response?.data || error.message);
    return null;
  }
}

module.exports = getCityFromCoordinates;
