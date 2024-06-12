const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
   userName:{
    type:String,
    require:true
   },
   email:{
    type:String,
    required:true
   },
   pass:{
    type:String,
    required:true
   },
   date:{
    type:Date, default:Date.now
   }

}   ); 

UserSchema.pre("save", async function(next){
if(!this.isModified){
   next();
}
const salt = await bcrypt.genSalt(10);
this.pass = await bcrypt.hash(this.pass,salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword){
   return await bcrypt.compare(enteredPassword,this.pass);
}

const User = mongoose.model('User', UserSchema);
module.exports = User;

