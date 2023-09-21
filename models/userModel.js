const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({userName:String,Password:String,Email:String,profilePic:Object})
const userModel= mongoose.model('Users', userSchema);
module.exports=userModel;