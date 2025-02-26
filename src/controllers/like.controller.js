import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    const userId = req.user?._id;

    if (!videoId) {
        throw new ApiError(400, " cannot get the video id ");
    }

    if (!userId) {
        throw new ApiError(400, " cannot get the user id ");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " not a valid video id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " not a vailid userId ");
    }

    const isLiked = await Like.findOne({ video: videoId, likedBy: userId });

    if (isLiked) {
        const deleteLike = await Like.findOneAndDelete({ video: videoId, likedBy: userId });
        if (!deleteLike) {
            throw new ApiError(400, " cannot unlike the video ");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, deleteLike, " the user has successfully unliked the video ")
            );
    } else {
        const newLike = new Like({
            video: videoId,
            likedBy: userId,
        });
        const like = await newLike.save();

        if (like) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, newLike, "the user has sucessfully liked the video")
                )
        } else {
            new ApiError(400, "cannot like the video ");
        }


    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400, " cannot get the comment id ");
    }

    if (!userId) {
        throw new ApiError(400, " cannot get the user id ");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, " not a valid comment id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " not a vailid userId ");
    }

    const isLiked = await Like.findOne({ comment: commentId, likedBy: userId });

    if (isLiked) {
        const deleteComment = await Like.findOneAndDelete({ comment: commentId, likedBy: userId });
        if (!deleteComment) {
            throw new ApiError(400, " cannot unlike the comment ");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, deleteComment, " the user has successfully unliked the comment ")
            );
    } else {
        const newLike = new Like({
            comment: commentId,
            likedBy: userId,
        });
        const like = await newLike.save();

        if (like) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, newLike, "the user has sucessfully liked the comment")
                )
        } else {
            new ApiError(400, "cannot like the comment ");
        }


    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    const userId = req.user?._id;

    if (!tweetId) {
        throw new ApiError(400, " cannot get the tweet id ");
    }

    if (!userId) {
        throw new ApiError(400, " cannot get the user id ");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, " not a valid tweet id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " not a vailid userId ");
    }

    const isLiked = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (isLiked) {
        const deleteTweet = await Like.findOneAndDelete({ tweet: tweetId, likedBy: userId });
        if (!deleteTweet) {
            throw new ApiError(400, " cannot unlike the tweet ");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, deleteTweet, " the user has successfully unliked the tweet ")
            );
    } else {
        const newLike = new Like({
            tweet: tweetId,
            likedBy: userId,
        });
        const like = await newLike.save();

        if (like) {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, newLike, "the user has sucessfully liked the tweet")
                )
        } else {
            new ApiError(400, "cannot like the tweet ");
        }

    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "cannot get the userId");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " the userId is not a vailid userId");
    }

    const like = await Like.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: videos,
                localField: video,
                foreignField: _id,
                as: "likeVideos"
            }

        },
        {
            $unwind: {
                path: "$likeVideos",

                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project:{
                _id: 1,
                likedBy:1,
                video: "$likeVideos"
            }
        }

    ]);

    if (like.length===0) {
        throw new ApiError(400, "cannot get the data");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, like, "successfully get the liked video data")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}