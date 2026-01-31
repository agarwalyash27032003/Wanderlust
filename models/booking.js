const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderId: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  // Booking Details
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

  roomsBooked: {
    type: Number,
    required: true
  },

  nights: {
    type: Number,
    required: true
  },

  // Payment Details
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

  status: {
    type: String,
    enum: ["booked", "cancelled", "completed"],
    default: "booked"
  },

  // Refund Details
  refundStatus: {
    type: String,
    enum: ["none", "initiated", "refunded"],
    default: "none"
  },

  refundId: String,
  cancelledAt: Date

});

module.exports = mongoose.model("Booking", bookingSchema);
