//threadSchema file
const mongoose = require('mongoose');

const threadsSchema= new mongoose.Schema({
    multipleImages: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    title:{
        type:String,
        required:true
    },
   
    description:{
        type:String,
        required:true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      } ,
      date:{
        type : Date, default: Date.now
    },
      
    
})

const threads = mongoose.model("THREADS",threadsSchema);
module.exports=threads;