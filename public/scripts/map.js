let map, userPos, directionsService, directionsRenderer;

function initMap() {
  // Default location (in case geolocation fails)
  const defaultPos = { lat: -26.2041, lng: 28.0473 }; // Johannesburg

  // Initialize map
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 14,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#003366',
      strokeWeight: 6,
      strokeOpacity: 0.9
    }
  });
  directionsRenderer.setMap(map);

  // Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        map.setCenter(userPos);
        new google.maps.Marker({ position: userPos, map, title: "You are here" });
      },
      () => {
        console.warn("Geolocation denied or failed, using default location.");
        userPos = defaultPos;
      }
    );
  } else {
    userPos = defaultPos;
  }

  // Search box
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);
  map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));

  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();
    if (!places.length) return;
    const place = places[0];
    if (!place.geometry || !place.geometry.location) return;

    // Drop marker for searched place
    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name
    });

    map.panTo(place.geometry.location);
    map.setZoom(14);

    // Show directions
    if (userPos) {
      directionsService.route(
        {
          origin: userPos,
          destination: place.geometry.location,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(result);
            const leg = result.routes[0].legs[0];
            document.querySelector("#info-panel .distance").textContent = `Distance: ${leg.distance.text}`;
            document.querySelector("#info-panel .duration").textContent = `Duration: ${leg.duration.text}`;
          } else {
            alert("Directions request failed due to " + status);
          }
        }
      );
    }
  });
}

// Make sure initMap is globally accessible
window.initMap = initMap;
