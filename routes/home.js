var express = require("express");
var router = express.Router();
var middleware = require("../middleware");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
var Fuse = require("fuse.js");

// models
const Medicine = require("../models/medicine");
const Comment = require("../models/comment");
// const Cart = require("../models/cart");
var User = require("../models/user");
const { forEach } = require("lodash");

// INDEX - show all Medicines
router.get("/", function(req, res) {
    var noMatch = null;
    if (req.query.search) {
      Medicine.find({}, function(err, allMedicines) {
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
            keys: ["name", "description"]
          };
          var fuse = new Fuse(allMedicines, options);
          var result = fuse.search(req.query.search);
          if (result.length < 1) {
            noMatch = req.query.search;
          }
          res.render("home/index", {
            medicines: result,
            noMatch: noMatch
          });
        }
      });
    } else if (req.query.sortby) {
      if (req.query.sortby === "rateAvg") {
        Medicine.find({})
          .sort({
            rateCount: -1,
            rateAvg: -1
          })
          .exec(function(err, allMedicines) {
            if (err) {
              console.log(err);
            } else {
              res.render("home/index", {
                medicines: allMedicines,
                currentUser: req.user,
                noMatch: noMatch
              });
            }
          });
      } else if (req.query.sortby === "rateCount") {
        Medicine.find({})
          .sort({
            rateCount: -1
          })
          .exec(function(err, allMedicines) {
            if (err) {
              console.log(err);
            } else {
              res.render("home/index", {
                medicines: allMedicines,
                currentUser: req.user,
                noMatch: noMatch
              });
            }
          });
      } else if (req.query.sortby === "priceLow") {
        Medicine.find({})
          .sort({
            price: 1,
            rateAvg: -1
          })
          .exec(function(err, allMedicines) {
            if (err) {
              console.log(err);
            } else {
              res.render("home/index", {
                medicines: allMedicines,
                currentUser: req.user,
                noMatch: noMatch
              });
            }
          });
      } else {
        Medicine.find({})
          .sort({
            price: -1,
            rateAvg: -1
          })
          .exec(function(err, allMedicines) {
            if (err) {
              console.log(err);
            } else {
              res.render("home/index", {
                medicines: allMedicines,
                currentUser: req.user,
                noMatch: noMatch
              });
            }
          });
      }
    } else {
      Medicine.find({}, function(err, allMedicines) {
        if (err) {
          console.log(err);
        } else {
          res.render("home/index", {
            medicines: allMedicines,
            currentUser: req.user,
            noMatch: noMatch
          });
        }
      });
    }
});

// CREATE - add new Medicine to db
router.post("/", middleware.isLoggedIn, upload.single("image"), async function(
    req,
    res
  ) {
    await cloudinary.uploader.upload(
      req.file.path,
      {
        width: 1500,
        height: 1000,
        crop: "scale"
      },
      function(err, result) {
        if (err) {
          req.flash("error", err.message);
          return res.render("error");
        }
        req.body.medicine.image = result.secure_url;
        req.body.medicine.imageId = result.public_id;
        req.body.medicine.tags = req.body.medicine.tags.split(",");
        Medicine.create(req.body.medicine, function(err, medicine) {
            if (err) {
                req.flash("error", err.message);
                return res.render("error");
            }
            res.redirect("/home");
        });
      },
      {
        moderation: "webpurify"
      }
    );
});
  
// NEW - show form to create new medicine
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("home/new");
});

// SHOW - shows more information about one medicine
router.get("/:id", function(req, res) {
    var tempQuantity = null;
    // User.findById(req.user._id, (err, user) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     user.items.forEach(function(founditem){
    //       Cart.findById(founditem.id, function(err, cart){
    //         if (err) {
    //           console.log(err);
    //         } else {
    //           if(cart.item && cart.item.id == req.params.id){
    //             tempQuantity = cart.quantity;
    //           } else {

    //           };
    //         }
    //       });
    //     })
    //   }
    // });
    Medicine.findById(req.params.id)
      .populate("comments")
      .exec(function(err, foundMedicine) {
        if (err || !foundMedicine) {
          console.log(err);
          req.flash("error", "Sorry, that Medicine does not exist!");
          return res.render("error");
        }
        var ratingsArray = [];
  
        foundMedicine.comments.forEach(function(rating) {
          ratingsArray.push(rating.rating);
        });
        if (ratingsArray.length === 0) {
          foundMedicine.rateAvg = 0;
        } else {
          var ratings = ratingsArray.reduce(function(total, rating) {
            return total + rating;
          });
          foundMedicine.rateAvg = ratings / foundMedicine.comments.length;
          foundMedicine.rateCount = foundMedicine.comments.length;
        }
        foundMedicine.save();
        res.render("home/show", {
          medicine: foundMedicine,
          tempQuantity: tempQuantity
        });
      });
});

// EDIT Medicine ROUTE
router.get(
  "/:id/edit",
  middleware.isLoggedIn,
  middleware.checkMedicineOwnership,//admin or not
  function(req, res) {
    res.render("home/edit", {
      medicine: req.medicine
    });
  }
);

// UPDATE Medicine ROUTE
router.put(
  "/:id",
  upload.single("image"),
  middleware.checkMedicineOwnership,//admin or not
  function(req, res) {
    req.body.medicine.tags = req.body.medicine.tags.split(",");
      Medicine.findByIdAndUpdate(
        req.params.id,
        req.body.medicine,
        async function(err, medicine) {
          if (err) {
            req.flash("error", err.message);
            res.redirect("back");
          } else {
            if (req.file) {
              try {
                await cloudinary.uploader.destroy(medicine.imageId);
                var result = await cloudinary.uploader.upload(
                  req.file.path,
                  {
                    width: 1500,
                    height: 1000,
                    crop: "scale"
                  },
                  {
                    moderation: "webpurify"
                  }
                );
                medicine.imageId = result.public_id;
                medicine.image = result.secure_url;
              } catch (err) {
                req.flash("error", err.message);
                return res.render("error");
              }
            }
            medicine.save();
            req.flash("success", "Successfully updated Medicine data!");
            res.redirect("/home/" + req.params.id);
          }
        }
      );
  }
);

// DESTROY Medicine ROUTE
router.delete("/:id", middleware.checkMedicineOwnership, function(req, res) {
  Medicine.findById(req.params.id, async function(err, medicine) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
      await cloudinary.uploader.destroy(medicine.imageId);
      medicine.remove();
      res.redirect("/home");
    } catch (err) {
      if (err) {
        req.flash("error", err.message);
        return res.render("error");
      }
    }
  });
});

module.exports = router;