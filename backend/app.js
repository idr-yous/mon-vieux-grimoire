const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

const userRoutes = require("./routes/user");

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.aoqi19i.mongodb.net/?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use("/api/auth", userRoutes);

module.exports = app;
