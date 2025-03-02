import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import { getCurrentUser } from "./user.controller.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    // have to write the aggregation pipline to get the data
    if (!isValidObjectId(userId)) {

        throw new ApiError(400, " the user id is not a vailid object id ");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if(!query||query.trim().length === 0){
        throw new ApiError(400, " cannot get the query");
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new ApiError(400, "Invalid page or limit value.");
    }
    

    const pipeline = [
        {
            $search: {
                text: {
                    path: ["title", "description"],
                    query: query,
                    matchCriteria: "any",
                    fuzzy: {
                        maxEdits: 2
                    }
                },
                sort: { [sortBy]: parseInt(sortType) },  // Sort based on query parameters
            }
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                score: { "$meta": "searchScore" }
            }
        }
    ];

    const options = {
        page: pageNum,
        limit: limitNum,
    };




    const videoSearch = await Video.aggregatePaginate(pipeline,options);

    if (videoSearch.docs.length === 0) {
        throw new ApiError(400, "cannot get the results");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, videoSearch.docs, "the videos found ")
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    if (!(title && description)) {
        new ApiError(400, "description or title missing.")
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "the thumbnail path cannot be found.");
    }

    if (!videoFileLocalPath) {
        throw new ApiError(400, "the videofile path cannot be found.");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Failed to upload video file on cloudinary");
    }

    if (!thumbnailFile) {
        throw new ApiError(400, "Failed to upload thumbnail file on cloudinary");
    }

    // console.log(videoFile, thumbnailFile);
    const videoDuration = `${videoFile.duration}`;

    const user = req.user||null ;
    const owner = user._id;

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        title: title,
        description: description,
        duration: videoDuration,
        owner: owner

    })

    const videoDetails = await Video.findById(video._id).select(" -owner");

    return res
        .status(201)
        .json(
            new ApiResponse(200, videoDetails, "video has been uploaded successfully")
        );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {

        throw new ApiError(" the videoId is not valid object id ");
    }
    const videoDetails = await Video.findById(videoId);


    if (!videoDetails) {
        throw new ApiError(400, " the video cannot be found");
    }

    return res.status(200).json(
        new ApiResponse(200, videoDetails, "video found.")
    );


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " the video id is not a vailid id ");
    }

    const { title, description } = req.body;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, " the thumbnail file path cannot be found ");
    }

    const videoFile = await Video.findById(videoId);

    if (!videoFile) {
        throw new ApiError(400, " the video file cannot be found by provided id ");
    }

    let prevThumbnail = videoFile.thumbnail;

    if (!prevThumbnail) {
        throw new ApiError(400, " the video file does not contain thumbnail url");
    }

    prevThumbnail = prevThumbnail.split("/").at(-1).split(".").at(0);

    const deleteThumbnail = await deleteOnCloudinary(prevThumbnail, { resource_type: image });

    if (deleteThumbnail === null) {
        new ApiError(400, "error while deleting the thumbnail for video file. ");
    }
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailFile) {
        throw new ApiError(400, " the new thumbnail file cannot be uploaded on cloudinary.");
    }

    const object = {};
    object.thumbnail = thumbnailFile.url;
    if (title) {
        object.title = title;
    }
    if (description) {
        object.description = description;
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $set: object }, { new: true }).select("-owner");

    if (!updateVideo) {
        throw new ApiError(400, " the video file cannot be updated ");
    }

    return res.
        status(200)
        .json(
            new ApiResponse(200, updatedVideo, " the video has been successfully uploaded ")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "the video id is not a valid id ");

    }

    const preVideo = await Video.findById(videoId);
    if(!preVideo){
        throw new ApiError(400, "no video file found with this id");
    }
    const preVideoUrl = preVideo.videoFile||null;
    const preVideoId = preVideoUrl.split("/").at(-1).split(".").at(0);
    const prethumbnailUrl = preVideo.thumbnail||null;
    const prethumbnailId = prethumbnailUrl.split("/").at(-1).split(".").at(0);

    const deletePreVideo = await deleteOnCloudinary(preVideoId,"video");
    if (deletePreVideo === null) {
        new ApiError(400, "error while deleting the video file. ");
    }

    const deletePreThumbnail = await deleteOnCloudinary(prethumbnailId,"image");
    if (deletePreThumbnail === null) {
        new ApiError(400, "error while deleting the thumbnail file. ");
    }


    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(400, " the video cannot be deleted ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, " the video file has been deleted successfully ")
        )


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " the video id is not a valid id ");

    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "the id provided is not a vailid id ");
    }

    const isPublished = video.isPublished;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $set: { isPublished: !isPublished } }, { new: true }).select("-owner");

    if (!updatedVideo) {
        throw new ApiError(400, "the status cannot be updated ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateVideo, " the status has been successfully updated ")
        )


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}