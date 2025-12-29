const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js")
const upload = multer({ storage });

// On GET Request, goes to listing.js in Controllers and the index function, and calls it
router.route("/")
    .get(wrapAsync (listingController.index))
    .post(isLoggedIn, upload.single("listing[image]"),validateListing, wrapAsync(listingController.createListing))
    
router.get("/new", isLoggedIn, listingController.renderForm);

router.route("/:id")
    .get(wrapAsync (listingController.showListing))
    .put(isLoggedIn, isOwner, upload.single("listing[image]"),validateListing, wrapAsync (listingController.editListing))
    .delete(isLoggedIn, isOwner,wrapAsync (listingController.deleteListing))

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner,wrapAsync (listingController.editForm));

module.exports = router;

// Route: GET /listings/:id/bookings/booked-dates
router.get("/:id/bookings/booked-dates", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("bookings");
    const bookedDates = [];

    for (const booking of listing.bookings) {
      let current = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      while (current <= end) {
        bookedDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    res.json({ bookedDates });
  } catch (err) {
    console.error("Error fetching booked dates:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
