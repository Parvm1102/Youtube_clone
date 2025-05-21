import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new ApiError("Invalid channel id", 400)
    }
    const userId = req.user?._id
    if(!userId) {
        throw new ApiError("User not found", 404)
    }
    const channel = await User.findById(
        channelId  
    )
    if(!channel) {
        throw new ApiError("Channel not found", 404)
    }
    const subscription = await Subscription.findOne({
        channel : channelId,
        subscriber : userId
    })
    if(subscription) {
        await Subscription.findByIdAndDelete(subscription._id)
        return res.status(200).json(
            new ApiResponse("success", "Unsubscribed successfully", {
                channelId,
                subscribed : false
            })
        )
    }
    const newSubscription = await Subscription.create({
        channel : channelId,
        subscriber : userId
    })
    if(!newSubscription) {
        throw new ApiError("Unable to subscribe", 500)
    }
    return res.status(200).json(
        new ApiResponse(200, "Subscribed successfully", {
            newSubscription,
            subscribed : true
        })
    )
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    const userChannels = await User.aggregate([
        {
            $match : {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "subscriber",
                            foreignField : "_id",
                            as : "subscriberDetails"
                        }
                    },
                    {
                        $unwind : "$subscriberDetails"
                    },
                    {
                        $project : {
                            _id : 0,
                            subscriberId : "$subscriberDetails._id",
                            subscriberEmail : "$subscriberDetails.email",
                            subscriberUserName : "$subscriberDetails.userName",
                            subscriberAvatar : "$subscriberDetails.avatar",
                            subscriberFullName : "$subscriberDetails.fullName",
                        }
                    }
                ]
            }

        },
        {
            $addFields : {
                subscriberCount : {
                    $size : "$subscribers"
                }
            }
        },
        
    ])
    if(!userChannels || userChannels.length === 0) {
        throw new ApiError("No subscribers found", 404)
    }
    const user = userChannels[0]
    return res.status(200).json(
        new ApiResponse(200, "Fetched user channels successfully", {
            user
        })
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }
    const userSubscribedChannels = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscriptions",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "channel",
                            foreignField : "_id",
                            as : "channelDetails"
                        }
                    },
                    {
                        $unwind : "$channelDetails"
                    },
                    {
                        $project : {
                            subscriptionId : "$_id",
                            _id : 0,
                            channelId : "$channelDetails._id",
                            channelEmail : "$channelDetails.email",
                            channelUserName : "$channelDetails.userName",
                            channelAvatar : "$channelDetails.avatar",
                            channelFullName : "$channelDetails.fullName",
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                subscribedChannelCount : {
                    $size : "$subscriptions"
                }
            }
        },
        {
            $project : {
                subscriptions : 1,
                subscribedChannelCount : 1,
                fullName : 1,
                avatar : 1,
                email : 1,
                userName : 1,
            }
        }
    ])
    if(!userSubscribedChannels || userSubscribedChannels.length === 0) {
        throw new ApiError("No subscribed channels found", 404)
    }
    const user = userSubscribedChannels[0]
    return res.status(200).json(
        new ApiResponse(200, "Fetched subscribed channels successfully", {
            user
        })
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}