const { Router } = require("express");
var express = require("express");
var router = express.Router();
var passport = require("passport");
require('dotenv').config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
var Fuse = require("fuse.js");

// models
var User = require("../models/user");

// middleware
var middleware = require("../middleware");

// show all users
router.get(
  "/all",
  middleware.isLoggedIn,
  // middleware.checkProfileOwnership,
  // middleware.checkAdmin,
  function(req, res) {
    var noMatch = null;
    if (req.query.search) {
      User.find({}, function(err, allUsers) {
        if (err) {
          console.log(err);
        } else {
          var options = {
            shouldSort: true,
            threshold: 0.5,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 2,
            keys: ["fullName", "username"]
          };
          var fuse = new Fuse(allUsers, options);
          var result = fuse.search(req.query.search);
          if (result.length < 1) {
            noMatch = req.query.search;
          }
          res.render("users/all", {
            users: result,
            noMatch: noMatch
          });
        }
      });
    } else {
      User.find({}, function(err, allUsers) {
        if (err) {
          console.log(err);
        } else {
          res.render("users/all", {
            users: allUsers,
            noMatch: noMatch
          });
        }
      });
    }
  }
);

// user profile
router.get("/:user_id", function(req, res) {
    User.findById(req.params.user_id, function(err, foundUser) {
      if (err || !foundUser) {
        req.flash("error", "This user doesn't exist");
        return res.render("error");
      }
      else {
        res.render("users/show", {
            user: foundUser
          });
      }
    });
});
  
// edit profile
router.get(
    "/:user_id/edit",
    middleware.isLoggedIn,
    middleware.checkProfileOwnership,
    function(req, res) {
      res.render("users/edit", {
        user: req.user
      });
    }
);
  
// update profile
router.put(
    "/:user_id",
    upload.single("image"),
    middleware.checkProfileOwnership,
    function(req, res) {
      User.findById(req.params.user_id, async function(err, user) {
        if (err) {
          req.flash("error", err.message);
        } else {
          if (req.file) {
            try {
              await cloudinary.uploader.destroy(user.imageId);
              var result = await cloudinary.uploader.upload(req.file.path, {
                width: 400,
                height: 400,
                gravity: "center",
                crop: "scale"
              }, {
                moderation: "webpurify"
              });
              user.imageId = result.public_id;
              user.image = result.secure_url;
            } catch (err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
          }
          user.email = req.body.email;
          user.phone = req.body.phone;
          user.fullName = req.body.fullName;
          // user.admin = true;
          user.save();
          req.flash("success", "Updated your profile!");
          res.redirect("/user/" + req.params.user_id);
        }
      });
    }
);
  
// delete user
router.delete("/:user_id", middleware.checkProfileOwnership, function(
    req,
    res
  ) {
    User.findById(req.params.user_id, async function(err, user) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      if (user.image === "") {
        user.remove();
        res.redirect("/");
      } else {
        try {
          await cloudinary.uploader.destroy(user.imageId);
          user.remove();
          res.redirect("/");
        } catch (err) {
          if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
        }
      }
    });
});


module.exports = router;