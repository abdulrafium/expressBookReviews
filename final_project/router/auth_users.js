const express = require('express');

const jwt = require('jsonwebtoken');

let books = require("./booksdb.js");

const regd_users = express.Router();

let users = [];

// Check whether username already exists
const isValid = (username) => {
  return users.some(user => user.username === username);
};

// Check username and password
const authenticatedUser = (username, password) => {
  return users.some(
    user => user.username === username && user.password === password
  );
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    { username: username },
    "fingerprint_customer",
    { expiresIn: "1h" }
  );

  return res.status(200).json({
    message: "Login successful",
    token: token
  });
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header missing"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token missing"
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, "fingerprint_customer");
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  const isbn = req.params.isbn;
  const username = decoded.username;
  const review = req.body.review;

  if (!books[isbn]) {
    return res.status(404).json({
      message: "Book not found"
    });
  }

  if (!review) {
    return res.status(400).json({
      message: "Review is required"
    });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: "Review added successfully",
    reviews: books[isbn].reviews
  });
});


regd_users.delete("/auth/review/:isbn", (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header missing"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token missing"
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, "fingerprint_customer");
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  const isbn = req.params.isbn;
  const username = decoded.username;

  if (!books[isbn]) {
    return res.status(404).json({
      message: "Book not found"
    });
  }

  if (!books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({
      message: "Review not found"
    });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: "Review deleted successfully",
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;

module.exports.isValid = isValid;

module.exports.users = users;
