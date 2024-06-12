
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  createdChatID:{type:mongoose.Schema.Types.ObjectId,ref:"createdChat"},
  senderID:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  content: {
    type: String,
    required: true,
  },
  date: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", chatSchema);
module.exports= Chat;
