const mongoose = require("mongoose");
const User = require("./User");

const ratingSchema = mongoose.Schema({
  userId: { type: mongoose.ObjectId, ref: User },
  grade: { type: Number },
});

const bookSchema = mongoose.Schema({
  userId: { type: mongoose.ObjectId, ref: User },
  title: { type: String, required: true },
  author: { type: String },
  imageUrl: { type: String },
  year: { type: Number },
  genre: { type: String },
  ratings: [ratingSchema],
  averageRating: { type: Number },
});

module.exports = mongoose.model("Book", bookSchema);
