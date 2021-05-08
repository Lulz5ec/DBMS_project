var mongoose = require("mongoose");

var orderSchema = new mongoose.Schema({
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: String
  },
  items: [ {
    idMedicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine"
    },
    nameOfMedicine: String,
    quantity: Number,
    price: Number
  } ],
  time: { type: Date, default: Date.now },
  totalPayment: Number
});

module.exports = mongoose.model("Order", orderSchema);
