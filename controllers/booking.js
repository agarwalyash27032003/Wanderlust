const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.confirmBooking = async (req, res) => {
  const {
    listingId,
    checkIn,
    checkOut,
    guests,
    paymentId,
    orderId
  } = req.body;

  // Safety check
  if (!listingId || !paymentId) {
    req.flash("error", "Payment verification failed");
    return res.redirect("/listings");
  }

  // Create booking
  const booking = await Booking.create({
    user: req.user._id,
    listing: listingId,
    checkIn,
    checkOut,
    guests,
    paymentId,
    orderId
  });

  // Attach booking to listing
  await Listing.findByIdAndUpdate(listingId, {
    $push: { bookings: booking._id }
  });

  req.flash("success", "Payment successful! Booking confirmed 🎉");
  res.redirect("/my-bookings");
};