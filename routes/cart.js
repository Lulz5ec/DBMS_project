var express = require("express");
var router = express.Router({ mergeParams: true });
var Medicine = require("../models/medicine");
var Order = require("../models/order");
var User = require("../models/user");
var middleware = require("../middleware");
// const { delete } = require("./register");

// edit profile
router.get(
    "/",
    middleware.isLoggedIn,
    // middleware.checkProfileOwnership,
    function(req, res) {
        User.findById(req.user._id, function(err, foundUser) {
            if(err) {
                req.flash("error", "Something went wrong.");
                res.render("error");
            } else {
                var items = foundUser.items;
                var len = items;
                res.render("users/cart", {
                    items: items,
                    noMatch: len
                });
            }
        });
    }
);

// edit profile
router.get(
    "/payment",
    middleware.isLoggedIn,
    middleware.isValid,
    function(req, res) {
        User.findById(req.user._id,function(err, foundUser) {
            if(err) {
                req.flash("error", "Something went wrong.");
                res.render("error");
            } else {
                // foundUser.items.forEach(function (tempitem) {
                //     Medicine.findById(tempitem.idMedicine, async function(err, medicine) {
                //         if(medicine.quantity < tempitem.quantity){
                //             req.flash("error", medicine.name + "has less Quantity avaliable");
                //             res.redirect("/home");
                //         }
                //     });
                // });
                var items = foundUser.items;
                var len = items;
                var total = req.params.id;
                if(len==null || items.length == 0){
                    req.flash("error", "Your Cart is empty");
                    res.redirect("/home");
                } else {
                    res.render("payment", {
                        // items: items,
                        total: total
                    });
                }               
            }
        });
    }
);

router.post("/", middleware.isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            Medicine.findById(req.params.id, function(err, medicine) {
            if (err) {
                req.flash("error", "Something went wrong.");
                res.render("error");
            } else {
                var flag = 0;
                foundUser.items.forEach(function (searchItem) {
                if(searchItem.idMedicine == req.params.id && req.body.item.quantity <= medicine.quantity){
                    searchItem.quantity = req.body.item.quantity;
                    foundUser.save();
                    flag = 1;
                    req.flash("success", "Successfully added to Cart!");
                    res.redirect("/home/" + req.params.id);
                    };
                });
                if(flag==0){
                    var newitem = req.body.item;
                    newitem.idMedicine = req.params.id;
                    if (newitem.quantity <= medicine.quantity) {
                        newitem.nameOfMedicine = medicine.name;
                        newitem.imageId = medicine.image;
                        newitem.price = medicine.price;
                        newitem.quantity = req.body.item.quantity;
                        foundUser.items.push(newitem);
                        foundUser.save();
                        req.flash("success", "Successfully added to Cart!");
                        res.redirect("/home/" + req.params.id);
                    } else {
                        req.flash("error", "please put valid Quantity");
                        res.redirect("/home/" + req.params.id);
                    }
                }
            }
            });
        }
    });
});

router.post("/delete", middleware.isLoggedIn, function (req, res) {
   User.findById(req.user._id, function(err, foundUser) {
       if (err) {
            console.log(err);
       } else {
            const idToRemove = req.params.id;
            const filterArray = foundUser.items.filter((item) => item.id !== idToRemove);
            foundUser.items = filterArray;
            foundUser.save();
            res.redirect("/user/" + req.user._id + "/cart");
       }
   }); 
});

router.post("/order", middleware.isLoggedIn, function (req, res) {
    User.findById(req.user._id, function(err, foundUser) {
        if (err) {
             console.log(err);
        } else {
             var items = foundUser.items;
             var newOrder = new Order({
                 totalPayment: req.params.id,
                 items: items
             });
             newOrder.author.id = req.user._id;
             newOrder.author.name = foundUser.fullName;
             Order.create(newOrder, function(err, order) {
                if (err) {
                    req.flash("error", err.message);
                    return res.render("error");
                }                
                foundUser.items.forEach(function (tempitem) {

                    Medicine.findById(tempitem.idMedicine, function(err, medicine) {
                        medicine.quantity = medicine.quantity - tempitem.quantity;
                        medicine.save();
                    });
                    const idToRemove = tempitem.id;
                    const filterArray = foundUser.items.filter((item) => item.id !== idToRemove);
                    foundUser.items = filterArray;
                    foundUser.save();
                });
                req.flash("success", "Successful Payment! check email for recipt");
                res.redirect("/home");
             });
        }
    }); 
});

module.exports = router;