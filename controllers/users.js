const User = require("../models/user.js");
const Listing = require("../models/listing.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs",{ title: "Wanderlust" });
};

module.exports.signUpForm = async (req, res) => {
    try{
        let { username, email, password } = req.body;
        const newUser = new User({email, username});
        let registeredUser = await User.register(newUser, password);
        // console.log(registeredUser);
        req.login(registeredUser, (err) => { // This will automatically login the user after sign up. Once we signup, we are logged in automatically
            if(err){
                return next(err);
            }
            req.flash("success", `Welcome @${username}`);
            res.redirect("/listings");
        });
    } catch(err){
        req.flash("success", `Username already exists. Try Again!`);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs",{ title: "Wanderlust" });
};

module.exports.loginForm = async(req, res) => {
    // console.log(req);
    req.flash("success", `Welcome back`);
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err)
            return next(err);
        req.flash("success", "Successfully logged out!");
        res.redirect("/listings");
    })
};

// GET my profile
module.exports.myProfile = (req, res) => {
    const user = req.user;
    let proImage = user.profileImage.url;
    if (proImage) {
        proImage = proImage.replace("/upload/", "/upload/h_300,w_250,c_fill/");
    } else {
        proImage = "https://res.cloudinary.com/dxk7cwat3/image/upload/v1751459385/Default-Profile-Picture-Download-PNG-Image_jihzx4.png";
    }
    res.render("users/myprofile.ejs", { title: "Wanderlust", user, proImage });
}

module.exports.myProfileEdit = async (req, res) => {
    const id = req.user._id;
    const updateData = { ...req.body.user };

    if (req.file) {
        updateData.profileImage = {
            url: req.file.path,
            filename: req.file.filename
        };
    }
    await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });

    req.flash("success", "Profile has been updated!");
    res.redirect("/my-profile");
};

module.exports.myListing = async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "listings",
        match: { approval_status: true }
    });
    res.render("users/mylistings.ejs", { title: "Wanderlust", user });
}

module.exports.myBooking = async (req, res) => {
    const user = await User.findById(req.user._id).populate({path: "bookings",populate: {path: "listing"}});
    res.render("users/mybookings.ejs", { title: "Wanderlust", user });
}