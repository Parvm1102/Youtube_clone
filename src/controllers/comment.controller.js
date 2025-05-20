import mongoose from "mongoose"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
   
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const videoComments = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from : "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline : [
                    {
                        $skip : (page - 1) * limit
                    },
                    {
                        $limit : limit
                    }
                ]
            }
        },
        
        {
            $project: {
            _id: 1,
            title: 1,
            thumbnail: 1,
            description: 1,
            createdAt: 1,
            comments: 1,
            }
        }
    ])
    if(!videoComments) {
        throw new ApiError(404, "No comments found")
    }
    if(videoComments.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, "success", {
                message: "No comments found"
            } )
        )
    }
    const comments = videoComments[0]
    return res.status(200).json(
        new ApiResponse(200, {comments}, "comments fetched successfully" ))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Content is required")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })
    if(!comment) {
        throw new ApiError(500, "Comment not created")
    }
    video.commentsCount += 1
    await video.save()
    return res.status(201).json(
        new ApiResponse(201, {comment}, "Comment created successfully" ))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Content is required")
    }
    const comment = await Comment.findById(commentId)
    if(!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if(comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
    }
    comment.content = content
    await comment.save()
    return res.status(200).json(
        new ApiResponse(200, {comment}, "Comment updated successfully" ))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const comment = await Comment.findById(commentId)
    if(!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if(comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }
    const video = await Video.findById(comment.video)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    video.commentsCount -= 1
    await comment.deleteOne()
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, "success", "Comment deleted successfully" ))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }