const tleURL =
"https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";
let satrec;
const map = L.map("map", {
    worldCopyJump:true
});
L.tileLayer(
"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(map);
map.setView([0,0],2);

const issIcon = L.divIcon({
    className:"iss-marker",
    iconSize:[10,10],
    iconAnchor:[5,5]
});
const issMarker = L.marker(
[0,0],
{
    icon:issIcon,
    zIndexOffset:1000,
    interactive:false,
    keyboard:false
}
).addTo(map);

const pastLine = L.polyline(
[],
{
    color:"#777",
    weight:2
}
).addTo(map);
const futureLine = L.polyline(
[],
{
    color:"#444",
    weight:2,
    dashArray:"6,6"
}
).addTo(map);

function parseTLE(text){
    const rawLines =
    text.split(/\r?\n/);
    const lines =
    rawLines.map(function(line){
        return line.trim();
    }).filter(function(line){
        return line.length > 0;
    });
    let line1 = null;
    let line2 = null;
    for(let i=0;i<lines.length;i++){
        if(line1 === null && lines[i].indexOf("1 ") === 0){
            line1 = lines[i];
            continue;
        }
        if(line2 === null && lines[i].indexOf("2 ") === 0){
            line2 = lines[i];
            continue;
        }
    }
    if(!line1 || !line2){
        throw new Error("Could not find valid TLE lines in response");
    }
    return {
        line1:line1,
        line2:line2
    };
}

async function loadISS(){
    try{
        const response =
        await fetch(tleURL);
        if(!response.ok){
            throw new Error("TLE request failed with status "+response.status);
        }
        const text =
        await response.text();
        const tle =
        parseTLE(text);
        const newSatrec =
        satellite.twoline2satrec(
            tle.line1,
            tle.line2
        );
        if(!newSatrec || newSatrec.error){
            throw new Error("satellite.js failed to parse TLE");
        }
        satrec = newSatrec;
        updateTrack();
    }catch(error){
        console.error("Failed to load/parse TLE, keeping last known data:",error);
    }
}

function getPosition(time){
    if(!satrec){
        return null;
    }
    const result =
    satellite.propagate(
        satrec,
        time
    );
    if(!result || !result.position || !result.velocity){
        return null;
    }
    const gmst =
    satellite.gstime(time);
    const geo =
    satellite.eciToGeodetic(
        result.position,
        gmst
    );
    if(!geo || isNaN(geo.latitude) || isNaN(geo.longitude)){
        return null;
    }
    const velocity =
    Math.sqrt(
        result.velocity.x ** 2 +
        result.velocity.y ** 2 +
        result.velocity.z ** 2
    ) * 3600;
    return {
        lat:
        satellite.degreesLat(
            geo.latitude
        ),
        lon:
        satellite.degreesLong(
            geo.longitude
        ),
        altitude:
        geo.height,
        velocity:velocity
    };
}

function updateISS(){
    if(!satrec)
    return;
    const point =
    getPosition(
        new Date()
    );
    if(!point)
    return;
    issMarker.setLatLng(
        [
            point.lat,
            point.lon
        ]
    );
    document.getElementById("lat").textContent =
    point.lat.toFixed(2)+"°";
    document.getElementById("lon").textContent =
    point.lon.toFixed(2)+"°";
    document.getElementById("alt").textContent =
    point.altitude.toFixed(1)+" km";
    document.getElementById("vel").textContent =
    point.velocity.toFixed(0)+" km/h";
    document.getElementById("time").textContent =
    new Date().toUTCString();
}

function buildTrackSegments(steps,now){
    let segments = [];
    let current = [];
    for(let i=0;i<steps.length;i++){
        const point =
        getPosition(
            new Date(
                now.getTime()+steps[i]*60000
            )
        );
        if(!point){
            continue;
        }
        if(current.length > 0){
            const previous =
            current[current.length-1];
            const difference =
            Math.abs(
                point.lon - previous[1]
            );
            if(difference > 180){
                segments.push(current);
                current = [];
            }
        }
        current.push([
            point.lat,
            point.lon
        ]);
    }
    if(current.length > 0){
        segments.push(current);
    }
    return segments;
}

function updateTrack(){
    if(!satrec)
    return;
    const now =
    new Date();

    let pastSteps = [];
    for(let i=-90;i<=0;i++){
        pastSteps.push(i);
    }
    let futureSteps = [];
    for(let i=0;i<=90;i++){
        futureSteps.push(i);
    }

    const pastSegments =
    buildTrackSegments(
        pastSteps,
        now
    );
    const futureSegments =
    buildTrackSegments(
        futureSteps,
        now
    );

    pastLine.setLatLngs(
        pastSegments
    );
    futureLine.setLatLngs(
        futureSegments
    );
}

loadISS();
setInterval(
updateISS,
200
);
setInterval(
updateTrack,
30000
);
setInterval(
loadISS,
1800000
);
