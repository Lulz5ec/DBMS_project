const { Router } = require("express");
var express = require("express");
var router = express.Router();
var passport = require("passport");
require('dotenv').config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

// models
var User = require("../models/user");

// middleware
var middleware = require("../middleware");

// get login form
router.get("/", function(req, res) {
    if (req.user) {
      return res.redirect("/home");
    } else {
      res.render("login");
    }
});

// handle login logic
router.post(
    "/",
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/login",
      failureFlash: true
    }),
    function(req, res) {}
);

module.exports = router;