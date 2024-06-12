// NotificationModel
const mongoose=require("mongoose");
// Define Notification Schema
const notificationSchema = new mongoose.Schema({
    createdChatID:{type:mongoose.Schema.Types.ObjectId,ref:"createdChat"},
    senderID:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    content: {
      type: String,
      required: true,
    },
    date: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports=Notification;