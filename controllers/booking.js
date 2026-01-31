const crypto = require("crypto");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");

module.exports.confirmBooking = async (req, res) => {
  try {
    const {
      listingId,
      checkIn,
      checkOut,
      guests,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    // Safety checks
    if (!listingId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      req.flash("error", "Payment verification failed");
      return res.redirect("/listings");
    }

    /* ========== VERIFY RAZORPAY SIGNATURE ========== */

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      req.flash("error", "Payment verification failed");
      return res.redirect("/listings");
    }

    /* ========== PREVENT DOUBLE BOOKING ========== */

    const overlapping = await Booking.findOne({
      listing: listingId,
      $or: [
        { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
      ]
    });

    if (overlapping) {
      req.flash("error", "Selected dates are already booked");
      return res.redirect(`/listings/${listingId}`);
    }

    /* ========== CREATE BOOKING ========== */

    const booking = await Booking.create({
      user: req.user._id,
      listing: listingId,
      checkIn,
      checkOut,
      guests,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    /* ========== ATTACH TO LISTING + USER ========== */

    await Listing.findByIdAndUpdate(listingId, {
      $push: { bookings: booking._id }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id }
    });

    req.flash("success", "Payment successful! Booking confirmed 🎉");
    res.redirect("/my-bookings");

  } catch (err) {
    console.error("Booking confirmation error:", err);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/listings");
  }
};
