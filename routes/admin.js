const express = require("express");
const router = express.Router({ mergeParams: true }); // Required to access :id
const ExpressError = require("../utils/ExpressError");
const User = require("../models/user.js");
const {isLoggedIn, isAdmin} = require("../middleware.js");
const adminController = require("../controllers/admin.js")
const wrapAsync = require("../utils/wrapAsync.js");

router.route("/pending-approvals")
    .get(isLoggedIn, isAdmin, wrapAsync (adminController.allPendingApprovals));

router.route("/:id")
    .get(isLoggedIn, isAdmin, wrapAsync (adminController.showListing))
    .put(isLoggedIn, isAdmin,wrapAsync (adminController.approvalStatus));

module.exports = router;