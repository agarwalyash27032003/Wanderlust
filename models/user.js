const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const Booking = require("./booking.js");
const Listing = require("./listing.js");

// Here passportLocalMongoose creates username and password in Schema with hashed and salted
const userSchema = new Schema({
    firstName:{
        type: String,
        // required: true
    },
    lastName:{
        type: String,
    },
    contactNumber:{
        type: Number,
        // required: true
    },
    profileImage:{
        url:{
            type: String,
            default: "https://res.cloudinary.com/dxk7cwat3/image/upload/v1751460139/default_dp_kvozhr.png"
        },
        filename:{
            type: String,
            default: "default_dp",
        }
    },
    email: {
        type: String,
        required: true,
    },
    bookings: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Booking", 
            // required: true 
        }
    ],
    listings: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Listing", 
            // required: true 
        }
    ],
    wishlists: [ 
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Listing", 
            // required: true 
        }
    ],
    role:{
        type: String,
        // required: true,
        default: "user",
    }
});

userSchema.post("findOneAndDelete", async(user) => {
  if(user){
    await Listing.deleteMany({_id : {$in: user.listings}});
    await Booking.deleteMany({_id : {$in: user.bookings}});
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);