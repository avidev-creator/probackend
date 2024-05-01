import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
  
  const existedUser = User.findOne({
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


export { registerUser }
