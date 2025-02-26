import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file to the cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        //file has been uploaded successfully
        // console.log('cloudinary response',response);
        //console.log("File uploaded successfully ", response.url);
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file
        return response;
    } catch (error) {
        console.log("Error while uploading file to cloudinary ", error);
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

const deleteOnCloudinary = async (public_id,resource_type) => {
    try {
        const response = await cloudinary.uploader.destroy(public_id, { resource_type: resource_type });
        return response;
    } catch (err) {
        console.log("Error while deleting file on cloudinary", err);
        return null;
    }
}


export { uploadOnCloudinary, deleteOnCloudinary };