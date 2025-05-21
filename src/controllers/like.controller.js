import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) {
        throw new ApiError("Invalid video id", 400)
    }
    const userId = req.user?._id
    if(!userId) {
        throw new ApiError("User not found", 404)
    }
    const video = await Video.findById(
      videoId  
    )
    if(!video) {
        throw new ApiError("Video not found", 404)
    }
    const like = await Like.findOne({
        video : videoId,
        likedBy : userId
    })
    if(like) {
        await Like.findByIdAndDelete(like._id)
        video.likesCount = video.likesCount - 1
        await video.save()
        return res.status(200).json(
            new ApiResponse("success", "Video unliked successfully", {
                videoId,
                liked : false
            })
        )
    }
    const newLike = await Like.create({
        video : videoId,
        likedBy : userId
    })
    video.likesCount = video.likesCount + 1
    await video.save()
    return res.status(200).json(
        new ApiResponse("success", "Video liked successfully", {
            videoId,
            liked : true
        })
    )
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)) {
        throw new ApiError("Invalid comment id", 400)
    }
    const userId = req.user?._id
    if(!userId) {
        throw new ApiError("User not found", 404)
    }
    
    const comment = await Comment.findById(
      commentId  
    )
    if(!comment) {
        throw new ApiError("comment not found", 404)
    }
    const like = await Like.findOne({
        comment : commentId,
        likedBy : userId
    })
    if(like) {
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(
            new ApiResponse("success", "comment unliked successfully", {
                commentId,
                liked : false
            })
        )
    }
    const newLike = await Like.create({
        comment : commentId,
        likedBy : userId
    })
    return res.status(200).json(
        new ApiResponse("success", "comment liked successfully", {
            newLike,
            liked : true
        })
    )
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)) {
        throw new ApiError("Invalid tweet id", 400)
    }
    const userId = req.user?._id
    if(!userId) {
        throw new ApiError("User not found", 404)
    }
    
    const tweet = await Tweet.findById(
        tweetId       
    )
    if(!tweet) {
        throw new ApiError("tweet not found", 404)
    }
    const like = await Like.findOne({
        tweet : tweetId,
        likedBy : userId
    })
    if(like) {
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(
            new ApiResponse("success", "tweet unliked successfully", {
                tweetId,
                liked : false
            })
        )
    }
    const newLike = await Like.create({
        tweet : tweetId,
        likedBy : userId
    })
    return res.status(200).json(
        new ApiResponse("success", "tweet liked successfully", {
            newLike,
            liked : true
        })
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "likedBy",
                as : "likedVideos",
                pipeline : [
                    {
                        $match : {
                            video : {
                                $ne : null
                            }
                        }
                    },
                    {
                        $lookup : {
                            from: "videos",
                            localField: "video",
                            foreignField: "_id",
                            as : "videoDetails"
                        }
                    },
                    {
                        $unwind : "$videoDetails"
                    },
                    {
                        $project : {
                            videoDetails : 1
                        }
                    }
                ]
            }
        },
        {
            $project : {
                likedVideos : 1,
                fullName : 1,
                avatar : 1,
                email : 1,
                userName : 1,
            }
        }
    ])
    if(!user || user.length === 0) {
        throw new ApiError("User not found", 404)
    }
    const userDetails = user[0]
    return res.status(200).json(
        new ApiResponse("success", "Liked videos fetched successfully", {
            userDetails
        })
    )
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}