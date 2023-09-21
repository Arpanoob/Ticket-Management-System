const mongoose = require('mongoose');
exports.init=async function(){
await mongoose.connect('mongodb+srv://arpanguptaastro:jbSND6WKlTAYwDkg@cluster0.gquawpk.mongodb.net/HARHARSAMBHU1?retryWrites=true&w=majority');
}