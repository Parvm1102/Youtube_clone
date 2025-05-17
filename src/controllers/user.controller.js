import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, username, password} = req.body

    // check for empty value
    if([fullName, email, username, password].some((field) => field.trim() === "")) 
        throw new ApiError(400, "All fields are required");

    // check for existing user
    const existedUser = User.findOne({$or : [{username}, {email}]})
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
        username, 
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
export {registerUser}
export {registerUser}