import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async (userId) => {

    const user = await User.findById(userId)
    const accessToken = user.genrateAccessToken()
    const refreshToken = user.genrateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }


}


const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation
    //check if user alredy exists : username or emais
    //check for images,check for avtar
    //uplaod them into cloudinary
    //create user object - create entryin DB
    //remove password and refresh field from response
    //check for user creation
    //return res

    const { username, email, fullname, password } = req.body

    //validaton start
    if (
        [fullname, email, username, password].some((field) =>  field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    //validation end

    // check user alredy exist :start
    const exitedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (exitedUser) {
        throw new ApiError(409, "User alredy exists")
    }
    //end

    /*File existance check : Start*/


    //end
    //const coverImageLocalPath = res.files?.coverImage[0]?.path;

    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    // if (!avtarLocalPath) {
    //     throw new (400, "Avtar path is required")
    // }

    //uploading files on cloudianry : Start

    const coverImage = await uploadCloudinary(coverImageLocalPath)


    //Entry all in DB :Start
    const user = await User.create({
        fullname,

        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    //end

    //remove password and refresh field from response :Start
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  //these filed not selected
    )
    //end
    //check for user creation :Start
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring user : server error")
    }
    //end

    //reponse start
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registred sucessfully")
    )
    //end
})


const loginuser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookies


    const { email, username, password } = req.body
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credintial")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user.id).select("-password -refreshToken")

    //cookies
    const option = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
            "User logged In successfully"
        )
    )
})


const logOutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user.id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user logged Out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingrefreshToken) {
        throw new ApiError(401, "unauthorized request of token")
    }

    try {
        const decodedToken = jwt.verify(
            incomingrefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingrefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "AcessToken refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, "Invalid new refresh tokens")
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"))
})


const getCurrrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findById(
        req.user?._id,
        {
            $set: {
                fullname,   //fullname:fullname
                email,
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200)
    .json(
        new ApiResponse(
            200, "Account details uppdated successfully"
        )
    )
})


const getUserChannel = asyncHandler(async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscriber"
                },
                channelsSubscribedTocount: {
                    $size: "$subscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscriber.subscriber"] },
                        than: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedTocount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )

})


const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"video",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,"Watch history fetched successfully"
    ))
})


export {
    registerUser,
    loginuser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrrentUser,
    updateAccountDetails,
    getUserChannel,
    getUserWatchHistory
}