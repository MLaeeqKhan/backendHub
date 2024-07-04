// Controller.js  file

const express = require("express");
const router = express.Router();
const User = require("../Models/ChatModels/userModel");
const Chat = require("../Models/ChatModels/chatModel");
const createdChats = require("../Models/ChatModels/createdChat");
const Notification = require("../Models/ChatModels/notificationModel");

router.get("/getUsers", async (req, res) => {
  try {
    const user = await User.find();
    // console.log("Controller User:", user);
    res.json({ user });
  } catch (error) {
    console.log("Controller User Error:", error);
    res.send(error);
  }
});

router.get("/getChats", async (req, res) => {
  try {
    var chat = await createdChats.find().populate('receiverID', 'userName').populate('senderID','userName');
    res.json({ chat });
  } catch (error) {
    console.log("Controller Chat Error:", error);
    res.send(error);
  }
});

router.post("/sendMessage", async (req, res) => {
  const { userId, receiverId, content } = req.body;
  console.log('sendMessage receiverId:', receiverId)
    console.log('sendMessage userId:', userId)

  try {
    const chat = await createdChats.findOne({
      $or: [
        { senderID: userId, receiverID: receiverId },
        { senderID: receiverId, receiverID: userId },
      ],
    });
    if (chat) {
      let chatID = chat._id;
      const msg = new Chat({
        createdChatID: chatID,
        senderID: userId,
        content: content,
      });
      await msg.save();
      res.status(200).json({ msg });
    } else {
      const newChat = new createdChats({ senderID:userId, receiverID:receiverId });
      await newChat.save();
      let chatID = newChat._id;
      const msg = new Chat({
        createdChatID: chatID,
        senderID: userId,
        content: content,
      });
      await msg.save();
      res.status(200).json({ msg });
    }
  } catch (error) {
    res.status(500).json({ message: "Interval Server Error!" });
  }
});


router.get("/getMessages/:chatId", async(req,res)=>{
  const chatId = req.params.chatId;
  try {
    const messages = await Chat.find({createdChatID:chatId}).populate('senderID','userName').sort({date:1});
  res.status(200).json({messages});
  } catch (error) {
    console.error("Error Fetching messages:", error);
  res.status(500).json({error:'Internal Server Error'});
  }

})

router.get("/getAllMessages", async(req,res)=>{
  try {
    const messages = await Chat.find();
    res.status(200).json({messages});

  } catch (error) {
    console.error("Error Fetching messages:", error);
  res.status(500).json({error:'Internal Server Error'});
  }

})

router.post("/saveNotification", async(req,res)=>{
  try {
    const notifications = req.body; // Assuming req.body is an array of notifications

    // Save notifications to MongoDB
    await Notification.insertMany(notifications);

    res.status(200).json({ message: 'Notifications saved successfully' });
  } catch (error) {
    console.error('Error saving notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

router.get("/getNotification", async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json({ notifications });
  } catch (error) {
    console.log("Controller Notification Error:", error);
    res.send(error);
  }
});

router.delete('/deleteNotification/:chatId',async(req,res)=>{
  try {
    const {chatId}= req.params;
  const deleteNotification=await Notification.deleteMany({createdChatID:chatId});
  res.status(200).json({message:"Notifications deleted successfully",deleteNotification});
  } catch (error) {
    console.error('Error deleting notifications:',error);
    res.status(500).json({error:'Internal server error in deleting notifications'});
  }
  
})

module.exports = router;
