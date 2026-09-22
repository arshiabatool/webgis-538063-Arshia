##LAB 01 Report

Lab 1 report\Checkpoin 1(a).png
Lab 1 report\Checkpoint 1 (b).png
Lab 1 report\Checkpoint 2.png
Lab 1 report\Checkpoint 3.png
Lab 1 report\Checkpoint 4.png
Lab 1 report\Checkpoint 5.png


## URL- https://arshiabatool.github.io/webgis-538063-Arshia/

## Questions

### 1. In Part 2 your page made one network request. After Part 4 it made dozens. Explain in two or three sentences what changed and why.

In Part 2, my webpage was a simple HTML page, so it only needed to load the basic page. In Part 4, I added the Leaflet CSS and JavaScript libraries and OpenStreetMap tiles. Because of these additional resources and map tiles, the browser had to make many more network requests to display the interactive map.
---

### 2. What is the difference between what HTML does and what CSS does? Give one example of each from your own file.
HTML is used to create the structure and content of the webpage, while CSS is used to control how the webpage looks. In my file, <h1>Islamabad</h1> is an example of HTML because it creates the main heading. The h1 CSS rule is an example of CSS because it changes the heading's color and spacing.
---

### 3. Why does the `#map` rule need a height, when the `h1` rule does not?

The #map needs a height because Leaflet needs a defined space in which to display the map. If I do not give the map container a height, the map may not be visible. The h1 does not need a fixed height because its height is automatically determined by the text and the browser's default styling.
---

### 4. You opened your page through Live Server at `127.0.0.1` instead of double-clicking the file. Give one reason this matters.

Live Server runs my webpage through a local web server instead of opening it directly as a file. This matters because web applications such as Web GIS may need to load external resources and data through HTTP, and browsers can block some requests when a page is opened using file:///.

---

### 5. A classmate's marker appears in the sea near Africa instead of in Islamabad. What is almost certainly wrong, and how would you fix it?

The latitude and longitude coordinates are most likely wrong or entered in the wrong order. In Leaflet, the coordinates should be written as [latitude, longitude]. I would check the coordinates and replace them with the correct ones, such as [33.6423, 72.9906] for my NUST H-12 marker.