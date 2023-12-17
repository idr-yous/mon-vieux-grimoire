const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, "Invalid email"],
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
