const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking");
const { isLoggedIn } = require("../middleware");

router.delete("/:id/cancel", isLoggedIn, bookingController.cancelBooking);

module.exports = router;
