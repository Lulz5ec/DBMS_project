var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  fullName: String,
  image: String,
  imageId: String,
  admin: Boolean,
  joined: { type: Date, default: Date.now },
  items: [ {
    idMedicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine"
    },
    nameOfMedicine: String,
    imageId: String,
    quantity: Number,
    price: Number
  }
  ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
