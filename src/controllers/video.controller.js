import mongoose, {isValidObjectId,Types} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    // const {title,description,isPublished,owner} = req.body
    
   
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,isPublished=true} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (
        [title,description,isPublished].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required in Video details")
    }
    
    const videoPath = req.files?.videoFile[0].path;
    if (!videoPath) {
        throw new ApiError(404,"Video path not found")
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(404,"thumbnail path not found")
    }

    const videoFile = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!videoFile) {
        throw new ApiError(400,"vid is required")
    }

    const vidUser = await Video.create({    
        title,
        video:  { key: videoFile?.public_id, url: videoFile?.url },
        thumbnail: { key: thumbnail?.public_id, url: thumbnail?.url },
        description,
        duration: videoFile?.duration,
        owner: req.user._id,
        isPublished
    })

    return res.status(200).json(new ApiResponse(200,"Successfully video upload"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
    //TODO: update video details like title, description, thumbnail
    if (![title, description].every(Boolean)) {
        throw new ApiError(400, "All fields are required");
    }


    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }


    const oldVideoDetails  = await Video.findOne({_id:videoId})
    if (!oldVideoDetails) {
        throw new ApiError(404, "Video not find!");
    }

    if (thumbnailLocalPath) {
        await deleteOnCloudinary(oldVideoDetails.thumbnail?.key);
    }

    // upload new thumbnail, if it exists
    let thumbnail;
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }
    if (!thumbnail && thumbnailLocalPath) {
        throw new ApiError(500, "Failed to upload thumbnail!, please try again");
    }
    const updateFields = {
        $set: {
            title,
            description,
        },
    };

    if (thumbnail) {
        updateFields.$set.thumbnail = {
            key: thumbnail.public_id,
            url: thumbnail.url
        };
    }
   

    const updatedVideo=Video.findByIdAndUpdate(
        videoId,
        updateFields,
        { new: true }
    )

    return res.status(200).json(new ApiResponse(200,"video details update successfully!"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId) {
        throw new ApiError(300, "Enter video Id")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400," video not found")
    }
    if (video.videoFile) {
        await deleteOnCloudinary(video.videoFile.key, "video");
    }

    return res.status(200).json(200,"Video deleted successfully")
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId?.trim()) {
        throw new ApiError(404,"video Id not found")
    }

    const chan = await Video.aggregate([
        {
            $match: {
                videoId
            }
        },
        {
            $lookup: {
                from: "video",
                localField: "_id",
                foreignField: "video",
                as: "vid"
            }
        }
    ])
    if (!chan) {
        throw new ApiError(400,"Chan not found")
    }


    return res.status(200).json(new ApiResponse(200, chan[0], "user channel fetched successfully"))
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
}
