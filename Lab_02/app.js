
const pakistanLimits = L.latLngBounds(
    [21.5, 58.5],
    [39.0, 80.5]
);

const map = L.map('map', {
    maxBounds: pakistanLimits,
    maxBoundsViscosity: 1.0,
    minZoom: 5
}).setView([30.3753, 69.3451], 5);


// 1. Add OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// 2. Store the district data
let districts = null;
let layer = null;


// 3. Format values for display
function show(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return 'not recorded';
    }

    return typeof value === 'number'
        ? value.toLocaleString()
        : value;
}


// 4. Select a colour based on population
function colourFor(population) {
    if (
        population === null ||
        population === undefined ||
        population === ''
    ) {
        return '#c9cfd1';
    }

    if (population > 3000000) return '#7f2704';
    if (population > 1500000) return '#d94801';
    if (population > 750000) return '#f16913';
    if (population > 300000) return '#fd8d3c';

    return '#fdd0a2';
}


// 5. Define the style for each district
function styleFor(feature) {
    return {
        color: '#ffffff',
        weight: 1,
        fillColor: colourFor(feature.properties.pop_2023),
        fillOpacity: 0.8
    };
}


// 6. Draw districts and attach popups
function draw(features) {

    // Remove the previous district layer
    if (layer) {
        map.removeLayer(layer);
    }

    // Create a new layer using the selected features
    layer = L.geoJSON(
        {
            type: 'FeatureCollection',
            features: features
        },
        {
            style: styleFor,

            onEachFeature: function (feature, featureLayer) {
                const p = feature.properties;

                featureLayer.bindPopup(
                    '<b>' + show(p.district) + '</b><br>' +
                    'Province: ' + show(p.province) + '<br>' +
                    'Population: ' + show(p.pop_2023) + '<br>' +
                    'Area: ' + show(p.area_km2) + ' km2'
                );
            }
        }
    ).addTo(map);

    // Zoom to the displayed districts
    if (features.length > 0) {
        map.fitBounds(layer.getBounds());
    }

    // Update the district count
    const countElement = document.getElementById('count');

    if (countElement) {
        countElement.textContent =
            features.length + ' districts';
    }
}


// 7. Fill the province drop-down using GeoJSON data
function fillProvinceList() {
    const select = document.getElementById('province');

    if (!select || !districts) {
        return;
    }

    // Get unique province names
    const provinces = [
        ...new Set(
            districts.features.map(
                feature => feature.properties.province
            )
        )
    ]
        .filter(
            name =>
                name !== null &&
                name !== undefined &&
                name !== ''
        )
        .sort();

    // Clear existing options and add the default option
    select.innerHTML =
        '<option value="all">All provinces</option>';

    // Add each province to the drop-down
    for (const name of provinces) {
        const option = document.createElement('option');

        option.value = name;
        option.textContent = name;

        select.appendChild(option);
    }
}


// 8. Create the population legend
const legend = L.control({
    position: 'bottomright'
});

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');

    const breaks = [
        0,
        300000,
        750000,
        1500000,
        3000000
    ];

    const labels = [
        '300k or less',
        '300k to 750k',
        '750k to 1.5m',
        '1.5m to 3m',
        'over 3m'
    ];

    for (let i = 0; i < breaks.length; i++) {
        div.innerHTML +=
            '<i style="background:' +
            colourFor(breaks[i] + 1) +
            '"></i> ' +
            labels[i] +
            '<br>';
    }

    // Show a separate colour for missing population data
    div.innerHTML +=
        '<i style="background:' +
        colourFor(null) +
        '"></i> no census data';

    return div;
};

legend.addTo(map);


// 9. Make the province filter respond to user selection
function setupProvinceFilter() {
    const select = document.getElementById('province');

    if (!select) {
        console.error(
            'Province drop-down not found. Check index.html.'
        );
        return;
    }

    select.addEventListener('change', function (event) {

        // Get the province selected by the user
        const chosen = event.target.value;

        // Show all districts or only the selected province
        const subset = chosen === 'all'
            ? districts.features
            : districts.features.filter(
                feature =>
                    feature.properties.province === chosen
            );

        // Redraw the map using the selected districts
        draw(subset);
    });
}


// 10. Load the GeoJSON file
async function loadData() {
    try {
        const response = await fetch('data/districts.geojson');

        if (!response.ok) {
            console.error(
                'Request failed with status',
                response.status
            );
            return;
        }

        // Convert the response into JavaScript data
        districts = await response.json();

        // Check that the data loaded
        console.log('features:', districts.features.length);
        console.log('first feature:', districts.features[0]);
        console.log('properties:', districts.features[0].properties);

        // Fill the drop-down before drawing the map
        fillProvinceList();

        // Display all districts when the app first opens
        draw(districts.features);

    } catch (error) {
        console.error(
            'Error loading district data:',
            error
        );
    }
}


// 11. Start the filter and load the data
setupProvinceFilter();
loadData();
