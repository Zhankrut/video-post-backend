import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, " the user id cannot be found");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " the user id is not a valid user id");
    }

    const userProfile = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "channelSubscribers"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video", 
                as: "videoLikes"
            }
        },
        {
            $addFields: {
                totalSubscribers: { $size: "$channelSubscribers" },
                totalLikes: { $size: "$videoLikes" }
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: { $first: "$totalSubscribers" },
                totalLikes: { $first: "$totalLikes" },
                totalVideos: { $sum: 1 } 
            }
        }


    ]);

    if (userProfile.length === 0) {
        throw new ApiError(400, "the profile cannot be found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userProfile, " the user profile successfully found ")
        )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, " cannot get the user id ");
    }

    const userVideo = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
    ]);

    if (!userVideo || userVideo.length === 0) {
        throw new ApiError(400, " cannot get the channel videos ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userVideo, "all the video of user channel ")
        )
})

export {
    getChannelStats,
    getChannelVideos
}