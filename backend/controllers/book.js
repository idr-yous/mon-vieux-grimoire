const fs = require("fs").promises;
const path = require("path");
const Book = require("../models/Book");

exports.findAllBooks = (req, res, next) => {
  // get all books
  Book.find()
    .then((data) => res.status(200).json(data))
    .catch((error) => res.status(404).json({ error }));
};

exports.findBook = (req, res, next) => {
  // get target book by id
  Book.findOne({ _id: req.params.id })
    .then((data) => res.status(200).json(data))
    .catch((error) => res.status(404).json({ error }));
};

exports.findTopBooks = (req, res, next) => {
  // Using Mongoose aggregate to find the top 3 books by average rating
  Book.aggregate([
    {
      $sort: { averageRating: -1 }, // Sort by average rating in descending order
    },
    {
      $limit: 3, // Limit the result to 3 books
    },
  ])
    .then((data) => res.status(200).json(data))
    .catch((error) => res.status(404).json({ error }));
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);

  // check if image exists
  if (!req.file) {
    return res.status(422).send({
      message: "Must have an image !",
    });
  }

  // Replace the userId by auth token user id
  bookObject.userId = req.auth.userId;

  // Replace rating userId by auth token user id
  bookObject.ratings.forEach((rating) => {
    rating.userId = req.auth.userId;
  });

  // Save a new book
  const book = new Book({
    ...bookObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Book saved with success !" });
    })
    .catch((error) => {
      res.status(422).json({ error });
    });
};

exports.editBook = async (req, res, next) => {
  let bookObject;
  let newImageUrl;

  // Check request Content-Type
  if (req.is("json")) {
    // Request contains JSON data
    bookObject = req.body;
  } else if (req.is("multipart/form-data")) {
    // Request contains form data
    bookObject = JSON.parse(req.body.book);

    // Check if there's an uploaded file
    if (req.file) {
      newImageUrl = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    }
  } else {
    // Unsupported content type
    return res.status(422).send("Unsupported Content-Type");
  }

  // check if book belongs to current user
  if (
    !bookObject.hasOwnProperty("userId") ||
    bookObject.userId != req.auth.userId
  ) {
    return res
      .status(403)
      .json({ message: "You are not allowed to do this action !" });
  }

  try {
    // if new image get old imageUrl
    let oldImageUrl;
    if (newImageUrl) {
      const oldBook = await Book.findOne({ _id: req.params.id });
      oldImageUrl = oldBook.imageUrl;
    }

    // update target book
    await Book.updateOne(
      { _id: req.params.id },
      {
        _id: req.params.id,
        imageUrl: newImageUrl ? newImageUrl : undefined, // add new image url if exists
        ...bookObject,
      }
    );

    // if new image delete old from local storage
    if (oldImageUrl) {
      const imagePath = path.join(
        __dirname,
        "../images/",
        oldImageUrl.split("/images/")[1]
      );
      await fs.unlink(imagePath);
    }

    return res.status(200).json({ message: "Book updated with success !" });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    // Check if the book exists
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if the book belongs to the current user
    if (book.userId.toString() !== req.auth.userId) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this book" });
    }

    // Delete image from local storage
    if (book.imageUrl) {
      const imagePath = path.join(
        __dirname,
        "../images/",
        book.imageUrl.split("/images/")[1]
      );
      await fs.unlink(imagePath);
    }

    // Delete book by id
    await Book.deleteOne({ _id: req.params.id });

    return res.status(200).json({ message: "Book deleted with success!" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.edtiRating = async (req, res, next) => {
  const rating = req.body.rating;

  // get user id from auth token
  const userId = req.auth.userId;
  if (userId != req.body.userId) {
    return res
      .status(403)
      .json({ message: "You are not allowed to do this action !" });
  }

  try {
    // Find the book by ID
    const book = await Book.findOne({ _id: req.params.id });

    // Check if the book exists
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if the rating is between 0 and 5
    if (rating < 0 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating value must be between 0 and 5" });
    }

    // Check if the user has already rated the book
    const existingRating = book.ratings.find(
      (r) => r.userId.toString() === userId
    );

    if (existingRating) {
      console.log("existingRating");
      return res
        .status(400)
        .json({ message: "Cannot modify an existing rating" });
    }

    // Add the new rating to the book's ratings array
    book.ratings.push({ userId, grade: rating });

    // Recalculate the averageRating for the book
    const totalGrade = book.ratings.reduce(
      (sum, rating) => sum + rating.grade,
      0
    );
    book.averageRating = totalGrade / book.ratings.length;

    // Save the updated book
    await book.save();

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ error });
  }
};
