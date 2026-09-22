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

In Part 2, my webpage was a simple HTML page containing only basic text and HTML elements, so the browser had very few resources to load. In Part 4, I added the Leaflet CSS and JavaScript libraries and OpenStreetMap as the base map. The browser then had to make additional network requests to download the Leaflet files and the many map tile images required to display the interactive map.
### 2. What is the difference between what HTML does and what CSS does? Give one example of each from your own file.
HTML and CSS have different roles in a webpage. HTML (HyperText Markup Language) is used to define the structure and content of the webpage, such as headings, paragraphs, and containers. CSS (Cascading Style Sheets) is used to control the appearance and layout of those HTML elements, such as their color, size, spacing, and position.
For example, in my file, <h1>Islamabad</h1> is HTML because it creates the main heading of the webpage. The h1 CSS rule in my code controls the appearance of this heading by setting its margin and color. Similarly, the #map CSS rule controls the size of the container where my Leaflet map is displayed.


### 3. Why does the `#map` rule need a height, when the `h1` rule does not?

The #map rule needs a height because the Leaflet map is displayed inside the <div id="map"></div> container, and the map needs a defined visible area. In my code, I set the height to 480px, which gives Leaflet enough vertical space to display the map and its tiles.

### 4. You opened your page through Live Server at `127.0.0.1` instead of double-clicking the file. Give one reason this matters.

Opening the page through Live Server is important because it runs the webpage through a local web server using HTTP instead of opening it directly from the computer's file system. When a file is opened by double-clicking it, the browser uses a file:/// address, and some web requests and data-loading operations can be blocked by browser security rules.
Live Server gives my webpage an address such as http://127.0.0.1:5500/index.html, so it behaves more like a real website running on a web server. This is especially important for Web GIS because later applications may need to load external libraries, map tiles, GeoJSON files, APIs, or other data resources.


---

### 5. A classmate's marker appears in the sea near Africa instead of in Islamabad. What is almost certainly wrong, and how would you fix it?

The latitude and longitude coordinates used for the marker are almost certainly incorrect, or they may have been entered in the wrong order. Leaflet expects coordinates in the order [latitude, longitude], not [longitude, latitude]. If the values are incorrect or reversed, the marker can appear in a completely different location, such as in the sea near Africa.