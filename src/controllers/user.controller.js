import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
}
const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, userName, password} = req.body
    
    // check for empty value
    if([fullName, email, userName, password].some((field) => field.trim() === ""))
        throw new ApiError(400, "All fields are required");

    // check for existing user
    const existedUser = await User.findOne({$or : [{userName}, {email}]})
    if(existedUser) throw new ApiError(409, "User already exists");

    // take files with the help of multer
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")   
    }

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, "Avatar couldn't get uploaded");
    }
    
    // Save user in database
    const user = await User.create({
        userName, 
        email,
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        password
    })

    // check if user really gets created
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user");
    
    // Give Api response
    return res.status(201).json(new ApiResponse(200, createdUser, "User Registered"))
})

const loginUser = asyncHandler(async (req,res) =>{
    const {email, userName, password} = req.body
    if(!userName && !email){
        throw new ApiError(400, "Username or Email is Required");
    }

    const user = await User.findOne({$or : [{userName}, {email}]});

    if(!user) throw new ApiError(400, "User does not exist");

    const isValid = await user.isPasswordCorrect(password);    
    if(!isValid) throw new ApiError("Invalid User credentials");
     
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user : loggedUser, accessToken, refreshToken
    }, "user logged in successfully"))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {$set: {refreshToken: undefined}}, {new : true})
    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {accessToken, refreshToken},
            "Access token refreshed successfully"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})
export {registerUser}
export {loginUser}
export {logoutUser}
export {refreshAccessToken}