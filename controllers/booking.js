const Booking = require("../models/booking");
const razorpay = require("../utils/razorpay");

module.exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/my-bookings");
    }

    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized");
      return res.redirect("/my-bookings");
    }

    if (new Date() >= new Date(booking.checkIn)) {
      req.flash("error", "Booking already started. Refund not allowed.");
      return res.redirect("/my-bookings");
    }

    if (!booking.amount) {
      req.flash("error", "Refund amount missing. Contact support.");
      return res.redirect("/my-bookings");
    }

    let refund;
    try {
      refund = await razorpay.payments.refund(
        booking.paymentId,
        { amount: booking.amount * 100 }
      );
    } catch (err) {
      console.error("Razorpay refund error:", err);
      req.flash("error", "Refund failed. Try again later.");
      return res.redirect("/my-bookings");
    }

    booking.status = "cancelled";
    booking.refundStatus = "refunded";
    booking.refundId = refund.id;
    booking.cancelledAt = new Date();

    await booking.save();

    req.flash("success", "Booking cancelled & refund initiated 💸");
    res.redirect("/my-bookings");

  } catch (err) {
    console.error("Cancel booking crash:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/my-bookings");
  }
};
