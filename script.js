const tleURL =
"https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";


let satrec;



const map = L.map("map", {
    worldCopyJump: true
});


L.tileLayer(
"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(map);


map.setView([0,0],2);



const issMarker = L.circleMarker(
[0,0],
{
    radius:6,
    color:"#111",
    fillColor:"#111",
    fillOpacity:1
}
).addTo(map);



const pastLine = L.polyline(
[],
{
    color:"#777",
    weight:1
}
).addTo(map);



const futureLine = L.polyline(
[],
{
    color:"#333",
    weight:1,
    dashArray:"6,6"
}
).addTo(map);



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


    updateTrack();

}



function getPosition(time){


    const position =
    satellite.propagate(
        satrec,
        time
    );


    const gmst =
    satellite.gstime(time);



    const geo =
    satellite.eciToGeodetic(
        position.position,
        gmst
    );



    const velocity =
    Math.sqrt(
        position.velocity.x ** 2 +
        position.velocity.y ** 2 +
        position.velocity.z ** 2
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


        velocity: velocity

    };

}



function updateISS(){


    if(!satrec)
    return;


    const point =
    getPosition(
        new Date()
    );



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



function updateTrack(){


    if(!satrec)
    return;



    let past = [];
    let future = [];

    const now =
    new Date();



    for(let i=90;i>=0;i--){


        const point =
        getPosition(
            new Date(
                now.getTime()-i*60000
            )
        );


        addPoint(
            past,
            point
        );

    }



    for(let i=0;i<=90;i++){


        const point =
        getPosition(
            new Date(
                now.getTime()+i*60000
            )
        );


        addPoint(
            future,
            point
        );

    }



    pastLine.setLatLngs(
        past
    );


    futureLine.setLatLngs(
        future
    );

}



function addPoint(line, point){


    let last =
    line[line.length-1];


    if(last){

        let difference =
        Math.abs(
            point.lon-last[1]
        );


        if(difference > 180){

            line.push([
                null,
                null
            ]);

        }

    }


    line.push([
        point.lat,
        point.lon
    ]);

}



loadISS();


setInterval(
updateISS,
1000
);


setInterval(
updateTrack,
60000
);
