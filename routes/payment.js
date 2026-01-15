const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");

// Creating Razorpay Order
router.post("/create-order", isLoggedIn, async (req, res) => {

  try {
    const { listingId, checkIn, checkOut } = req.body;
    const nights = ((new Date(checkOut) - new Date(checkIn)) / (1000 * 24 * 60 * 60));
    console.log(nights);

    const listing = await Listing.findById(listingId);
    if (!listing || !listing.approval_status) {
      return res.status(404).json({ error: "Listing not available" });
    }

    const order = await razorpay.orders.create({
      amount: listing.price * nights * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    res.json(order);

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});


// Payment Verification and Creating Order
router.post("/verify", isLoggedIn, async (req, res) => {
  try {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId, checkIn, checkOut, guests } = req.body;

    //Signature verification 

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Date validation 

    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ success: false, message: "Invalid dates" });
    }

    // Prevent overlapping bookings 

    const overlap = await Booking.findOne({ listing: listingId, checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } });

    if (overlap) {
      return res.status(400).json({ success: false, message: "Dates already booked" });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    //Create booking

    const nights = ((new Date(checkOut) - new Date(checkIn)) / (1000 * 24 * 60 * 60));
    console.log(nights);

    const booking = await Booking.create({ user: req.user._id, listing: listingId, checkIn, checkOut, guests, orderId: razorpay_order_id, paymentId: razorpay_payment_id, amount: listing.price * nights });

    await Listing.findByIdAndUpdate(listingId, { $push: { bookings: booking._id } }); 
    await User.findByIdAndUpdate(req.user._id, { $push: { bookings: booking._id } }); 

    req.flash("success", "Payment successful! Booking confirmed 🎉"); 
    res.json({ success: true });

  } 
  catch (err) { 
    console.error("Verify payment error:", err); 
    res.status(500).json({ success: false, message: "Payment verification failed" }); 
  }
});

module.exports = router;