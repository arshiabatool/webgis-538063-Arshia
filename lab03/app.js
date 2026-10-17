

const useCanvas = new URLSearchParams(window.location.search).has('canvas');

"use strict";



// ======================================================
// PART 1: Initialize the map
// ======================================================

const pakistanLimits = L.latLngBounds(
    [21.5, 58.5],
    [39.0, 80.5]
);


const map = L.map("map", {
    maxBounds: pakistanLimits,
    maxBoundsViscosity: 1,
    minZoom: 5,
    maxZoom: 14,
    preferCanvas: useCanvas
}).setView([30.3753, 69.3451], 5);

// ======================================================
// PART 2: Basemaps
// ======================================================

const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }
);

const carto = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19
    }
).addTo(map);

const imagery = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    }
);

const baseMaps = {
    "OpenStreetMap": osm,
    "Carto Positron": carto,
    "Esri World Imagery": imagery
};

const layerControl = L.control.layers(baseMaps, {}).addTo(map);

L.control.scale({
    imperial: false
}).addTo(map);


// ======================================================
// PART 3: Create a pane for proportional symbols
// ======================================================

// Polygon overlayPane has z-index 400.
// Our symbols pane has z-index 450.
// Therefore, population circles appear above polygons.

map.createPane("symbols");
map.getPane("symbols").style.zIndex = 450;


// ======================================================
// PART 4: Helper functions for district data
// ======================================================

function show(value) {
    return value === null ||
           value === undefined ||
           value === ""
        ? "No data"
        : value;
}

function densityOf(properties) {
    const population = Number(properties.pop_2023);
    const area = Number(properties.area_km2);

    if (
        properties.pop_2023 === null ||
        properties.pop_2023 === undefined ||
        properties.pop_2023 === "" ||
        properties.area_km2 === null ||
        properties.area_km2 === undefined ||
        properties.area_km2 === "" ||
        !Number.isFinite(population) ||
        !Number.isFinite(area) ||
        population < 0 ||
        area <= 0
    ) {
        return null;
    }

    return population / area;
}

function colourFor(density) {
    if (density === null) return "#bdbdbd";
    if (density > 1000) return "#800026";
    if (density > 400) return "#bd0026";
    if (density > 150) return "#e31a1c";
    if (density > 50) return "#fc4e2a";

    return "#feb24c";
}

function styleFor(feature) {
    const density = densityOf(feature.properties);

    return {
        fillColor: colourFor(density),
        weight: 1,
        color: "#555555",
        fillOpacity: 0.65
    };
}


// ======================================================
// PART 5: District layer and information panel
// ======================================================

const districtGroup = L.featureGroup().addTo(map);

layerControl.addOverlay(
    districtGroup,
    "Population density"
);

let allDistricts = null;
let allPoints = null;
let districts = null;


// Information panel

const info = L.control({
    position: "topright"
});

info.onAdd = function () {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
};

info.update = function (properties) {
    if (!properties) {
        this._div.innerHTML =
            "<h4>District information</h4>" +
            "<p>Hover over a district to view its details.</p>";
        return;
    }

    const density = densityOf(properties);

    this._div.innerHTML =
        "<h4>District information</h4>" +
        "<b>District:</b> " +
        show(properties.district) + "<br>" +

        "<b>Province:</b> " +
        show(properties.province) + "<br>" +

        "<b>Population:</b> " +
        (
            properties.pop_2023 == null
                ? "No data"
                : Number(properties.pop_2023).toLocaleString()
        ) + "<br>" +

        "<b>Area:</b> " +
        (
            properties.area_km2 == null
                ? "No data"
                : Number(properties.area_km2).toLocaleString() +
                  " km²"
        ) + "<br>" +

        "<b>Density:</b> " +
        (
            density === null
                ? "No data"
                : density.toFixed(1) + " people/km²"
        ) + "<br>" +

        "<b>Zoom:</b> " + map.getZoom();
};

info.addTo(map);


// Highlight a district when the mouse enters it

function highlight(e) {
    e.target.setStyle({
        weight: 3,
        color: "#1a202c",
        fillOpacity: 0.95
    });

    e.target.bringToFront();

    info.update(e.target.feature.properties);
}


// Restore the original district style

function unhighlight(e) {
    districts.resetStyle(e.target);
    info.update();
}


// Zoom to the selected district

function zoomToDistrict(e) {
    map.fitBounds(e.target.getBounds(), {
        padding: [20, 20]
    });
}


// Add a tooltip and mouse events to each district

function bindDistrict(feature, layer) {
    layer.bindTooltip(
        show(feature.properties.district),
        { sticky: true }
    );

    layer.on({
        mouseover: highlight,
        mouseout: unhighlight,
        click: zoomToDistrict
    });
}


// ======================================================
// PART 6.1: Proportional population circles
// ======================================================

// Radius is proportional to the square root of population.
// This makes circle AREA proportional to population.

function radiusFor(population) {
    return Math.sqrt(Number(population)) / 160;
}


// Check that the point has a population value

function hasPopulation(feature) {
    const population = feature.properties.pop_2023;

    return population !== null &&
           population !== undefined &&
           population !== "" &&
           Number.isFinite(Number(population)) &&
           Number(population) >= 0;
}


// Create each proportional circle

function circleFor(feature, latlng) {
    const population = Number(feature.properties.pop_2023);

    return L.circleMarker(latlng, {
        pane: "symbols",
        radius: radiusFor(population),
        color: "#7c2d12",
        weight: 1,
        fillColor: "#f97316",
        fillOpacity: 0.7
    }).bindTooltip(
        show(feature.properties.district) +
        ": " + population.toLocaleString()
    );
}


// Create a separate group for population symbols

const circleGroup = L.featureGroup().addTo(map);

layerControl.addOverlay(
    circleGroup,
    "Population"
);


// ======================================================
// PART 6.4: Density and population-size legend
// ======================================================

const legend = L.control({
    position: "bottomright"
});

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");

    // Density legend

    div.innerHTML =
        "<b>Population density</b><br>" +
        '<i style="background:#800026"></i> > 1,000<br>' +
        '<i style="background:#bd0026"></i> 401–1,000<br>' +
        '<i style="background:#e31a1c"></i> 151–400<br>' +
        '<i style="background:#fc4e2a"></i> 51–150<br>' +
        '<i style="background:#feb24c"></i> 0–50<br>' +
        '<i style="background:#bdbdbd"></i> No data<br>';

    // Population-size legend

    const sizes = [10000000, 4000000, 1000000];
    const rMax = radiusFor(sizes[0]);
    const pad = 6;
    const base = pad + 2 * rMax;

    let svg =
        '<svg width="190" height="' +
        (base + pad) +
        '" viewBox="0 0 190 ' +
        (base + pad) +
        '" aria-label="Population circle sizes">';

    for (const population of sizes) {
        const radius = radiusFor(population);
        const cx = pad + rMax;
        const cy = base - radius;

        svg +=
            '<circle cx="' + cx +
            '" cy="' + cy +
            '" r="' + radius +
            '" fill="#f97316" fill-opacity="0.7"' +
            ' stroke="#7c2d12" stroke-width="1"></circle>' +

            '<text x="' + (2 * pad + 2 * rMax) +
            '" y="' + (cy + 4) +
            '" font-size="11">' +
            (population / 1000000) +
            ' million</text>';
    }

    svg += "</svg>";

    div.innerHTML +=
        "<br><b>Population</b><br>" + svg;

    L.DomEvent.disableClickPropagation(div);

    return div;
};

legend.addTo(map);


// ======================================================
// PART 6.5: NUST 25 km circle versus 6-pixel circleMarker
// ======================================================


const nust = [33.6423, 72.9906];

const nustGroup = L.featureGroup([
    L.circle(nust, {
        radius: 25000,
        color: "#0f766e",
        weight: 2,
        fillOpacity: 0.08
    }),

    L.circleMarker(nust, {
        pane: "symbols",
        radius: 6,
        color: "#0f766e",
        fillColor: "#0f766e",
        fillOpacity: 1
    })
]).bindTooltip(
    "NUST H-12: a 25 km circle and a 6 pixel circleMarker"
);

layerControl.addOverlay(nustGroup, "NUST, 25 km");

// Zoom to NUST when the overlay is switched on
map.on("overlayadd", function (event) {
    if (event.layer === nustGroup) {
        map.setView(nust, 10);
    }
});


// ======================================================


function draw(selectedProvince = "all") {
    const t0 = performance.now();
    districtGroup.clearLayers();
    circleGroup.clearLayers();

    // Keep all districts, or filter to one province
    const filteredDistricts = {
        type: "FeatureCollection",
        features: allDistricts.features.filter(function (feature) {
            return selectedProvince === "all" ||
                feature.properties.province === selectedProvince;
        })
    };

    // Draw only the selected province's polygons
    districts = L.geoJSON(filteredDistricts, {
        style: styleFor,
        onEachFeature: bindDistrict
    });

    districtGroup.addLayer(districts);

    // Identify point features belonging to selected districts.
    // Match using district and province attributes.
    const selectedDistrictKeys = new Set(
        filteredDistricts.features.map(function (feature) {
            return feature.properties.district + "|" +
                feature.properties.province;
        })
    );

    const filteredPoints = {
        type: "FeatureCollection",
        features: allPoints.features.filter(function (feature) {
            const properties = feature.properties;

            const matchesProvince =
                selectedProvince === "all" ||
                selectedDistrictKeys.has(
                    properties.district + "|" +
                    properties.province
                );

            return matchesProvince && hasPopulation(feature);
        })
    };

    // Draw proportional population circles
    circleGroup.addLayer(
        L.geoJSON(filteredPoints, {
            pointToLayer: circleFor
        })
    );

    // Update the district count
    const countElement = document.getElementById("count");

    if (countElement) {
        countElement.textContent =
            filteredDistricts.features.length;
    }

    // Zoom to the filtered districts
    if (districts.getLayers().length > 0) {
        map.fitBounds(districts.getBounds(), {
            padding: [10, 10]
        });

    } else {
        info.update();
    }

    const n = filteredDistricts.features.length;

    console.log(
        'draw(' + selectedProvince + '): ' + n +
        ' districts in ' +
        (performance.now() - t0).toFixed(1) +
        ' ms, ' +
        (useCanvas ? 'canvas' : 'SVG')
    );
}


 // ======================================================
 // PART 8.1: Fill the province dropdown
 // ======================================================

function fillProvinceList() {
    const select = document.getElementById("province");

    // Keep the existing "All provinces" option
    const provinces = [...new Set(
        allDistricts.features.map(
            f => f.properties.province
        )
    )].filter(Boolean).sort();

    // Remove old province options but preserve the first option
    select.length = 1;

    for (const name of provinces) {
        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        select.appendChild(option);
    }
}


// ======================================================
// PART 8.2: Listen for province selection changes
// ======================================================

document.getElementById("province")
    .addEventListener("change", function (event) {
        draw(event.target.value);
    });


// ======================================================
// Load both GeoJSON files
// ======================================================


async function loadData() {
    try {
        const [districtResponse, pointResponse] =
            await Promise.all([
                fetch("districts.geojson"),
                fetch("district_points.geojson")
            ]);

        if (!districtResponse.ok) {
            throw new Error("Could not load districts.geojson");
        }

        if (!pointResponse.ok) {
            throw new Error("Could not load district_points.geojson");
        }

        allDistricts = await districtResponse.json();
        allPoints = await pointResponse.json();

        // Populate dropdown before drawing the map
        fillProvinceList();

        // Initially display all provinces
        draw("all");

    } catch (error) {
        console.error("Error loading GeoJSON:", error);

        const countElement = document.getElementById("count");

        if (countElement) {
            countElement.textContent = "Data loading error";
        }
    }
}

loadData();



 // ======================================================
 // PART 7.1: Map click coordinates on/off
 // ======================================================

function showCoordinates(e) {
    L.popup()
        .setLatLng(e.latlng)
        .setContent(
            e.latlng.lat.toFixed(4) +
            ", " +
            e.latlng.lng.toFixed(4)
        )
        .openOn(map);
}

document.getElementById("coords")
    .addEventListener("change", function (event) {
        if (event.target.checked) {
            map.on("click", showCoordinates);
        } else {
            map.off("click", showCoordinates);
        }
    });

 // ======================================================
 // PART 7.2: Update information panel after zooming
 // ======================================================

map.on("zoomend", function () {
    info.update();
});
