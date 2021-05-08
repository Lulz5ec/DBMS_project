const { intersection } = require("lodash");
var mongoose = require("mongoose");

// SCHEME SETUP
var medicineSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  imageId: String,
  description: String,
  quantity: Number,
  tags: [],
  createdAt: { type: Date, default: Date.now },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  rateAvg: Number,
  rateCount: Number,
  hasRated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

module.exports = mongoose.model("Medicine", medicineSchema);
