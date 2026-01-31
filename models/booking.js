const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },

  checkIn: {
    type: Date,
    required: true
  },

  checkOut: {
    type: Date,
    required: true
  },

  guests: {
    type: Number,
    required: true
  },

  // ⭐ NEW
  roomsBooked: {
    type: Number,
    required: true
  },

  nights: {
    type: Number,
    required: true
  },

  orderId: {
    type: String,
    required: true
  },

  paymentId: {
    type: String,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["paid", "failed"],
    default: "paid"
  },

  amount: {
    type: Number,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
