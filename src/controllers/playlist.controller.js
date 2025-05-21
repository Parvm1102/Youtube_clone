import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name) {
        throw new ApiError(400, "Playlist name is required")
    }
    const userId = req.user?._id
    if(!userId) {
        throw new ApiError(404, "User not found")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner : userId
    })
    if(!playlist) {
        throw new ApiError(500, "Playlist not created")
    }
    return res.status(201).json(
        new ApiResponse(200, "Playlist created successfully", {
            playlist
        })
    )
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    const userPlaylists = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "playlists",
                localField: "_id",
                foreignField: "owner",
                as: "playlists"
            }
        },
        {
            $project: {
                playlists: 1
            }
        }
    ])
    if(!userPlaylists || userPlaylists.length === 0) {
        throw new ApiError(404, "User playlists not found")
    }
    return res.status(200).json(
        new ApiResponse(200, "User playlists fetched successfully", {
            userPlaylists
        })
    )
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId).populate("videos")
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    return res.status(200).json(
        new ApiResponse(200 , "Playlist fetched successfully", {
            playlist
        })
    )
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    const videoExists = playlist.videos.includes(videoId)
    if(videoExists) {
        throw new ApiError(400, "Video already exists in playlist")
    }
    playlist.videos.push(videoId)
    await playlist.save()
    return res.status(200).json(
        new ApiResponse(200, "Video added to playlist successfully", {
            playlist
        })
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    const videoExists = playlist.videos.includes(videoId)
    if(!videoExists) {
        throw new ApiError(400, "Video does not exist in playlist")
    }
    playlist.videos = playlist.videos.filter(video => video.toString() !== videoId)
    await playlist.save()
    return res.status(200).json(
        new ApiResponse(200, "Video removed from playlist successfully", {
            playlist
        })
    )
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    await playlist.deleteOne()
    return res.status(200).json(
        new ApiResponse(200, "Playlist deleted successfully", {
        })
    )
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if(name) {
        playlist.name = name
    }
    if(description) {
        playlist.description = description
    }
    await playlist.save()
    return res.status(200).json(
        new ApiResponse(200, "Playlist updated successfully", {
            playlist
        })
    )
    //TODO: update playlist
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