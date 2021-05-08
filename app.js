const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
require('dotenv').config();

//models
const User = require("./models/user");

const registerRoutes = require('./routes/register.js'); 
const loginRoutes = require('./routes/login.js'); 
const userRoutes = require('./routes/user.js');
const homeRoutes = require('./routes/home.js');
const indexRoutes = require('./routes/index.js');
const commentRoutes = require("./routes/comments");
const cartRoutes = require("./routes/cart");
const tempRoutes = require("./routes/temp");

const app = express();

// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.use(
    require("express-session")({
      secret: "shibas are the best dogs in the world.",
      resave: false,
      saveUninitialized: false
    })
);
app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use('/', indexRoutes);
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/user', userRoutes);
app.use('/home', homeRoutes);
app.use('/home/:id/comments', commentRoutes);
app.use('/user/:id/cart', cartRoutes);
app.use('/temp', tempRoutes);

const connectionUrl = 'mongodb://127.0.0.1:27017/medStore';

const PORT = process.env.PORT || 3000;

mongoose.connect(connectionUrl, { useNewUrlParser : true, useUnifiedTopology: true })
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((err) => console.log(err.message));

mongoose.set('useFindAndModify', false);