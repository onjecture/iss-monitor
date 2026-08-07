const tleURL =
"https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";


let satrec;


let map =
L.map("map",
{
    worldCopyJump:true
});


L.tileLayer(
"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
)
.addTo(map);


map.setView([0,0],2);



let issMarker =
L.circleMarker(
[0,0],
{
radius:6,
color:"#111",
fillColor:"#111",
fillOpacity:1
}
)
.addTo(map);



let orbitLine =
L.polyline(
[],
{
color:"#555",
weight:1
}
)
.addTo(map);



async function loadISS(){


const response =
await fetch(tleURL);


const text =
await response.text();


const lines =
text.trim().split("\n");


satrec =
satellite.twoline2satrec(
lines[1],
lines[2]
);


}



function updateISS(){


if(!satrec)
return;



const now =
new Date();



const position =
satellite.propagate(
satrec,
now
);



const gmst =
satellite.gstime(now);



const geo =
satellite.eciToGeodetic(
position.position,
gmst
);



const lat =
satellite.degreesLat(
geo.latitude
);



const lon =
satellite.degreesLong(
geo.longitude
);



const altitude =
geo.height;



const velocity =
Math.sqrt(

position.velocity.x ** 2 +

position.velocity.y ** 2 +

position.velocity.z ** 2

)
*3600;



issMarker
.setLatLng(
[lat,lon]
);



document
.getElementById("lat")
.textContent =
lat.toFixed(2)+"°";



document
.getElementById("lon")
.textContent =
lon.toFixed(2)+"°";



document
.getElementById("alt")
.textContent =
altitude.toFixed(1)+" km";



document
.getElementById("vel")
.textContent =
velocity.toFixed(0)+" km/h";



document
.getElementById("time")
.textContent =
new Date()
.toUTCString();


}



loadISS();


setInterval(
updateISS,
1000
);
