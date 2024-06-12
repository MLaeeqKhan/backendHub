const mongoose = require('mongoose');

const repliesSchema= new mongoose.Schema({
    ReplyContent:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
    },
    date:{
        type:Date, default:Date.now
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    threadID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'THREADS',
        required: true
    },
    threadUserID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'THREADS',
        required: true
    },
   
    
})
const replies=mongoose.model("REPLIES",repliesSchema);
module.exports=replies;