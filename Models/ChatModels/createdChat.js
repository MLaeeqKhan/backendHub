const mongoose = require("mongoose");

const createdChatSchema = new mongoose.Schema({
    senderID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    receiverID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    date:{type:Date, default:Date.now}
})

const createdChat = mongoose.model("createdChat", createdChatSchema);
module.exports= createdChat