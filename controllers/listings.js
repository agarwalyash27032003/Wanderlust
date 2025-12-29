const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError");
const User = require("../models/user.js");
const countries = require("countries-list");

module.exports.index = async (req, res) => {
    const { type, location } = req.query; // anything after /listing? here comes to req.query
    let query = {approval_status: true}; // By default, don’t filter anything. Show all listings.

    // "i" means Case-insensitive
    if (type) {
        query.property_type = new RegExp(`^${type}$`, "i"); // If user searches a property type
    }

    if (location) {
        query.$or = [
            { country: new RegExp(location, "i") },
            { location: new RegExp(location, "i") }
        ];
    }

    let listings = await Listing.find(query);

    // If location was searched and no listings were found
    if (location && listings.length === 0) {
        req.flash("error", "No listings found. Try a different location.");
        listings = await Listing.find({}); // Load all listings
    }

    res.render("listings/index.ejs", {
        listings,
        title: "WanderLust",
        location
    });
};



module.exports.renderForm = (req, res) => {
    const countryCodes = Object.keys(countries.countries);
    const countryNames = countryCodes.map(code => countries.countries[code].name).sort();
    res.render("listings/new.ejs", {listing: { amenities: [] }, countryNames, title: `Add New Property - Wanderlust` });
};

module.exports.createListing = async (req, res, next) => {
    // New listing is the new document created, and saves it to the listings collection
    const user = await User.findById(req.user._id);
    let url = req.file.path;
    let filename = req.file.filename;

    let newListing = new Listing(req.body.listing);
    newListing.latitude = req.body.listing.latitude;
    newListing.longitude = req.body.listing.longitude;
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    user.listings.push(newListing);

    await newListing.save();
    await user.save();
    
    req.flash("success", "Listing Sent for Approval!");
    res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner").populate({ path: "bookings", populate: { path: "user" } });

    if(!listing){
        req.flash("error", "Listing Not Found!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { now: Date.now(),listing, title: `${listing.title} - Wanderlust` });
};

// Getting the edit form
module.exports.editForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing Not Found!");
        return res.redirect("/listings");
    }
    let orgImage = listing.image.url;
    orgImage = orgImage.replace("/upload/", "/upload/h_300,w_250,c_fill/");

    res.render("listings/edit.ejs", {
        listing,
        orgImage,
        title: `Edit - ${listing.title}`
    });
};

// Editing the form
module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {
        ...req.body.listing,
        latitude: req.body.listing.latitude,
        longitude: req.body.listing.longitude
    });

    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing has been Updated!");
    res.redirect("/listings");
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing has been deleted!");
    res.redirect("/listings");
};

module.exports.newTPForm = (req, res) => {
    res.render("listings/newform.ejs", { title: `Add New Property - Wanderlust` });
};