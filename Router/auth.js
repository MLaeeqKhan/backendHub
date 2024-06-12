//auth.js file

const express = require("express");
var nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const router = express.Router();
require("../DB/conn");
const User = require("../Models/ChatModels/userModel");
const generateToken = require("../Middleware/generateToken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
router.use(express.json());

router.post("/signup", async (req, res) => {
  const { userName, email, pass, cPass } = req.body;

  if (!userName || !email || !pass) {
    console.log("Please Fill All Credential!");
    return res.status(422).send("Please Fill All Credentials!");
  }
  try {
    const userExist = await User.findOne({ email: email });
    if (userExist) {
      console.log("Email Already Exists!");
      return res.status(409).send("Email Already Exists!");
    } else if (pass !== cPass) {
      console.log("Password Don't Match!");
      return res.status(401).send("Passwords Don't Match!");
    } else {
      const user = new User({ userName, email, pass });
      await user.save();
      res.status(200).json({
        _id: user._id,
        userName: user.userName,
        email: user.email,
        token: generateToken(user._id),
      });
      console.log("User SignUp Successfull!");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/signin", async(req,res)=>{
    const {email, pass}=req.body;
    if(!email || !pass){
        return res.status(400).send("Please Fill The Credentials");
    }
    try { 
        const userExist = await User.findOne({email});
        if(userExist && (await userExist.matchPassword(pass))){
            res.json({
                _id:userExist._id,
                userName:userExist.userName,
                email:userExist.email,
                token:generateToken(userExist._id)
            });

        }else{
            return res.status(404).send("Please Enter Valid Credentials!")
        }
    } catch (error) {
        console.log(error);
        return res.status(400).send(" Internal Server Error!");
    }
});


router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const isExist = await User.findOne({ email });
    if (!isExist) {
      return res.status(404).send("Please enter a valid email address.");
    }

    const token = jwt.sign({ userId: isExist._id }, process.env.SECRET_KEY, {
      expiresIn: "5m",
    });
    const resetLink = `http://localhost:5000/reset-password/${isExist._id}/${token}`;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });
console.log('isExist.email', isExist.email)
    var mailOptions = {
      from: "lk7715714@gmail.com",
      to: isExist.email,
      subject: "Reset Password Link",
      text: resetLink,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(405).send("Error In Sending Reset Password Link!");
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).send("Password Reset Link Send Successfully!");
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("forgot-password Internal Server Error");
  }
});

router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log("req.params:", req.params);
  try {
    const isExist = await User.findById(id);
    if (!isExist) {
      return res.status(404).send("User Not Exists!");
    }
    const verify = jwt.verify(token, process.env.SECRET_KEY);
    if (verify) {
      res.render("index.ejs", { email: isExist.email });
      // res.status(200).send("Your Password Reset Successfully!");
    } else {
      res.status(404).send("Your Reset Password Link Expired!!");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(" reset-password: Internal Server Error!");
  }
});

router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log("req.params: ", req.params);
  const { password, confirmPassword } = req.body;
  console.log("req.body: ", req.body);

  console.log("password:", password);

  try {
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords not matched!");
    }
    if (!password) {
      return res.status(422).send("Password is required");
    }
    const verify = jwt.verify(token, process.env.SECRET_KEY);
    if (verify) {
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(password, salt);
      await User.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            pass: newPassword,
          },
        }
      );
      res.status(200).send("Your Password Updated Successfully!");
    } else {
      res.status(404).send("Your Reset Password Link Expired!!");
      // return res.status(500).send(" Your Reset Password Link Expired!");

    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("reset-password: Internal Server Error!");
  }
});



module.exports = router;

