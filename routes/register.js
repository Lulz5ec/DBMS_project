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

// show register form
router.get("/", function(req, res) {
    if (req.user) {
      return res.redirect("/home");
    } else {
      res.render("register");
    }
});

// handle sign up logic
router.post("/", upload.single("image"), async (req, res) => {
    try {
        if (req.file === undefined) {
            var newUser = new User({
              username: req.body.username,
              email: req.body.email,
              phone: req.body.phone,
              fullName: req.body.fullName,
              image: "",
              imageId: ""
            });
            User.register(newUser, req.body.password, function(err, user) {
              if (err) {
                return res.render("register", {
                  error: err.message
                });
              }
              passport.authenticate("local")(req, res, function() {
                res.redirect("/home");
              });
            });
          } else {
                await cloudinary.uploader.upload(
                    req.file.path, {
                    width: 400,
                    height: 400,
                    gravity: "center",
                    crop: "scale"
                },
              function(err, result) {
                if (err) {
                  req.flash("error", err.messsage);
                  return res.redirect("back");
                }
                req.body.image = result.secure_url;
                req.body.imageId = result.public_id;
                var newUser = new User({
                  username: req.body.username,
                  email: req.body.email,
                  phone: req.body.phone,
                  fullName: req.body.fullName,
                  image: req.body.image,
                  imageId: req.body.imageId
                });
                User.register(newUser, req.body.password, function(err, user) {
                  if (err) {
                    return res.render("register", {
                      error: err.message
                    });
                  }
                  passport.authenticate("local")(req, res, function() {
                    res.redirect("/home");
                  });
                });
              }, {
                moderation: "webpurify"
              }
            );
          }
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;