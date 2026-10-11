
"use strict";

// ======================================================
// 1. Pakistan map boundaries
// ======================================================

const pakistanLimits = L.latLngBounds(
    [21.5, 58.5],
    [39.0, 80.5]
);

// ======================================================
// 2. Initialize the map
// ======================================================

const map = L.map("map", {
    maxBounds: pakistanLimits,
    maxBoundsViscosity: 1.0,
    minZoom: 4
}).setView([30.3753, 69.3451], 5);

// ======================================================
// 3. OpenStreetMap basemap
// ======================================================

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// ======================================================
// 4. Global variables
// ======================================================

let districts = null;
let districtLayer = null;

// ======================================================
// 5. Find property values safely
// Supports different possible GeoJSON field names
// ======================================================

function getProperty(properties, names) {
    if (!properties) return null;

    // First try exact field names
    for (const name of names) {
        if (
            properties[name] !== undefined &&
            properties[name] !== null &&
            properties[name] !== ""
        ) {
            return properties[name];
        }
    }

    // Then try matching names without case/spacing differences
    const keys = Object.keys(properties);

    for (const name of names) {
        const wanted = name.toLowerCase().replace(/[^a-z0-9]/g, "");

        const matchingKey = keys.find(function (key) {
            return key.toLowerCase().replace(/[^a-z0-9]/g, "") === wanted;
        });

        if (
            matchingKey &&
            properties[matchingKey] !== undefined &&
            properties[matchingKey] !== null &&
            properties[matchingKey] !== ""
        ) {
            return properties[matchingKey];
        }
    }

    return null;
}

// ======================================================
// 6. Format popup values
// ======================================================

function show(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not recorded";
    }

    if (typeof value === "number") {
        return value.toLocaleString();
    }

    const number = Number(value);

    if (
        String(value).trim() !== "" &&
        Number.isFinite(number)
    ) {
        return number.toLocaleString();
    }

    return String(value);
}

// ======================================================
// 7. Read district properties
// ======================================================

function getDistrictName(properties) {
    return getProperty(properties, [
        "district",
        "district_name",
        "DISTRICT",
        "District",
        "name",
        "NAME_2",
        "ADM2_EN"
    ]);
}

function getProvinceName(properties) {
    return getProperty(properties, [
        "province",
        "province_name",
        "PROVINCE",
        "Province",
        "ADM1_EN",
        "NAME_1"
    ]);
}

function getPopulation(properties) {
    return getProperty(properties, [
        "pop_2023",
        "population_2023",
        "population",
        "Population",
        "POPULATION",
        "pop",
        "TOT_POP"
    ]);
}

function getArea(properties) {
    return getProperty(properties, [
        "area_km2",
        "area",
        "Area",
        "AREA_KM2",
        "Shape_Area"
    ]);
}

// ======================================================
// 8. Population classification
// ======================================================

function colourFor(population) {
    if (
        population === null ||
        population === undefined ||
        String(population).trim() === ""
    ) {
        return "#c9cfd1";
    }

    // Remove commas from numeric text such as "1,200,000"
    const value = Number(
        String(population).replace(/,/g, "")
    );

    if (!Number.isFinite(value)) {
        return "#c9cfd1";
    }

    if (value > 3000000) return "#7f2704";
    if (value > 1500000) return "#d94801";
    if (value > 750000) return "#f16913";
    if (value > 300000) return "#fd8d3c";

    return "#fdd0a2";
}

// ======================================================
// 9. Style each district
// ======================================================

function styleFor(feature) {
    return {
        color: "#333333",
        weight: 1,
        opacity: 1,
        fillColor: colourFor(
            getPopulation(feature.properties)
        ),
        fillOpacity: 0.75
    };
}

// ======================================================
// 10. Draw the GeoJSON district layer
// ======================================================

function draw(features) {
    // Remove the old layer before drawing a new one
    if (districtLayer) {
        map.removeLayer(districtLayer);
        districtLayer = null;
    }

    const validFeatures = features.filter(function (feature) {
        return (
            feature &&
            feature.geometry &&
            (
                feature.geometry.type === "Polygon" ||
                feature.geometry.type === "MultiPolygon"
            )
        );
    });

    console.log("District features to draw:", validFeatures.length);

    districtLayer = L.geoJSON(
        {
            type: "FeatureCollection",
            features: validFeatures
        },
        {
            style: styleFor,

            onEachFeature: function (feature, featureLayer) {
                const properties = feature.properties || {};

                const district = getDistrictName(properties);
                const province = getProvinceName(properties);
                const population = getPopulation(properties);
                const area = getArea(properties);

                const popupContent =
                    "<strong>" + show(district) + "</strong><br>" +
                    "Province: " + show(province) + "<br>" +
                    "Population: " + show(population) + "<br>" +
                    "Area: " + show(area) + " km²";

                featureLayer.bindPopup(popupContent);
            }
        }
    ).addTo(map);

    // Fit the map to the actual district boundaries
    const bounds = districtLayer.getBounds();

    if (bounds.isValid()) {
        map.fitBounds(bounds, {
            padding: [15, 15],
            maxZoom: 8
        });
    } else {
        console.error(
            "No valid district boundaries found in the GeoJSON."
        );

        map.setView([30.3753, 69.3451], 5);
    }

    // Update district count
    const countElement = document.getElementById("count");

    if (countElement) {
        countElement.textContent =
            validFeatures.length + " districts";
    }
}

// ======================================================
// 11. Fill province dropdown
// ======================================================

function fillProvinceList() {
    const select = document.getElementById("province");

    if (!select || !districts) return;

    const provinceNames = districts.features
        .map(function (feature) {
            return getProvinceName(feature.properties);
        })
        .filter(function (name) {
            return (
                name !== null &&
                name !== undefined &&
                String(name).trim() !== ""
            );
        });

    const uniqueProvinces = [
        ...new Set(provinceNames.map(String))
    ].sort(function (a, b) {
        return a.localeCompare(b);
    });

    select.innerHTML =
        '<option value="all">All provinces</option>';

    uniqueProvinces.forEach(function (province) {
        const option = document.createElement("option");

        option.value = province;
        option.textContent = province;

        select.appendChild(option);
    });

    console.log("Province options:", uniqueProvinces);
}

// ======================================================
// 12. Population legend
// ======================================================

const legend = L.control({
    position: "bottomright"
});

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");

    const categories = [
        { value: 100000, label: "300,000 or less" },
        { value: 500000, label: "300,001 – 750,000" },
        { value: 1000000, label: "750,001 – 1.5 million" },
        { value: 2000000, label: "1.5 – 3 million" },
        { value: 4000000, label: "Over 3 million" },
        { value: null, label: "No population data" }
    ];

    let html = "<strong>Population (2023)</strong>";

    categories.forEach(function (category) {
        html +=
            '<div class="legend-item">' +
            '<i style="background:' +
            colourFor(category.value) +
            '"></i>' +
            "<span>" + category.label + "</span>" +
            "</div>";
    });

    div.innerHTML = html;

    return div;
};

legend.addTo(map);

// ======================================================
// 13. Province filter
// ======================================================

function setupProvinceFilter() {
    const select = document.getElementById("province");

    if (!select) {
        console.error(
            "Province dropdown not found. Check index.html."
        );
        return;
    }

    select.addEventListener("change", function () {
        if (!districts) return;

        const chosenProvince = select.value;

        const filteredFeatures =
            chosenProvince === "all"
                ? districts.features
                : districts.features.filter(function (feature) {
                    const province = getProvinceName(
                        feature.properties
                    );

                    return String(province) === chosenProvince;
                });

        draw(filteredFeatures);
    });
}

// ======================================================
// 14. Load the GeoJSON file
// ======================================================

async function loadData() {
    const countElement = document.getElementById("count");

    try {
        if (countElement) {
            countElement.textContent = "Loading districts...";
        }

        const response = await fetch("./districts_C.geojson");

        if (!response.ok) {
            throw new Error(
                "GeoJSON request failed: HTTP " + response.status
            );
        }

        const data = await response.json();

        if (
            !data ||
            data.type !== "FeatureCollection" ||
            !Array.isArray(data.features)
        ) {
            throw new Error(
                "Invalid GeoJSON: expected a FeatureCollection."
            );
        }

        // Keep only features with polygon geometry
        districts = {
            type: "FeatureCollection",
            features: data.features
        };

        console.log("GeoJSON loaded successfully.");
        console.log("Total features:", districts.features.length);

        if (districts.features.length > 0) {
            console.log(
                "First feature properties:",
                districts.features[0].properties
            );

            console.log(
                "First feature geometry:",
                districts.features[0].geometry
            );
        }

        const polygonCount = districts.features.filter(
            function (feature) {
                return (
                    feature.geometry &&
                    (
                        feature.geometry.type === "Polygon" ||
                        feature.geometry.type === "MultiPolygon"
                    )
                );
            }
        ).length;

        console.log("Polygon features:", polygonCount);

        fillProvinceList();
        draw(districts.features);

    } catch (error) {
        console.error("Error loading district data:", error);

        if (countElement) {
            countElement.textContent =
                "Districts failed to load. Check Console.";
        }
    }
}

// ======================================================
// 15. Start the application
// ======================================================

setupProvinceFilter();
loadData();
