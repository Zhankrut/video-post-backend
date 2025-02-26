import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!channelId || channelId == "") {
        throw new ApiError(400, "cannot get the channel id");
    }
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channelId is not a vailid id");
    }
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "cannot get the user id");
    }
    // check weather the userId and channelId already exist in the database
    const existingSubscription = await Subscription.findOne({ userId, channelId });

    if (existingSubscription) {
        const deleteSubscription = await Subscription.findOneAndDelete({ userId, channelId });
        return res
            .status(200)
            .json(
                new ApiResponse(200, deleteSubscription, " the user has successfully unsubscribed the channel ")
            );
    } else {
        const newSubscription = new Subscription({ userId, channelId });
        await newSubscription.save();
        return res
            .status(200)
            .json(
                new ApiResponse(200, newSubscription, " the user has successfully subscribed the channel ")
            );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId || channelId == "") {
        throw new ApiError(400, " cannot get the channel id ");
    }

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, " the channel id is not a valid channel id");
    }

   
    const Subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $group: {
                _id: null,
               subscribers:{
                $push:"$subscriber"
               }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, Subscribers, "channel subscribers ")
        )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId || subscriberId == "") {
        throw new ApiError(400, "cannot get the subscriberId");
    }

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, " subscriberId is not a vailid id");
    }

    

    const subscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $group: {
                _id: null,
                channels:
                {
                    $push: "$channel"

                },
            }
        }
    ]);

    if (!subscribedTo || subscribedTo.length === 0) {
        throw new ApiError(400, "cannot get the subscribed channels")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedTo, " the channel subscription ")
        )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}