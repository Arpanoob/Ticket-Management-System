const mongoose=require('mongoose')

const departmentSchema=new mongoose.Schema({userName:String,Password:String,Email:String,profilePic:Object,department:String})
const departmentModel= mongoose.model('Department', departmentSchema);
module.exports=departmentModel;