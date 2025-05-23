import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// here we have written the res to _ it is a convention to write _ when we are not using the variable
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const  token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if(!token){
            throw new ApiError(401, "Uautorized request");
        }
    
        const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user =  await User.findById(decodedToken?._id).select(" -password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token");
            
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
})