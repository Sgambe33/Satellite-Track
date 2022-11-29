const express = require(`express`);
const { getSatelliteInfo } = require("tle.js");

module.exports = {
    base_route:`/getLatLon`,
    handler:()=>{
        const route=express.Router({caseSensitive: false});

        route.get(``,(req,res)=>{
            console.log(req.headers)
            const {line1, line2} = req.headers
            
            let finalTLE=""

            //if(!tledata){
            //    res.status(400).json({
            //        message: req.headers.tledata,
            //    });
            //    return 
            //}
            //finalTLE=Array.isArray(tledata) ? tledata.join("") : tledata

            finalTLE = line1 + "\n" + line2
            console.log(finalTLE)
            const {lat, lng, velocity, height, range} = getSatelliteInfo(finalTLE, new Date())

            console.log(lat, lng, velocity, height, range)
            const out = {
                "lat":lat,
                "lng":lng,
                "velocity":velocity,
                "height":height,
                "range":range
            }
            res.status(200).json(out);
            
        })
        return route
    }
}