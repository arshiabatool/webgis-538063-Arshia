# webgis-538063-Arshia

Checkpoint 1: C:\webgis\lab3\checkpoint 1.png
Checkpoint 2(a):C:\webgis\lab3\checkpoint 2(a).png
Checkpoint 2(b):C:\webgis\lab3\checkpoint 2(b).png
Checkpoint 3:C:\webgis\lab3\checkpoint 3.png
Checkpoint 4: C:\webgis\lab3\checkpoint 4.png
Checkpoint 5: C:\webgis\lab3\checkpoint 5.png
Checkpoint 6(a):C:\webgis\lab3\checkpoint 6(a).png
Checkpoint 6(b):C:\webgis\lab3\checkpoint 6(b) Nust overlay.png
Checkpoint 7:C:\webgis\lab3\checkpoint 7.png
Checkpoint 7 notes:C:\webgis\lab3\checkpoint 7 notes.png
Checkpoint 8:C:\webgis\lab3\checkpoint 8.png
Checkpoint 9:C:\webgis\lab3\checkpoint 9.png
Checkpoint 9 table:C:\webgis\lab3\checkpoint 9 table.png


Feature count : 160

The row and column in your Esri tile URL: 25 /45

Your notes from the three steps in Part 7
Step 1: When the checkbox was enabled, clicking the sea displayed the clicked point's latitude and longitude.
Step 2: Clicking a district also triggered its district-click event, which zoomed the map to that district. The legend prevented map-click events from propagating while disableClickPropagation was enabled.
Step 3: When the checkbox was disabled, clicking the sea no longer displayed coordinate popups because map.off("click", showCoordinates) removed the handler.


The table from Part 9:
Measurement	SVG	Canvas
Median draw(all) time, ms	85 ms	62 ms
Elements inside leaflet-overlay-pane	1 SVG element containing individual district <path> elements	1 Canvas element for vector rendering
Hover highlight still works?	Yes	Yes
Can you inspect one district in Elements?	Yes	No


Questions
1. Lab2shadeddistricts by population. Name one large, thinly populated district and one small, crowded
one, and explain how each would mislead on the Lab 2 map.

Large, thinly populated district — e.g. Chagai (Balochistan) (the largest district by area, ~44,000 km², with a very small population). On the Lab 2 map it would be shaded in one of the lowest classes — but that low value comes from its enormous area, not from a low population in any meaningful sense. The shading mostly just repeats the district's area: big districts look "empty" and small ones look "full."

Small, crowded district — e.g. Lahore (Punjab) (~1,772 km², ~13 million people). It is tiny in area but very populous, so it sits in the highest class — again mostly because it is small. The map reads as "Lahore is crowded and Chagai is empty," which happens to be true, but the colour is driven by area, not by the thing a reader is meant to compare (how densely people live). A choropleth must show a rate/density so that area is factored out; population counts belong on proportional symbols.



2. radiusFor takes a square root. What would the map suggest about Lahore against a district of 3
million if it did not?

Lahore has about 13 million people, roughly 4.3× a 3-million district. If radiusFor used population directly (r = pop / k), the radius ratio would be ~4.3, so the area ratio would be ~4.3² ≈ 18–19×. The eye compares circle area, so the map would suggest Lahore has roughly eighteen times the population of the 3-million district — a gross exaggeration. Taking the square root makes the radius ratio ≈ √4.3 ≈ 2.1, so the area ratio ≈ 4.3, matching the actual population ratio. The symbol's area then encodes the count faithfully.


3. Why does the layer control hold districtGroup rather than the L.geoJSON layer itself?
19
draw() rebuilds the district layer every time the province changes (districts = L.geoJSON(...) inside draw). If the control pointed at that L.geoJSON object, then after a province change the control would be holding a discarded layer — the old one has been removed from the map, and the new one is not registered with the control. Toggling the overlay would switch nothing (or switch a layer that is no longer on the map). districtGroup is a persistent L.featureGroup that stays on the map and registered with the control; draw() only swaps its contents (clearLayers() then addLayer(districts)). So the control always toggles whatever is currently inside the group.



4. Whatwouldgowrongifthecircles were drawn in overlayPane instead of the symbols pane? Describe
what the user would see when hovering.
Polygons and circle markers are both vector paths, so both would live in overlayPane (z-index 400) and be ordered purely by draw order. Hovering a district calls e.target.bringToFront(), which lifts that polygon above the circles. The user would see, on hover, the highlighted district's fill and thick outline covering the orange population circle for that district — the circle would disappear or be clipped behind the polygon, and neighbouring districts' polygons could similarly occlude circles. The symbols pane (z-index 450) puts the circles permanently above every polygon, so hovering a district can never hide a circle while still keeping circles below markers, tooltips and popups (markerPane 600).


5. Whycanmap.offremoveshowCoordinates, whenitcouldnotremoveananonymousfunctionpassed
to map.on?
map.off('click', handler) works by matching the function reference you passed to map.on. showCoordinates is a named function declared in the file — there is a variable holding that exact function object, so off receives the same reference and can find and remove it. An anonymous function written inline as map.on('click', function (e) { ... }) has no name and no variable holding it; the function object is created and discarded, so nothing you could pass to off would be the same reference. The listener would remain registered forever and could never be switched off.

6. On the NUST overlay, which circle would you use to show a 25 km evacuation zone, and which to
mark the campus on a national map? Why?
25 km evacuation zone → L.circle (the one with radius: 25000). L.circle takes its radius in metres, so it is a true ground distance: 25 km stays 25 km on the ground at every zoom level, shrinking and growing on screen with the map. Measured against the scale bar it will always read 25 km. That is what you need for a real-world zone.

Marking the campus on a national map → L.circleMarker (the 6-pixel one). L.circleMarker takes its radius in pixels, so it stays a small, constant-size dot at every zoom level — visible and legible at zoom 5 without covering the whole country, and not shrinking to invisibility when zoomed out. A metre-based circle would be a dot at national scale and a huge blob when zoomed in; a pixel-based marker would be invisible at national scale if it were a 25 km circle.

