import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const pageNum = parseInt(page, 1);
    const limitNum = parseInt(limit, 10);
    const options = {
        limit: pageNum,
        page: limitNum
    }

    if (!videoId || videoId.trim().length === 0) {
        throw new ApiError(400, " cannot get the video id ");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " video id is not a valid id ");
    }

    const allComments = await Comment.aggregatePaginate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },

    ], options);

    if (allComments.docs.length === 0) {
        throw new ApiError(400, "cannot get all comments");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, allComments.docs, "commments get successfully")
        );

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;
    const { userId } = req.user?._id;
    if (!content) {
        throw new ApiError(400, " not content provided ");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " the video id is not a vailid object id ");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " the user id is not a vailid object id ");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, " the comment added successfully ")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params;
    const { content } = req.body;
    if (!commentId) {
        throw new ApiError(400, "cannot get the comment id ");
    }
    if (!content) {
        throw new ApiError(400, "cannot get the content ");
    }

    const newComment = await Comment.findByIdAndUpdate(commentId, { $set: { content: content } }, { new: true });

    if (!newComment) {
        throw new ApiError(400, " cannot update the comment ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, newComment, " the comment updated successfully ")
        )


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "comment id cannot be found ");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(400, "the comment cannot be deleted ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "the comment has succefully deleted ")
        )

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}