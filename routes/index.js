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

// landing page
router.get("/", function(req, res) {
    if (req.user) {
      return res.redirect("/home");
    } else {
      res.render("landing");
    }
});

// about page
router.get("/about", function(req, res) {
    res.render("about");
});

// logout route
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/home");
});

module.exports = router;