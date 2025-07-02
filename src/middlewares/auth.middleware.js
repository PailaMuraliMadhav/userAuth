// import { asyncHandler } from "../utils/asyncHandler";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
export const verifyJWT = asyncHandler(async(req,res,next)=>{
try{
      const token=   req.cookies?.accessToken ||req.header("Authorization")?.replace("Bearer ","");
      console.log("Authorized Token: ",token);

if(!token){
    throw new ApiError(401,"Unauthorized, No token provided");
}

const decodedToken = await jwt.verify(token,"ggwpggwpggwpggwp+mgmgmgmgmg");
const user= await User.findById(decodedToken?._id).select("-password -refreshToken")

if(!user){
    throw new ApiError(401,"Unauthorized, No user found with this token");
}
req.user =user;
next();
}
catch(error){
    throw new ApiError(401,error.message || "Invalid Token");

}


})