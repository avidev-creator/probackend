import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave : false })
    
    return { accessToken, refreshToken}

  } catch(error) {
    throw new ApiError(500, "Failed To Generate Tokens")
  }
}

const registerUser = asyncHandler( async (req, res) => {
  // res.status(200).json({
    // message: "OK"
  // })
  
  /* Logic Building for registering a user-- 
  1. get user details from frontend
  2. validation - not empty
  3. check if user already exists - username and email
  4. image files available or not - avatar and coverimage
  5. upload files on cloudinary
  6. create user object for mongodb
  7. remove password and refreshtoken field from response
  8. check if user created or not
  9. return response
  */

  const { fullName, email, username, password } = req.body
  
  console.log(email);
  console.log(fullName);
  console.log(username);
  console.log(password);

  //if(fullName === ""){
  //  throw new ApiError(400, "got full name")
  //}

  if(
  [fullName, email, username, password].some((field)=> field?.trim() === "")
  ){
    throw new ApiError(400, "All fields required")
  }
  
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  
  if(existedUser){
    throw new ApiError(409,"User Already Exists. Please login")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar File Required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar File Required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500, "Unable to create user. Please try again")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Sucessfully")
  )

})


// Login User Logic -- 

const loginUser = asyncHandler(async (req, res) =>{
  /* 
    1. req body -> data
    2. username or email
    3. find the user
    4. password check
    5. access and referesh token
    6. send cookie
    */

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


// Logout User Logic -- 


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incommingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }

  try{
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user) {
      throw new ApiError(401, "Invalid Token")
    }

    if(incommingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh Token Expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, 
          {accessToken, newRefreshToken},
          "Access Token Refreshed"
        )
      )
  } catch(error){
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }
