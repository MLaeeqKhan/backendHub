//server.js file

const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const PORT = process.env.PORT;
const connection = require("./DB/conn");
const cors = require("cors");
const bodyParser = require("body-parser");



console.log("hello from  server.js");
const authRouter = require("./Router/auth");
const ChatAppcontrollerRouter = require("./Router/ChatAppController");
const ForumControllerRouter = require("./Router/ForumController");
const EcommerceRouter = require("./Router/ecommerceController");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(bodyParser.json());


app.use(cors());
app.use("/", authRouter);
app.use("/", ChatAppcontrollerRouter); 
app.use("/", ForumControllerRouter);
app.use("/", EcommerceRouter);

app.use('/public',express.static('public'));


connection().then(() => {
 const server= app.listen(PORT, () => {
    console.log(`Server is running at port No http://localhost:${PORT}`);
  });

  const io = require("socket.io")(server,{
    pingTimeout:60000,
    cors:{
      origin:"http://localhost:3000",
    }
  });
  io.on("connection",(socket)=>{
    console.log("connected to socket.io");

   
    socket.on("setup",(userData)=>{
      if(userData && userData._id){
        socket.join(userData._id);
        console.log("userData._id:",userData._id)
        socket.emit("connected");
      }
      else {
        console.error("Invalid userData:");
      }
    });
    socket.on("join chat",(room)=>{
      socket.join(room);
      console.log("user joined room:"+room);
    });   
    
    socket.on('new message', (newMessageRecieved,upDateReceiver) => {
      var message = newMessageRecieved;
      console.log("newMessageRecieved:",newMessageRecieved);
  console.log("upDateReceiver:",upDateReceiver);
      if (!message) return console.log("chat not defined");
  
        socket.in(upDateReceiver).emit("message Received", message);
      
    });
  });

}).catch((err)=>{
  console.error("Error connecting to the database:", err);
});

