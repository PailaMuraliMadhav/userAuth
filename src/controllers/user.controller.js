import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { is } from "express/lib/request.js";


const generateAccessTokenandRefreshToken = async(userId)=>{
  try{
    const user = await User.findById(userId)
if(!user){
    throw new ApiError(404, "User not found");
  }
 const  accessToken =user.generateAccessToken();
const refreshToken =user.generateRefreshToken();

user.refreshToken=refreshToken;
 await user.save({ValidateBeforeSave: false});
return {accessToken, refreshToken};
  }
  catch(error){
    throw new ApiError(500, "Internal server error while generating tokens");
  }
};


const registerUser = asyncHandler(async (req, res) => {
  // res.status(201).json({ message: "Everything is okay" })

  // get user details ✅
  // validate data ✅
  // check if user is already exist or not? email, useername ✅
  // check for image and coverImage ✅
  // upload them to cloudinary ✅
  // craete user object ✅
  // remove password, refresh token
  // check user creation
  // return res

  const { username, fullName, email, password } = req.body
  console.log(username);

  // if(username === "") {
  //     throw new ApiError(400, "username is required")
  // }

    if ([username, email, fullName, password].some(
        (field) => ( field?.trim() === "" )
    )) {
        throw new ApiError(400, "All fields are required")
    }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with this email or username is already exist");
  }

  // console.log("req.files: ", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required!!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required!!!");
  }

  const user = await User.create({
    username,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || null,
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong, while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully!!!"));
});

const loginUser = asyncHandler(async(req,res)=>{
        //  res.status(200).json({ message: "Login user" });.
        //req.body ->data
        const {email,username,password}=req.body;
        console.log("email",email);
        // username or email validate
        if(!username && !email){
          throw new ApiError(400,"user name or email is required");
        }
        // find the user
       const user =await User.findOne({
          $or: [{email},{username}]
        })
        if(!user){
          throw new ApiError(400,"user not found with this email or username");
        }

        // check password
        const isPasswordValid =await user.isPasswordCorrect(password);
         if(!isPasswordValid){
          throw new ApiError(400,"Invalid password");
         }
         console.log(isPasswordValid);


     const {accessToken,refreshToken} = await   generateAccessTokenandRefreshToken(user._id)
     

        // generate access token and refresh token

const loggedUser =    await   User.findById(User._id).select("-password -refreshToken")
        // send cookies

        const cookieoptions = {
          httpOnly:true,
          secure:true,

        }
        return res
        .status(200)
         .cookie("accessToken", accessToken, cookieoptions)
          .cookie("refreshToken", refreshToken, cookieoptions) 
          .json(
            new ApiResponse(200,{user:loggedUser,accessToken,refreshToken},"User logged in successfully!!!")
          )
        

});
const logoutUser = asyncHandler(async(req,res)=> {
//go to the user and remove refresh token
User.findByIdAndUpdate(
  req.user._id,
  {
    $unsest:{
      refreshToken:undefined || 1
    }

  },
  {
    new:true
  }
  
)
const options ={
httpOnly:true,
secure:true
}
return res
 .status(201)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(new ApiResponse(200, {}, "User logged out successfully!!!"))
});
export { registerUser, loginUser,logoutUser };
