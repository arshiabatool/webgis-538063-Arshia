# Answers to the Six Questions

**1. What can a Django and PostGIS page do instead of sending the whole file?**

A page backed by a database can send each visitor only the data they ask for, and it can answer questions on the server instead of making the browser download everything and work it out. Two examples from this lab:

- `/api/districts/?province=Sindh` makes PostGIS filter the rows, so the browser receives only the 29 Sindh districts instead of all 160.
- `/api/where/?lat=...&lng=...` sends one small JSON answer (district, province, population) for a clicked point, instead of the browser downloading every boundary and testing the point itself.

The data also lives in one place, so an edit made in the admin panel appears on the map at the next request, with no file to re-upload.

**2. Why is the database password read from an environment variable?**

`settings.py` is committed to GitHub, so a password written in it would be visible to anyone who can see the repository. It would also stay in the git history even if deleted later. With `os.environ.get("WEBGIS_DB_PASSWORD", "")`, the password exists only on my own machine, and the code can be shared safely. Each person or server can use a different password without changing the code.

**3. What does the GIST index do, and which query benefits?**

GIST (Generalized Search Tree) is a spatial index. It stores the bounding box of each geometry in a tree structure, so PostGIS can quickly rule out districts whose bounding box cannot contain the point, instead of examining all 160 geometries in full. The query that benefits is the `geom__contains=point` lookup in the `/api/where/` view, which becomes `ST_Contains` in SQL. The same applies to the `ST_Contains` query I ran by hand in pgAdmin. With 160 rows the gain is small, but with millions of rows the difference between an index and a full scan would be very large.

**4. What would happen without the MultiPolygon wrapping, and why?**

The `geom` column is defined as `geometry(MULTIPOLYGON,4326)`, so it accepts only multipolygons. The GeoJSON file contains 152 Polygon features and 8 MultiPolygon features. Without the wrapping step, the first plain Polygon would be rejected by PostGIS with a geometry type error, and the loading script would stop with an exception. Wrapping each Polygon in a MultiPolygon of one part fixes this without changing the shape on the map.

**5. Who should have an admin login, and who should not?**

Only trusted people who maintain the dataset, such as GIS staff or data managers, should have admin logins. Ideally each has an individual account with only the permissions they need, for example one who can change districts but not delete them. The general public, casual website visitors, and anyone who only needs to view the map should not have one. Anyone who can log in can change or delete every row, and a mistake or misuse would affect all users of the data. Visitors get the public map, which is read-only.

**6. Leaflet takes [lat, lng] and Point takes (lng, lat). Where in this lab is each order used, and
how does the extension’s URL avoid confusing them?

- **Leaflet uses [lat, lng]:** in `map.html`, `setView([30.3753, 69.3451], 5)`, `maxBounds: [[21.5, 58.5], [39.0, 80.5]]`, and `e.latlng.lat` / `e.latlng.lng` in the click handler.
- **GeoJSON and GEOS `Point` use (lng, lat):** in `views.py`, `Point(lng, lat, srid=4326)`, and in the GeoJSON that Django serves, where coordinates are written longitude first. The SQL `ST_MakePoint(72.9906, 33.6423)` also takes longitude first.

