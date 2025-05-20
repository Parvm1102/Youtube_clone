import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }
    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required")
    }
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    // Upload video to cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if (!videoFile) {
        throw new ApiError(500, "Failed to upload video")
    }
    // Upload thumbnail to cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail")
    }
    // get video duration
    const duration = videoFile.duration
    if (!duration) {
        throw new ApiError(500, "Failed to get video duration")
    }
    // Create video
    const video  = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail : thumbnail.url,
        duration, 
        owner: req.user?._id,
    })
    if (!video) {
        throw new ApiError(500, "Failed to create video")
    }
    return res.status(201)
    .json(new ApiResponse(201, {video}, "Video created successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200)
    .json(new ApiResponse(200, {video}, "Video fetched successfully"))
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    let body = ""
    const {title} = req.body
    if(title) {
        video.title = title
        body = "title"
    }
    
    const {description} = req.body
    if(description) {
        video.description = description
        if(body !== "") body += ", "
        body += "description"
    }
    const thumbnailLocalPath = req.file?.path
    const oldthumbnailurl = video.thumbnail
    if(thumbnailLocalPath) {
        // Upload thumbnail to cloudinary
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }
        video.thumbnail = thumbnail.url
        if(body !== "") body += ", "
        body += "thumbnail"
    }
    if(oldthumbnailurl){
        const urlParts = oldthumbnailurl.split('/')
        const publicId = (urlParts[urlParts.length - 1]).split('.')[0]
        await deleteOnCloudinary(publicId);
    }
    const updatedVideo = await video.save()
    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }
    if(body === "") body = "none"
    return res.status(200)
    .json(new ApiResponse(200, {updatedVideo}, `Video updated successfully, updated ${body}`))
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    const videoFileUrl = video.videoFile
    const thumbnailUrl = video.thumbnail
    if(thumbnailUrl){
        const urlParts = thumbnailUrl.split('/')
        const publicId = (urlParts[urlParts.length - 1]).split('.')[0]
        await deleteOnCloudinary(publicId);
    }
    if(videoFileUrl){
        const urlParts = videoFileUrl.split('/')
        const publicId = (urlParts[urlParts.length - 1]).split('.')[0]
        await deleteOnCloudinary(publicId, "video");
    }
    await video.deleteOne()
    return res.status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    video.isPublished = !video.isPublished
    const updatedVideo = await video.save()
    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }
    return res.status(200)
    .json(new ApiResponse(200, {updatedVideo}, `Video publish status updated successfully`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}