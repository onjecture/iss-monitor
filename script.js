const tleURL =
"https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

let satrec;


const map = L.map("map", {
    worldCopyJump: true
});


L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(map);


map.setView([0, 0], 2);


const issMarker = L.circleMarker(
    [0, 0],
    {
        radius: 6,
        color: "#111",
        fillColor: "#111",
        fillOpacity: 1
    }
).addTo(map);


const pastLine = L.polyline(
    [],
    {
        color: "#888",
        weight: 1
    }
).addTo(map);


const futureLine = L.polyline(
    [],
    {
        color: "#444",
        weight: 1,
        dashArray: "5,5"
    }
).addTo(map);



async function loadISS() {

    const response = await fetch(tleURL);

    const text = await response.text();

    const lines = text.trim().split("\n");

    satrec = satellite.twoline2satrec(
        lines[1],
        lines[2]
    );
}



function calculatePosition(time) {

    const position = satellite.propagate(
        satrec,
        time
    );

    const gmst = satellite.gstime(time);

    const geo = satellite.eciToGeodetic(
        position.position,
        gmst
    );


    return {
        lat: satellite.degreesLat(geo.latitude),
        lon: satellite.degreesLong(geo.longitude),
        altitude: geo.height
    };
}



function updateISS() {

    if (!satrec) return;


    const point = calculatePosition(new Date());


    issMarker.setLatLng([
        point.lat,
        point.lon
    ]);


    document.getElementById("lat").textContent =
        point.lat.toFixed(2) + "°";


    document.getElementById("lon").textContent =
        point.lon.toFixed(2) + "°";


    document.getElementById("alt").textContent =
        point.altitude.toFixed(1) + " km";

}



function updateTrack() {

    if (!satrec) return;


    const past = [];
    const future = [];

    const now = new Date();


    for (let i = 90; i >= 0; i--) {

        const point = calculatePosition(
            new Date(now.getTime() - i * 60000)
        );

        past.push([
            point.lat,
            point.lon
        ]);
    }



    for (let i = 0; i <= 90; i++) {

        const point = calculatePosition(
            new Date(now.getTime() + i * 60000)
        );

        future.push([
            point.lat,
            point.lon
        ]);
    }


    pastLine.setLatLngs(past);

    futureLine.setLatLngs(future);
}



loadISS();


setInterval(updateISS, 1000);

setInterval(updateTrack, 60000);
