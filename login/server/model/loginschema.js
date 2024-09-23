const mongoose = require("mongoose");
const newSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    
    resetCode: {
        type: String,
        default: ''
    },
    resetCodeExpiration: {
        type: Date,
        default: Date.now
    }
})
const collection =mongoose.model("collection",newSchema)
module.exports=collection;