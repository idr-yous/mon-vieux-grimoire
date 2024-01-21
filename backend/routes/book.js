const express = require("express");
const router = express.Router();
const bookCtrl = require("../controllers/book");
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer-config");

router.get("/books", bookCtrl.findAllBooks);
router.get("/books/bestrating", bookCtrl.findTopBooks);
router.get("/books/:id", bookCtrl.findBook);
router.post("/books", auth, multer, bookCtrl.createBook);
router.put("/books/:id", auth, multer, bookCtrl.editBook);
router.delete("/books/:id", auth, bookCtrl.deleteBook);
router.post("/books/:id/rating", auth, bookCtrl.edtiRating);

module.exports = router;
