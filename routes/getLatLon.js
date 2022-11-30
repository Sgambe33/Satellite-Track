const express = require(`express`);
const { getGroundTracksSync, getSatelliteInfo } = require("tle.js");

module.exports = {
    base_route:`/getLatLon`,
    handler:()=>{
        const route=express.Router({caseSensitive: false});

        route.get(``,(req,res)=>{
            console.log(req.headers)
            const {line1, line2} = req.headers
            
            let finalTLE=""

            if(!line1 || !line2){
                res.status(400).json({
                    message: "TLE invalido!",
                });
                return 
            }

            finalTLE = line1 + "\n" + line2
            console.log(finalTLE)
            const {lat, lng, velocity, height, range} = getSatelliteInfo(finalTLE, new Date())

            console.log(lat, lng, velocity, height, range)
            
            const threeOrbitsArr = getGroundTracksSync({
                tle: finalTLE,
                startTimeMS: new Date(),
                stepMS: 5000,
                isLngLatFormat: false,
            });
            const out = {lat,lng,velocity,height,threeOrbitsArr}
            
            res.status(200).json(out);
            
        })
        return route
    }
}