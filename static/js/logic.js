// Import Earthquake data //
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// Import Earthquake data //
d3.json(queryUrl).then((data) => {
    console.log(data.features);    
    createFeatures(data.features);
  });


  // Function to determine the radius of the circle based on magnitude
function getRadius(magnitude) {
    return magnitude * 4; // Adjust multiplier as needed for better visualization
}

// Function to determine the color based on depth
function getColor(depth) {
    return depth > 90 ? "#ff0000" : // Red 
           depth > 70 ? "#ff6600" : // Orange
           depth > 50 ? "#ffcc00" : // Yellow
           depth > 30 ? "#ccff33" : // Light green
           depth > 10 ? "#33ff33" : // Green
                        "#00ccff";  // Light blue for shallow earthquakes
}

// Organise earthquakeFeatures data
function createFeatures(earthquakeData) {

    function pointToLayer(feature, latlng) {
        return L.circleMarker(latlng, {
            radius: getRadius(feature.properties.mag),
            fillColor: getColor(feature.geometry.coordinates[2]), 
            color: "#000000", 
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.5
        });
    }    
    function onEachFeature(feature, layer) {
      layer.bindPopup(`<h3>${feature.properties.place}</h3>
        <hr>
        <p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
        <p><strong>Depth:</strong> ${feature.geometry.coordinates[2].toFixed(2)} km</p>
        <p>${new Date(feature.properties.time)}</p>`
    );
    }
    // Save the earthquake data in a variable.
    var earthquakes = L.geoJSON(earthquakeData, {
        pointToLayer: pointToLayer,
        onEachFeature: onEachFeature
    });    
  
    // Pass the earthquake data to a createMap() function.
    createMap(earthquakes);
  }

// Generate map
function createMap(earthquakes) {

    // Create the base layers.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    let satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    let grayscale = L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    let outdoors = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> contributors'
    });

    // Create a baseMaps object.
    let baseMaps = {
        "Street Map": street,
        "Topographic Map": topo,
        "Satellite": satellite,
        "Grayscale": grayscale,
        "Outdoors": outdoors
    };

    // Create plates overlay
    function loadTectonicPlates() {
        return d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then((platesData) => {
            return L.geoJSON(platesData, {
                style: {
                    color: "orange",
                    weight: 2
                }
            });
        });
    }

    // Create a new map.
    let myMap = L.map("map", {
        center: [37.82, -122.42],
        zoom: 5,
        layers: [street, earthquakes]
    });

    // Load tectonic plates and add them to the map
    loadTectonicPlates().then((tectonicPlates) => {
        tectonicPlates.addTo(myMap);

        // Create an overlays object.
        let overlayMaps = {
            "Earthquakes": earthquakes,
            "Tectonic Plates": tectonicPlates
        };

        // Create a layer control that contains our baseMaps.
        L.control.layers(baseMaps, overlayMaps, {
            collapsed: false
        }).addTo(myMap);
    });

    // Add the legend to the map
    let legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend");
    
        // Add styles for the legend box
        div.style.padding = "10px";
        div.style.background = "white";
        div.style.border = "1px solid #ccc";
        div.style.borderRadius = "5px";

        // Add a title to the legend
        div.innerHTML += "<h4>Earthquake Depth (km)</h4>";

        // Add collor and text to the legend
        div.innerHTML += `
            <i style="display: inline-block; width: 18px; height: 18px; background-color: #00ccff; margin-right: 8px;"></i> 0-10<br>
            <i style="display: inline-block; width: 18px; height: 18px; background-color: #33ff33; margin-right: 8px;"></i> 10-30<br>
            <i style="display: inline-block; width: 18px; height: 18px; background-color: #ccff33; margin-right: 8px;"></i> 30-50<br>
            <i style="display: inline-block; width: 18px; height: 18px; background-color: #ffcc00; margin-right: 8px;"></i> 50-70<br>
            <i style="display: inline-block; width: 18px; height: 18px; background-color: #ff6600; margin-right: 8px;"></i> 70-90<br>
            <i style="display: inline-block; width: 18px; height: 18px; background-color: #ff0000; margin-right: 8px;"></i> 90+<br>
        `;

        return div;
    };

    legend.addTo(myMap);
}
