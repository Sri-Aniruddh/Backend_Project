import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

//databse connection start
const connectDB = async()=>{
    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URL}/${process.env.DB_NAME}`)
        console.log(connectionInstance)
        console.log(`\n MongoDb connected !! DB host: ${connectionInstance.Connection.host}`)

    } catch (error) {

        console.log("MONGODB connection error",error);
        process.exit(1)

    }
}
//databse connection completed

export default connectDB