//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import app from './app.js'
import connectDB from "./db/index.js"


dotenv.config({
    path: './.env'
})

//making to establised the databse connection start

connectDB()
.then(() => {
    try {
        app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
    } 
    catch (error) {
        console.log("Server is not running")
    }
})
.catch((err) => { console.log("Mongo db connection failed!!!!!", err) })
//making to establised the databse connection end





/*   import express from "express"
const app=express()
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGOBD_URL}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("Error",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.log("Error:",error)
        throw err
    }
})()      */