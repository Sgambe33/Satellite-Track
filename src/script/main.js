'use strict';
import { getLatLngObj } from "tle.js";
import 'material-icons/iconfont/material-icons.css';
import 'leaflet-easybutton'

const url = "https://tle.ivanstanojevic.me/api/tle/36508"
const RAGGIO_TERRA = 6371;
const PI = Math.PI;

const tle = `ISS (ZARYA)
1 25544U 98067A   22328.36313807  .00010194  00000+0  18509-3 0  9998
2 25544  51.6442 263.0928 0007089 108.6360  35.9223 15.50181965370029`;

var SudEst = L.latLng(-90,180), NordOvest = L.latLng(90,-180), confini = L.latLngBounds(SudEst,NordOvest);

var OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, noWrap: true, attribution: '© OpenStreetMap'});
var MAPBOX = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2dhbWJlIiwiYSI6ImNsYWRvdzlqeTBseHozdmxkM21ndG9kbzkifQ.BsiPWaIBggyVoE98kvU5aQ", {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: '© MapBox'});

var map = L.map('map', {zoomSnap: 0.25, minZoom: 3, maxBounds: confini, maxBoundsViscosity: 1.0, layers: [OSM, MAPBOX]}).setView([0, 0], 1);
var layersMappa = {"OpenStreetMap": OSM,"MapBox": MAPBOX};

var controlloLayer = L.control.layers(layersMappa).addTo(map);
var barraLaterale = L.control.sidebar('sidebar').addTo(map);
var scalaMappa = L.control.scale().addTo(map);
var isUserLocalized = false;
var latlang = [];     
var multiPolyLineOptions = {color:'red'};
var multipolyline = L.polyline(latlang , multiPolyLineOptions);

function counter() {
    setInterval(() => {
      let latLonObj = getLatLngObj(tle);
      
    }, 2000);
  }
  
//counter();

//setInterval(drawLine, 5000)
function drawLine(){
   

    fetch(url).then((response)=>{
        return response.json();
    }).then(data=>{

        const {line1, line2} = data;

        console.log(line1, line2)
        let ALPHA = Math.asin((Math.sqrt(Math.pow(EARTH_RADIUS+altitude, 2)-Math.pow(EARTH_RADIUS, 2))/EARTH_RADIUS))*(180/PI); //radiant to degrees conversion
        
        let horizonRadius = 2*PI * EARTH_RADIUS * (ALPHA/360);

        latlang.push([latitude, longitude])

        pulisciMappa()
        var multipolyline = L.polyline(latlang , multiPolyLineOptions);
        multipolyline.addTo(map);
        var circle = L.circle([latitude, longitude], {color: 'white', fillColor: 'white', fillOpacity: 0.25, radius: horizonRadius * 1000}).addTo(map);
        var waypoint = L.marker([latitude, longitude]).addTo(map).bindPopup(`${latitude}<br>${longitude}`).openPopup()
    })
    
}
function pulisciMappa() {
    let i;
    for(i in map._layers) {
        if(map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            }
            catch(e) {
                console.log("Problema con layer:" + e + map._layers[i]);
            }
        }
    }
}
let iconaBrutta = "https://img.icons8.com/ios-filled/50/null/exterior.png"
var greenIcon = L.icon({
    iconUrl: iconaBrutta,   
    iconSize:     [24, 24], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -12] // point from which the popup should open relative to the iconAnchor
});

document.getElementById("gps-button").addEventListener("click", geoLocalizzaUtente)
function geoLocalizzaUtente(){
    if(!isUserLocalized){
        map.locate({setView: true, maxZoom: 5});
        map.on("locationfound", (ev) =>{
            isUserLocalized = true;
            var waypoint = L.marker(ev.latlng, {icon: greenIcon}).addTo(map);
            waypoint.bindPopup(`Sei qui giusto?`).openPopup()
        })
    }else{
        alert("Sei già stato localizzato!")
    }
    
}



function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
  }
  

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}
