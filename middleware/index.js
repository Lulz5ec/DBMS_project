var Medicine = require("../models/medicine");
var Comment = require("../models/comment");
var User = require("../models/user");
var middlewareObj = {};

middlewareObj.checkMedicineOwnership = function(req, res, next) {
  Medicine.findById(req.params.id, function(err, foundMedicine) {
    if (err || !foundMedicine) {
      req.flash("error", "Sorry, that Medicine does not exist!");
      res.redirect("/home");
    } else if (
      // foundMedicine.author.id.equals(req.user._id) ||
      req.user.admin || req.user.username == "admin"
    ) {
      req.medicine = foundMedicine;
      next();
    } else {
      req.flash("error", "You don't have permission to do that!");
      res.redirect("/home/" + req.params.id);
    }
  });
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
  Comment.findById(req.params.comment_id, function(err, foundComment) {
    if (err || !foundComment) {
      req.flash("error", "Sorry, that comment does not exist!");
      res.redirect("/home");
    } else if (
      foundComment.author.id.equals(req.user._id) ||
      req.user.admin
    ) {
      req.comment = foundComment;
      next();
    } else {
      req.flash("error", "You don't have permission to do that!");
      res.redirect("/home/" + req.params.id);
    }
  });
};

middlewareObj.checkProfileOwnership = function(req, res, next) {
  User.findById(req.params.user_id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "Sorry, that user doesn't exist");
      res.redirect("/home");
    } else if (foundUser._id.equals(req.user._id) || req.user.admin) {
      req.user = foundUser;
      next();
    } else {
      req.flash("error", "You don't have permission to do that!");
      res.redirect("/home/" + req.params.user_id);
    }
  });
};

middlewareObj.isValid = function(req, res, next) {
  User.findById(req.user._id, function(err, foundUser) {
    if (err || !foundUser) {
      console.log(err);
    } else {
      var flag = 0;
      foundUser.items.forEach(function (tempitem) {
        Medicine.findById(tempitem.idMedicine, async function(err, medicine) {
            if(medicine.quantity < tempitem.quantity){
                req.flash("error", medicine.name + " has less Quantity avaliable");
                flag = 1;
                res.redirect("/home");
            }
        });
      });
      if(flag == 0){
        next();
      }      
    }
  });
};

middlewareObj.checkAdmin = function(req, res, next) {
  User.findById(req.params.user_id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "Sorry, that user doesn't exist");
      res.redirect("/home");
    } else if (req.user.admin) {
      req.user = foundUser;
      console.log("k");
      next();
    } else {
      req.flash("error", "You don't have permission to do that! Only Admins!");
      res.redirect("/home/" + req.params.user_id);
    }
  });
};

middlewareObj.isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to do that!");
  res.redirect("/login");
};

module.exports = middlewareObj;
