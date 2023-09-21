const mongoose=require('mongoose')

const ticketSchema = new mongoose.Schema({
    Subject: String,
    Discription: String,
    Department: String,
    Username: String,
    UserSocket: String,
    DepSocket: String,
    chat:Array,
    DepPerson: String // Store the socket ID as a string
});
const ticketModel= mongoose.model('tickets', ticketSchema);
module.exports=ticketModel;