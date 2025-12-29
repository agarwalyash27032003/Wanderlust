if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dbUrl = process.env.ATLASDB_URL;
const path = require("path");
const methodOverride = require("method-override");
app.use(express.static(path.join(__dirname, "/public")));
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const razorpay = require("razorpay"); 

// Sessions
const session = require("express-session");
const MongoStore = require('connect-mongo');

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter:24 * 3600
});

store.on("error", function (err) {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());


// Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"/views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const Review = require("./models/review.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");
const adminRouter = require("./routes/admin.js");

main().then(() => {
    console.log("Database successful");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listingRouter); // Every route defined in listingRouter will be prefixed with /listings.
app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings/:id/bookings", bookingRouter);
app.use("/", userRouter);
app.use("/admin/listings", adminRouter);

app.all("/{*any}", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!")); 
});

app.use((err, req, res, next) => {
    let{statusCode = 500, message} = err;
    res.status(statusCode).render("error.ejs", { message, title: "Error - WanderLust" });
});

app.listen(8080, () => {
    console.log("Server is listening");
});