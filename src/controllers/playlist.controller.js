import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    //TODO: create playlist
    const userId = req.user?._id;


    if (name.trim().length === 0 || description.trim().length === 0) {
        throw new ApiError(400, " cannot get the name or description");
    }

    if (!userId) {
        throw new ApiError(400, " cannot get the userId ");
    }

    // create playlist 
    const playlist = await Playlist.create({
        name: name,
        description: description,
        videos: [],
        owner: userId,
    })

    const createdPlaylist = await Playlist.findById(playlist._id);

    if (!createdPlaylist) {
        throw new ApiError(400, " cannot generate the playlist");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, createdPlaylist, " the playlist is empty ")
        )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!userId || userId.trim().length === 0) {
        throw new ApiError(400, "cannot get the userId");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " the user id is not a vailid object id");
    }

    const user = await Playlist.findOne({ owner: userId });
    if (!user) {
        throw new ApiError(400, " cannot find user playlist ");
    }

    const userplaylist = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId),
            }
        }
    ])

    if (userplaylist.length === 0) {
        throw new ApiError(400, " cannot get the user playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userplaylist, " find the play list ")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId || playlistId.trim().length == 0) {
        throw new ApiError(400, " cannot get the playlist id ");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, " the id is not  a valid playlist id ");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, " connot get the playlist id ");;
    }

    return res.status(200)
        .json(
            new ApiResponse(200, playlist, " the playlist successfully found ")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!playlistId || !videoId) {
        throw new ApiError(400, "cannot get the playlistId or videoId");
    }
    if (playlistId.trim().length === 0 || videoId.trim().length === 0) {
        throw new ApiError(400, "cannot get the videoId or playlistId");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, " the playlistId is not a valid object id ");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " the videoId is not a valid object id");
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, { $push: { videos: videoId } }, { new: true });

    if (!playlist) {
        throw new ApiError(400, " cannot create the new playlist");
    }
    // no need to dothis as the playlist itself have new updated value
    // const newPlaylist = await Playlist.findById(playlist._id);

    // if (!newPlaylist) {
    //     throw new ApiError(400, "the playlist not found ");
    // }

    return res.status(200)
        .json(
            new ApiResponse(200, playlist, "video added to playlist ")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!playlistId || !videoId) {
        throw new ApiError(400, "cannot get the playlistId or videoId");
    }
    if (playlistId.trim().length === 0 || videoId.trim().length === 0) {
        throw new ApiError(400, "cannot get the videoId or playlistId");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, " the playlistId is not a valid object id ");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " the videoId is not a valid object id");
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, { $pull: { videos: videoId } }, { new: true });

    if (!playlist) {
        throw new ApiError(400, " cannot update the  playlist");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, playlist, "video removed to playlist ")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, " cannot get the playlist id");
    }
    if (playlistId.trim().length === 0) {
        throw new ApiError(400, " the playlist id not provided");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, " the playlist id is not a valid object id");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlist) {
        throw new ApiError(400, "cannot delete the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "the playlist deleted sucessfully")
        )


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!playlistId) {
        throw new ApiError(400, "cannot find the playlistid");
    }
    if (name.trim().length === 0) {
        throw new ApiError(400, "cannot get the name");
    }
    if (description.trim().length === 0) {
        throw new ApiError(400, "cannot get the description");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "the playlist id is not a valid id")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, { name: name, description: description }, { new: true });

    if (!playlist) {
        throw new ApiError(400, " cannot update the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "the playlist got updated")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}