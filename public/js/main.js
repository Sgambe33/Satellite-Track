'use strict';
//COSTANTI
const homeIcon = L.icon({
    iconUrl: "https://img.icons8.com/ios-filled/50/null/exterior.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const satelliteIcon = L.icon({
    iconUrl: "https://img.icons8.com/sf-black-filled/64/null/satellite-sending-signal.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=${NORADID}&FORMAT=TLE";
const RAGGIO_TERRA = 6371;
const PI = Math.PI;
const SudEst = L.latLng(-90, 180), NordOvest = L.latLng(90, -180), confini = L.latLngBounds(SudEst, NordOvest);

const LISTA_SATELLITI=document.getElementById(`lista-satelliti-table`)
//LAYER MAPPA
var OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, noWrap: true, attribution: '© OpenStreetMap' });

var MAPBOX = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2dhbWJlIiwiYSI6ImNsYWRvdzlqeTBseHozdmxkM21ndG9kbzkifQ.BsiPWaIBggyVoE98kvU5aQ", { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: '© MapBox' });

var layersMappa = { "OpenStreetMap": OSM, "MapBox": MAPBOX };

var map = L.map('map', { zoomSnap: 0.25, minZoom: 3, maxBounds: confini, maxBoundsViscosity: 1.0, layers: [OSM, MAPBOX] }).setView([0, 0], 1);

//CONTROLLI E WIDGET MAPPA
var diagOptions = {size: [ 300, 300 ],minSize: [ 100, 100 ],maxSize: [ 350, 350 ],anchor: [ 250, 250 ],position: "topleft",initOpen: false}
var dialog = L.control.dialog(diagOptions).addTo(map)

var controlloLayer = L.control.layers(layersMappa).addTo(map);
var barraLaterale = L.control.sidebar('sidebar').addTo(map);
var scalaMappa = L.control.scale().addTo(map);
var legend = L.control({ position: "bottomright" });

legend.onAdd = function(map) {
  var div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>Legenda</h4>";
  div.innerHTML += '<i class="bg-green-700"></i><span>Orbita precedente</span><br>';
  div.innerHTML += '<i class="bg-red-700"></i><span>Orbita attuale</span><br>';
  div.innerHTML += '<i class="bg-blue-700"></i><span>Orbita successiva</span><br>';
  div.innerHTML += '<i class="icon" style="background-image: url(https://img.icons8.com/sf-black-filled/64/null/satellite-sending-signal.png);background-repeat: no-repeat;"></i><span>Satellite</span><br>';
  return div;
};
legend.addTo(map);

//VARIABILI 
var isUserLocalized = false;
var debounceTimeout
var drawInterval
var waypoint

//EVENT LISTENERs
document.getElementById('satellite-search').addEventListener('input', (ev)=>{
    let nome = ev.target.value
    if(nome.trim() =="") return
    ricerca(nome)
})
document.getElementById("gps-button").addEventListener("click", geoLocalizzaUtente);

//FUNZIONI
function openNav() {
    document.getElementById("mySidenav").style.width = "300px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
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

function geoLocalizzaUtente() {
    if (!isUserLocalized) {
        map.locate({ setView: true, maxZoom: 5 });

        map.on("locationfound", (ev) => {
            isUserLocalized = true;
            let waypoint_gps = L.marker(ev.latlng, { icon: homeIcon }).addTo(map);
            waypoint_gps.bindPopup(`Sei qui giusto?`).openPopup();
        });
    } else {
        alert("Sei già stato localizzato!");
    }

}

function ricerca(nome, timeout = 3000) {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(()=>{
        console.log(nome)
        fetch("/api/satSearch", {headers:{nome}})
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

function drawOrbits(TLEdata) {
    fetch('/api/getLatLon', {headers:{line1:TLEdata[1], line2:TLEdata[2]}})
        .then(res => res.json())
        .then(data => {            
            const {lat, lng, height, velocity, orbits} = data;
            
            let ALPHA = Math.asin((Math.sqrt(Math.pow(RAGGIO_TERRA + height, 2) - Math.pow(RAGGIO_TERRA, 2)) / RAGGIO_TERRA)) * (180 / PI);
            let horizonRadius = 2 * PI * RAGGIO_TERRA * (ALPHA / 360);

            pulisciMappa()

            var multipolyline = L.polyline(orbits[0], { color: 'blue' });
            multipolyline.addTo(map); //Orbita successiva

            multipolyline = L.polyline(orbits[1], { color: 'red' });
            multipolyline.addTo(map);//Orbita attuale

            multipolyline = L.polyline(orbits[2], { color: 'green' });
            multipolyline.addTo(map);//Orbita precedente

            dialog.setContent(`<p>Latitudine: ${lat.toFixed(4)}</p> <br> <p>Longitudine: ${lng.toFixed(4)}</p> <br> <p>Altitudine: ${height.toFixed(2)} Km</p> <br> <p>Velocità: ${velocity.toFixed(1)} Km/s</p>`)
            var circle = L.circle([lat, lng], { color: 'white', fillColor: 'white', fillOpacity: 0.25, radius: horizonRadius * 1000 }).addTo(map); //Raggio visibilità
            waypoint = L.marker([lat, lng], { icon: satelliteIcon} ).addTo(map)
            waypoint.addEventListener("click", () => dialog.open())
            map.addLayer(waypoint)   
        })
        map.removeLayer(waypoint)
    }

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
      
    values.forEach(satInfo=>{
        const tbody_tr=document.createElement(`tr`)
        tbody_tr.className=`bg-gray-300 border border-grey-500 md:border-none`
        const interesting = [satInfo[0], satInfo[2]]
        interesting.forEach(c=>{
            
            const td=document.createElement(`td`)
            td.textContent=c
            td.className=`p-2 md:border md:border-grey-500 text-center`
            tbody_tr.append(td)
        })
        const td=document.createElement(`td`)
        td.className=`p-2 md:border md:border-grey-500 text-center`
        const tdBtn =document.createElement(`button`)

        tdBtn.addEventListener("click", () => {
            console.log(satInfo[2])
            fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${xx[2]}&FORMAT=TLE`)
                .then((response) => response.text())
                .then(TLE => {
                    
                    const TLEparsed = TLE.split("\n")
                    console.log(TLEparsed)
                    clearInterval(drawInterval)
                    drawInterval = setInterval(() => drawOrbits(TLEparsed), 5000);
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