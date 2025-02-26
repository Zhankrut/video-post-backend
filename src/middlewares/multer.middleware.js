// jate jate muzse milte jana 
import multer from 'multer';
// the multer middleware is used to upload files to the server
// it first take file from the frontend and then save it to the public/temp folder temporarily then it will again delete it
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "./public/temp");   // we are saving the file in the temp folder
    },
    filename: function (req, file, cb) { 
        cb(null, file.originalname);  // writing the file name as it is, is not recommended, but for the sake of simplicity, we are doing it here
        // the file will be saved in the temp folder for too short amount of time and then it will be deleted
    }
});

export const upload = multer({ storage });  // this is a middleware that will be used to upload the files to the server