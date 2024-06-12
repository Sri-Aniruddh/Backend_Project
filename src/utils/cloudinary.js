import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



const uploadCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath)return null

        //uploading file on cloudinary
        const response=await cloudinary.uploader.upload(localfilePath, {
            resource_type: 'auto'
        })
        //file uploaded succesfully
        console.log("file uploaded on cloudinary",response.url);
        // fs.unlinkSync(localfilePath)
        // return response;

    } catch (error) {
        //fs.unlinkSync(localfilePath) 
        return response   //remove the local temporary file when upload is failed

    }
}


export {uploadCloudinary}    


