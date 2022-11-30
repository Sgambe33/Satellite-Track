const express = require(`express`);
const {db} =require('../utils/db');

module.exports={
    base_route:`/satSearch`,
    handler:()=>{
        const route=express.Router({caseSensitive: false});

        route.get(``,(req,res)=>{
            const {nome} = req.headers
            let finalName=""

            if(!nome){
                res.status(400).json({
                    message: req.headers.nome,
                });
                return 
            }
            finalName=Array.isArray(nome) ? nome.join("") : nome

            const finalRows=db.prepare(`SELECT * FROM SATCAT WHERE OBJECT_NAME LIKE '%${finalName.toUpperCase()}%'`).all() ??[]
    
            res.status(200).json(finalRows);
        })
        return route;
    }
}