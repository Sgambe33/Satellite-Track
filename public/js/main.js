'use strict';


const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=${NORADID}&FORMAT=TLE";
const RAGGIO_TERRA = 6371;
const PI = Math.PI;

const TLE = `ISS (ZARYA)
1 25544U 98067A   22328.36313807  .00010194  00000+0  18509-3 0  9998
2 25544  51.6442 263.0928 0007089 108.6360  35.9223 15.50181965370029`;

var SudEst = L.latLng(-90, 180), NordOvest = L.latLng(90, -180), confini = L.latLngBounds(SudEst, NordOvest);

var OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, noWrap: true, attribution: '© OpenStreetMap' });

var MAPBOX = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2dhbWJlIiwiYSI6ImNsYWRvdzlqeTBseHozdmxkM21ndG9kbzkifQ.BsiPWaIBggyVoE98kvU5aQ", { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: '© MapBox' });

var map = L.map('map', { zoomSnap: 0.25, minZoom: 3, maxBounds: confini, maxBoundsViscosity: 1.0, layers: [OSM, MAPBOX] }).setView([0, 0], 1);
var layersMappa = { "OpenStreetMap": OSM, "MapBox": MAPBOX };

var controlloLayer = L.control.layers(layersMappa).addTo(map);
var barraLaterale = L.control.sidebar('sidebar').addTo(map);
var scalaMappa = L.control.scale().addTo(map);
var isUserLocalized = false;
var latlang = [];
var multiPolyLineOptions = { color: 'red' };
var multipolyline = L.polyline(latlang, multiPolyLineOptions);

var debounceTimeout

const LISTA_SATELLITI=document.getElementById(`lista-satelliti-table`)


function creaListaSatelliti(headers, values){

    LISTA_SATELLITI.innerHTML=``
    const thead=document.createElement(`thead`)
    thead.className=`relative` 
    const thead_tr=document.createElement(`tr`)
    thead_tr.className="border border-grey-500 md:border-none sticky top-0 left-0"
    headers.forEach(header=>{
        const th=document.createElement(`th`)
        th.textContent=header
        th.className=`bg-gray-600 p-2 text-white font-bold md:border md:border-grey-500 text-center`
        thead_tr.append(th)
    })
    thead.append(thead_tr)

    LISTA_SATELLITI.append(thead)

    const tbody=document.createElement(`tbody`)
    tbody.className=``
      
    values.forEach(xx=>{
        const tbody_tr=document.createElement(`tr`)
        tbody_tr.className=`bg-gray-300 border border-grey-500 md:border-none`
        const interesting = [xx[0], xx[2]]
        interesting.forEach(x=>{
            
            const td=document.createElement(`td`)
            td.textContent=x
            td.className=`p-2 md:border md:border-grey-500 text-center`
            tbody_tr.append(td)
        })
        const td=document.createElement(`td`)
        td.className=`p-2 md:border md:border-grey-500 text-center`
        const tdBtn =document.createElement(`button`)

        tdBtn.addEventListener("click", () => {
            console.log(xx[2])
            fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${xx[2]}&FORMAT=TLE`)
                .then((response) => response.text())
                .then(TLE => {
                    
                    const TLEparsed = TLE.split("\n")
                    console.log(TLEparsed)
                    setTimeout(() => drawLine(TLEparsed), 1000);
                })
        })

        tdBtn.textContent='Traccia'
        tdBtn.className=`bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 border border-blue-500 rounded`
        td.append(tdBtn)
        tbody_tr.append(td)
        tbody.append(tbody_tr)
    })  
   
    LISTA_SATELLITI.append(tbody)

}


function ricerca(nome, timeout = 3000) {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(()=>{
        console.log(nome)
        fetch("/api/data-fetch", {headers:{nome}})
            .then(res => res.json())
            .then(data => {
                if(data.length<1) return;
                const headers=Object.keys(data[0])
                const values=[]
                data.forEach(obj=>{
                    values.push(Object.values(obj))
                })
                console.log(values);
                creaListaSatelliti(['Nome', 'NORAD ID', 'Azione'],values)
            })
    }, timeout)
}

document.getElementById('satellite-search').addEventListener('input', (ev)=>{
    let nome = ev.target.value
    if(nome.trim() =="") return
    ricerca(nome)
})

function drawLine(TLEdata) {
    fetch('/api/getLatLon', {headers:{line1:TLEdata[1], line2:TLEdata[2]}})
        .then(res => res.json())
        .then(data => {

            const {lat, lng, height} = data;
            console.log(data)
            let ALPHA = Math.asin((Math.sqrt(Math.pow(RAGGIO_TERRA + height, 2) - Math.pow(RAGGIO_TERRA, 2)) / RAGGIO_TERRA)) * (180 / PI); //radiant to degrees conversion
            let horizonRadius = 2 * PI * RAGGIO_TERRA * (ALPHA / 360);

            latlang.push([lat, lng]);
            
            pulisciMappa();
            var multipolyline = L.polyline(latlang, multiPolyLineOptions);
            multipolyline.addTo(map);
            var circle = L.circle([lat, lng], { color: 'white', fillColor: 'white', fillOpacity: 0.25, radius: horizonRadius * 1000 }).addTo(map);
            var waypoint = L.marker([lat, lng]).addTo(map).bindPopup(`${lat}<br>${lng}`).openPopup();
        })
    }

function pulisciMappa() {
    let i;
    for (i in map._layers) {
        if (map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            }
            catch (e) {
                console.log("Problema con layer:" + e + map._layers[i]);
            }
        }
    }
}

var homeIcon = L.icon({
    iconUrl: "https://img.icons8.com/ios-filled/50/null/exterior.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

document.getElementById("gps-button").addEventListener("click", geoLocalizzaUtente);

function geoLocalizzaUtente() {
    if (!isUserLocalized) {
        map.locate({ setView: true, maxZoom: 5 });

        map.on("locationfound", (ev) => {
            isUserLocalized = true;
            var waypoint = L.marker(ev.latlng, { icon: homeIcon }).addTo(map);
            waypoint.bindPopup(`Sei qui giusto?`).openPopup();
        });
    } else {
        alert("Sei già stato localizzato!");
    }

}

function openNav() {
    document.getElementById("mySidenav").style.width = "300px";
}


function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
