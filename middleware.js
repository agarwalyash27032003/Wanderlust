const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { listingSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const { reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // If request expects JSON (fetch / API)
        if (req.headers.accept?.includes("application/json") || req.xhr) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Normal browser navigation
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You are not logged in!");
        return res.redirect("/login");
    }
    next();
};


module.exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        req.flash("error", "You do not have admin access");
        return res.redirect("/listings");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if(!listing.owner._id.equals(res.locals.currUser._id)) // Checks if the owner of listing is same as current user
    {
        req.flash("error", "You don't have access to edit");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if(!review.author._id.equals(res.locals.currUser._id)) // Checks if the author of review is same as current user
    {
        req.flash("error", "You don't have access to delete");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if(error){
        let erMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, erMsg);
    }else{
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if(error){
        let erMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, erMsg);
    }else{
        next();
    }
};

module.exports.createListing = async (req, res) => {
  const listing = new Listing(req.body.listing);

  listing.owner = req.user._id;
  listing.approval_status = false; // pending approval

  await listing.save();

  req.flash("success", "Your listing has been sent for approval.");
  res.redirect("/listings");
};
