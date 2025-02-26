// require('dotenv').config({path: ".env"}) this is fine but breakes the consistancy of our program

import dotenv from "dotenv";
import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";
import express from "express";
import connectDB from "./db/index.js";
import {app} from "./app.js";


dotenv.config({
    path:'./.env'
})

/*
const app= express();


{
function connectDB (){}
connectDB()

this one fine but we can use ifee insted of this 
}

(async () => {
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("error",error);
            throw error
        });
        app.listen(process.env.PORT, () => {
            console.log( `app is listeninng on port ${PORT}`);
        })
    }catch(error){
        console.error("ERROR", error);
    }
})();
*/

// when a async fucntion complete it returns promise
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running at port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("mongodb connection failed !!!",err);
})