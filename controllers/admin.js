const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError");
const User = require("../models/user.js");

module.exports.allPendingApprovals = async (req, res) => {
    const listings = await Listing.find({"approval_status" : false}); // get all the listings

    res.render("admin/admin.ejs", {
        listings,
        title: "Wanderlust",
    });
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner").populate({ path: "bookings", populate: { path: "user" } });

    if(!listing){
        req.flash("error", "Listing Not Found!");
        return res.redirect("/admin/listings/pending-approval");
    }

    res.render("admin/show.ejs", {
        listing,
        title: "Wanderlust",
    });
};

module.exports.approvalStatus = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // approve or reject

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/admin/listings/pending-approvals");
    }

    if (action === "approve") {
        listing.approval_status = true;
        await listing.save();
        req.flash("success", "Listing approved successfully!");
    } 
    else if (action === "reject") {
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing rejected and deleted!");
    } 
    else {
        req.flash("error", "Invalid action");
    }

    res.redirect("/admin/listings/pending-approvals");
};
