import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const user = User.findById(req.user?._id)
    if(!user) {
        throw new ApiError(404, "User not found")
    }
    if(!content) {
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    if(!tweet) {
        throw new ApiError(500, "Tweet not created")
    }

    res.status(201).json(
        new ApiResponse(201, {tweet}, "Tweet created successfully"))
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params || req.user?._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "tweets",
                localField : "_id",
                foreignField : "owner", 
                as: "tweets"
            }
        },
        {
            $project: {
                userName : 1,
                tweets : 1,
                fullName : 1,
                email : 1,
                avatar : 1
            }
        }
    ])
    if(!user || user.length === 0){
        throw new ApiError(404, "user not found")
    }
    const usertweets = user[0]
    return res.status(200).json(
        new ApiResponse(200, {usertweets}, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const userId = req.user?._id
    const {tweetId} = req.params
    if(!content){
        throw new ApiError(401, "content is required")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if(tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }
    tweet.content = content
    const updatedTweet = await tweet.save()
    if(!updatedTweet) {
        throw new ApiError(500, "Tweet not updated")
    }
    return res.status(200).json(
        new ApiResponse(200, {updatedTweet}, "Tweet updated successfully"))
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId = req.user?._id
    const {tweetId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if(tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }
    const deletedTweet = await tweet.deleteOne()
    if(!deletedTweet) {
        throw new ApiError(500, "Tweet not deleted")
    }
    return res.status(200).json(
        new ApiResponse(200, {deletedTweet}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}