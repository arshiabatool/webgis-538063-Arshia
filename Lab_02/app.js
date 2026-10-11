
"use strict";

// ======================================================
// 1. Define the approximate map boundaries for Pakistan
// ======================================================

const pakistanLimits = L.latLngBounds(
    [21.5, 58.5],
    [39.0, 80.5]
);


// ======================================================
// 2. Initialize the Leaflet map
// ======================================================

const map = L.map("map", {
    maxBounds: pakistanLimits,
    maxBoundsViscosity: 1.0,
    minZoom: 5
}).setView([30.3753, 69.3451], 5);


// ======================================================
// 3. Add the OpenStreetMap basemap
// ======================================================

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);


// ======================================================
// 4. Store the district data and map layer
// ======================================================

let districts = null;
let layer = null;


// ======================================================
// 5. Format values for popups
// ======================================================

function show(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not recorded";
    }

    return typeof value === "number"
        ? value.toLocaleString()
        : value;
}


// ======================================================
// 6. Classify districts by population
// ======================================================

function colourFor(population) {
    if (
        population === null ||
        population === undefined ||
        population === "" ||
        !Number.isFinite(Number(population))
    ) {
        return "#c9cfd1";
    }

    const value = Number(population);

    if (value > 3000000) return "#7f2704";
    if (value > 1500000) return "#d94801";
    if (value > 750000) return "#f16913";
    if (value > 300000) return "#fd8d3c";

    return "#fdd0a2";
}


// ======================================================
// 7. Define the style for each district
// ======================================================

function styleFor(feature) {
    return {
        color: "#ffffff",
        weight: 1,
        fillColor: colourFor(
            feature.properties?.pop_2023
        ),
        fillOpacity: 0.8
    };
}


// ======================================================
// 8. Draw districts and attach popup information
// ======================================================

function draw(features) {

    // Remove the previous district layer
    if (layer) {
        map.removeLayer(layer);
    }

    // Create the new GeoJSON layer
    layer = L.geoJSON(
        {
            type: "FeatureCollection",
            features: features
        },
        {
            style: styleFor,

            onEachFeature: function (feature, featureLayer) {
                const p = feature.properties || {};

                const popupContent =
                    "<b>" + show(p.district) + "</b><br>" +
                    "Province: " + show(p.province) + "<br>" +
                    "Population: " + show(p.pop_2023) + "<br>" +
                    "Area: " + show(p.area_km2) + " km²";

                featureLayer.bindPopup(popupContent);
            }
        }
    ).addTo(map);

    // Zoom to the displayed districts
    if (features.length > 0) {
        const bounds = layer.getBounds();

        if (bounds.isValid()) {
            map.fitBounds(bounds, {
                padding: [10, 10],
                maxZoom: 8
            });
        }
    } else {
        map.setView([30.3753, 69.3451], 5);
    }

    // Update the displayed district count
    const countElement = document.getElementById("count");

    if (countElement) {
        countElement.textContent =
            features.length + " districts";
    }
}


// ======================================================
// 9. Fill the province dropdown
// ======================================================

function fillProvinceList() {
    const select = document.getElementById("province");

    if (!select || !districts) {
        return;
    }

    // Get unique province names from the GeoJSON
    const provinces = [
        ...new Set(
            districts.features.map(function (feature) {
                return feature.properties?.province;
            })
        )
    ]
        .filter(function (name) {
            return (
                name !== null &&
                name !== undefined &&
                String(name).trim() !== ""
            );
        })
        .sort(function (a, b) {
            return String(a).localeCompare(String(b));
        });

    // Reset the dropdown
    select.innerHTML =
        '<option value="all">All provinces</option>';

    // Add one option for each province
    for (const name of provinces) {
        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        select.appendChild(option);
    }
}


// ======================================================
// 10. Create the population legend
// ======================================================

const legend = L.control({
    position: "bottomright"
});

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");

    const categories = [
        {
            color: colourFor(300000),
            label: "300,000 or less"
        },
        {
            color: colourFor(300001),
            label: "300,001 – 750,000"
        },
        {
            color: colourFor(750001),
            label: "750,001 – 1.5 million"
        },
        {
            color: colourFor(1500001),
            label: "1.5 – 3 million"
        },
        {
            color: colourFor(3000001),
            label: "Over 3 million"
        },
        {
            color: colourFor(null),
            label: "No census data"
        }
    ];

    let legendHTML = "<strong>Population (2023)</strong><br>";

    for (const category of categories) {
        legendHTML +=
            '<div class="legend-item">' +
            '<i style="background:' + category.color + '"></i>' +
            "<span>" + category.label + "</span>" +
            "</div>";
    }

    div.innerHTML = legendHTML;

    return div;
};

legend.addTo(map);


// ======================================================
// 11. Set up the province filter
// ======================================================

function setupProvinceFilter() {
    const select = document.getElementById("province");

    if (!select) {
        console.error(
            "Province dropdown not found. Check index.html."
        );
        return;
    }

    select.addEventListener("change", function (event) {

        if (!districts) {
            return;
        }

        const chosen = event.target.value;

        // Display all districts or only the selected province
        const subset = chosen === "all"
            ? districts.features
            : districts.features.filter(function (feature) {
                return feature.properties?.province === chosen;
            });

        draw(subset);
    });
}


// ======================================================
// 12. Load the GeoJSON file
// ======================================================

async function loadData() {
    const countElement = document.getElementById("count");

    try {
        if (countElement) {
            countElement.textContent = "Loading districts...";
        }

        // IMPORTANT:
        // districts_C.geojson is in the same folder as index.html
        // and app.js, so use this relative path.
        const response = await fetch("./districts_C.geojson");

        if (!response.ok) {
            throw new Error(
                "Could not load GeoJSON. HTTP status: " +
                response.status
            );
        }

        districts = await response.json();

        // Validate the GeoJSON structure
        if (
            !districts ||
            districts.type !== "FeatureCollection" ||
            !Array.isArray(districts.features)
        ) {
            throw new Error(
                "Invalid GeoJSON. Expected a FeatureCollection."
            );
        }

        console.log(
            "GeoJSON loaded successfully. Features:",
            districts.features.length
        );

        if (districts.features.length > 0) {
            console.log(
                "First feature properties:",
                districts.features[0].properties
            );
        }

        // Populate the dropdown and display the districts
        fillProvinceList();
        draw(districts.features);

    } catch (error) {
        console.error("Error loading district data:", error);

        if (countElement) {
            countElement.textContent =
                "Could not load districts. Check the console.";
        }
    }
}


// ======================================================
// 13. Start the application
// ======================================================

setupProvinceFilter();
loadData();
