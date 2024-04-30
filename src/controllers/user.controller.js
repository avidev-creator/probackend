import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


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

  //if(fullName === ""){
  //  throw new ApiError(400, "got full name")
  //}

  if(
  [fullName, email, username, password].some((field)=> field?.trim() === "")
  ){
    throw new ApiError(400, "All fields required")
  }

})


export { registerUser }
