var express = require("express");
var router = express.Router({ mergeParams: true });
var Medicine = require("../models/medicine");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// Comments new not in use
router.get("/new", middleware.isLoggedIn, function(req, res) {
  Medicine.findById(req.params.id, function(err, medicine) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { medicine: medicine });
    }
  });
});

// Comments create
router.post("/", middleware.isLoggedIn, function(req, res) {
  Medicine.findById(req.params.id, function(err, found) {
    if (err) {
      console.log(err);
    }
    var ratedArray = [];
    found.hasRated.forEach(function(rated) {
      ratedArray.push(String(rated));
    });
    if (ratedArray.includes(String(req.user._id))) {
      req.flash(
        "error",
        "You've already reviewed this campgroud, please edit your review instead."
      );
      res.redirect("/home/" + req.params.id);
    } else {
      Medicine.findById(req.params.id, function(err, medicine) {
        if (err) {
          console.log(err);
          res.redirect("/home");
        } else {
          var newComment = req.body.comment;
          Comment.create(newComment, function(err, comment) {
            if (err) {
              req.flash("error", "Something went wrong.");
              res.render("error");
            } else {
              // add username and id to comment
              comment.author.id = req.user._id;
              comment.author.username = req.user.username;
              medicine.hasRated.push(req.user._id);
              medicine.rateCount = medicine.comments.length;
              // save comment
              comment.save();
              medicine.comments.push(comment);
              medicine.save();
              req.flash("success", "Successfully added review!");
              res.redirect("/home/" + medicine._id);
            }
          });
        }
      });
    }
  });
});

// COMMENT EDIT ROUTE not in use
router.get(
  "/:comment_id/edit",
  middleware.isLoggedIn,
  middleware.checkCommentOwnership,
  function(req, res) {
    res.render("comments/edit", {
      medicine_id: req.params.id,
      comment: req.comment
    });
  }
);

// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
    err,
    updatedComment
  ) {
    if (err) {
      res.redirect("back");
    } else {
      req.flash("success", "Review updated!");
      res.redirect("/home/" + req.params.id);
    }
  });
});

// DESTROY COMMENT ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("back");
    } else {
      Medicine.findByIdAndUpdate(
        req.params.id,
        { $pull: { comments: { $in: [req.params.comment_id] } } },
        function(err) {
          if (err) {
            console.log(err);
          }
        }
      );
      Medicine.findByIdAndUpdate(
        req.params.id,
        { $pull: { hasRated: { $in: [req.user._id] } } },
        function(err) {
          if (err) {
            console.log(er);
          }
        }
      );
      req.flash("success", "Review deleted!");
      res.redirect("/home/" + req.params.id);
    }
  });
});

module.exports = router;
