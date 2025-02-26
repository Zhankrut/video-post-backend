import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, " Something went wrong while generation refresh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // here in this register user function we will send the data of user to the database to process the data

    // and then we will send the response
    // get user details from frontend
    // validate the user details - not empty , email is valid, password is strong
    // check if user already exits in the database -> we check the email or username if unique
    // check for images and avatar
    // upload image and the avatar to the cloudinary, check if the avatar is uploaded or not
    // create user object -> create a entry in the database (the mongodb is nosql database so we need to create a object of user and then send it to the database)
    // remover password and refresh token field fromt the responce 
    // check for user creation 
    // return the response to the frontend, if not created then send the error message

    // how to get user details from frontend.
    // console.log('req.body',req.body);
    const { fullName, email, username, password } = req.body;


    // we can do this but we will do better
    // if(fullName ===""){      // here we have to check for all the condition for all the fields
    //     throw new ApiError(
    //         400,
    //         "fullName is required"
    //      )
    // }


    if ([fullName, email, username, password].some((field) => (field.trim() === ""))) {
        throw new ApiError(400, "All fields are required ");
    }
    if (!email.includes("@") || !email.includes(".")) {
        throw new ApiError(400, "Email is not valid");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with same email or userName already exists");
    }
    // console.log('req.files',req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // console.log('avarar',avatar);
    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar");
    }


    // create user object
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })
    // console.log('created suerr',user);
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registring the user.");
    }

    const options = {
        httpOnly: true,
        secure: true,
    }


    return res
    .status(201)
    .json(
        new ApiResponse(200, createdUser, "user registered successfully")
    );
})

const loginUser = asyncHandler(async (req, res) => {
    // get data from frontend
    // check wheather the email and password is provided or not
    // check for the email and password is empty or not 
    // if the fields are empty or not provided then send the error message
    // check wheather the email aready exist or not if the email not found then send the error message and redirect to the register page
    // if the email found then check for the password is correct or not
    // if the password is not correct then send the error message
    // if the password is correct then send cookie to the frontend

    const { email, username, password } = req.body;
    console.log(req.body);
    console.log("user credentials", email, username, password);
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!user) {
        throw new ApiError(404, "user does not exists");
    }

    const isPasswordVailid = await user.isPasswordCorrect(password);

    if (!isPasswordVailid) {
        throw new ApiError(401, "Invailid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In successfully.")
        );

    // {
    //  the above code in json is shorthand for this 
    //     user: loggedInUser, 
    //     accessToken: accessToken, 
    //     refreshToken: refreshToken
    // }


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }


    try {

        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invailid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, newRefreshToken },
                    "accessToken refreshed ")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invailid refresh token");
    }
})

const changeCurrrentPassword = asyncHandler(async (req, res) => {
    // const {oldPassword, newPassword, confPassword} = req.Body;
    // if(!(newPassword===confPassword)){
    //     throw new ApiError(400, "the new password and confirm password is incorrect");;
    // }

    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "password changed successfully")
        );
})

const getCurrentUser = asyncHandler(async (req,res) => {
    const user = req.user||null ;
    if (user === null) {
        throw new ApiError(400, "no current user found ");
    }

    return res.
        status(200)
        .json(
            new ApiResponse(200, user, "current user fetched successfully")
        );

})

const updateAccountDetails = asyncHandler(async (req, res) => {
    // if we want to update any file for that user another controller and endpoint 
    // because if suer want to change the profile image then just change the profile only hit the endpoint and all will go smooth
    // we donot write the seprete endpoint then we have to save the whole information of user and that is not a good practice
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, " all fiels are required ");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { fullName, email: email } }, { new: true }).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    // TODO : delete the previous avatar file on cloudinary
    let preAvatar = req.user.avatar || null;
    if (preAvatar === null) {
        new ApiError(400, " cannot get the previous avatar ");
    }
    preAvatar = preAvatar.split("/").at(-1).split(".").at(0);


    const deleteAvatar = await deleteOnCloudinary(preAvatar,"image");
    if (deleteAvatar === null) {
        new ApiError(400, "error while deleting the avatar file. ");
    }

    if (!avatarLocalPath) {
        new ApiError(400, " avatar file is missing ");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User avatar image updated successfully.")
        );

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        new ApiError(400, " coverImage file is missing ");
    }
    // TODO: delete previous cover image
    let preCoverImage = req.user?.coverImage;
    if (preCoverImage === "") {
        console.log("user have no previous cover image")
    } else {
        preCoverImage = preCoverImage.split("/").at(-1).split(".").at(0);

        const deleteCoverImage = await deleteOnCloudinary(preCoverImage, "image");
        if (deleteCoverImage === null) {
            new ApiError(400, "error while deleting the coverImage file. ");
        }
    }



    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading coverImage");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { coverImage: coverImage.url } }, { new: true }).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User coverImage  updated successfully.")
        );

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }
    // here the channel will be array because the aggregate will return array
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            //pipeline to find the channel subscribers
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            //pipeline to find the channel subscribed
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "subscribers.subscriber"], },
                        then: true,
                        else: false
                    }
                },
                $project: {
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                }
            }
        }
    ]);

    console.log(channel);

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }

        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },

    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "Watch history fetch successfully.")
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

};