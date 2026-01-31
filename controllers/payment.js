const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");


router.post("/create-order", isLoggedIn, async (req, res) => {
    
  try {
    const { listingId, checkIn, checkOut, guests } = req.body;

    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      return res.status(400).json({ error: "Invalid booking dates" });
    }

    const listing = await Listing.findById(listingId);
    if (!listing || listing.approval_status !== "approved") {
      return res.status(404).json({ error: "Listing not available" });
    }

    const maxGuestsPerRoom = listing.maxGuests;
    const totalRooms = listing.numOfRooms;

    const roomsRequired = Math.ceil(guests / maxGuestsPerRoom);

    if (roomsRequired > totalRooms) {
      return res.status(400).json({ error: "Not enough rooms available" });
    }

    const totalAmount = listing.price * nights * roomsRequired;

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    res.json(order);

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});


router.post("/verify", isLoggedIn, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      listingId,
      checkIn,
      checkOut,
      guests
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const overlap = await Booking.findOne({
      listing: listingId,
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn }
    });

    if (overlap) {
      return res.status(400).json({ success: false, message: "Dates already booked" });
    }

    const listing = await Listing.findById(listingId);

    const maxGuestsPerRoom = listing.maxGuests;
    const totalRooms = listing.numOfRooms;
    const roomsRequired = Math.ceil(guests / maxGuestsPerRoom);

    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    const amount = listing.price * nights * roomsRequired;

    const booking = await Booking.create({
      user: req.user._id,
      listing: listingId,
      checkIn,
      checkOut,
      guests,
      roomsBooked: roomsRequired,
      nights,
      amount,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentStatus: "paid"
    });

    await Listing.findByIdAndUpdate(listingId, {
      $push: { bookings: booking._id }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
