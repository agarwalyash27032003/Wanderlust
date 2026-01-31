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
    console.log("\n=========== CREATE ORDER HIT ===========");
    console.log("RAW BODY:", req.body);

    const { listingId, checkIn, checkOut } = req.body;
    const guests = Number(req.body.guests);

    console.log("listingId:", listingId);
    console.log("checkIn:", checkIn);
    console.log("checkOut:", checkOut);
    console.log("guests (number):", guests);

    if (!listingId || !checkIn || !checkOut || !guests) {
      console.log("❌ Missing required booking fields");
      return res.status(400).json({ error: "Missing booking data" });
    }

    const listing = await Listing.findById(listingId);

    console.log("LISTING FOUND:", !!listing);
    if (listing) {
      console.log("listing.price:", listing.price);
      console.log("listing.maxGuests:", listing.maxGuests);
      console.log("listing.numOfRooms:", listing.numOfRooms);
      console.log("listing.approval_status:", listing.approval_status);
    }

    if (!listing || listing.approval_status !== "approved") {
      console.log("❌ Listing invalid or not approved");
      return res.status(404).json({ error: "Listing not available" });
    }

    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    console.log("NIGHTS:", nights);

    if (!nights || nights <= 0) {
      console.log("❌ Invalid nights calculation");
      return res.status(400).json({ error: "Invalid booking dates" });
    }

    const maxGuestsPerRoom = Number(listing.maxGuests) || 1;
    const totalRooms = Number(listing.numOfRooms) || 1;

    console.log("maxGuestsPerRoom:", maxGuestsPerRoom);
    console.log("totalRooms:", totalRooms);

    const roomsRequired = Math.ceil(guests / maxGuestsPerRoom);

    console.log("roomsRequired:", roomsRequired);

    if (!roomsRequired || roomsRequired > totalRooms) {
      console.log("❌ Not enough rooms");
      return res.status(400).json({ error: "Not enough rooms available" });
    }

    const totalAmount = Number(listing.price) * nights * roomsRequired;

    console.log("TOTAL AMOUNT:", totalAmount);

    if (!totalAmount || isNaN(totalAmount)) {
      console.log("💥 INVALID AMOUNT DETECTED");
      return res.status(500).json({ error: "Amount calculation failed" });
    }

    console.log("🟢 Creating Razorpay order...");

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    console.log("✅ Razorpay Order Created:", order.id);

    res.json(order);

  } catch (err) {
    console.error("🔥 CREATE ORDER CRASH:", err);
    res.status(500).json({ error: err.message });
  }
});



// Payment Verification and Creating Order
router.post("/verify", isLoggedIn, async (req, res) => {
  try {
    console.log("\n=========== VERIFY HIT ===========");
    console.log("BODY:", req.body);
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId, checkIn, checkOut, guests } = req.body;
    console.log("order_id:", razorpay_order_id);
    console.log("payment_id:", razorpay_payment_id);
    console.log("signature:", razorpay_signature);
    console.log("SECRET:", process.env.RAZORPAY_SECRET);

    //Signature verification 

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET).update(body).digest("hex");
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

    const maxGuestsPerRoom = listing.maxGuests;
    const totalRooms = listing.numOfRooms;

    // rooms required for this booking
    const roomsRequired = Math.ceil(guests / maxGuestsPerRoom);

    const overlappingBookings = await Booking.find({
      listing: listingId,
      paymentStatus: "paid",
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn }
    });

    let roomsAlreadyBooked = 0;
    overlappingBookings.forEach(b => {
      roomsAlreadyBooked += b.roomsBooked;
    });

    if (roomsAlreadyBooked + roomsRequired > totalRooms) {
      return res.status(400).json({
        success: false,
        message: "Not enough rooms available for selected dates"
      });
    }

    //Create booking

    const nights = ((new Date(checkOut) - new Date(checkIn)) / (1000 * 24 * 60 * 60));
    console.log(nights);

    const booking = await Booking.create({
      user: req.user._id,
      listing: listingId,
      checkIn,
      checkOut,
      guests,
      roomsBooked: roomsRequired,
      nights,
      amount: listing.price * nights * roomsRequired,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentStatus: "paid"
    });

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