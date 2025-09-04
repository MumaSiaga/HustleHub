const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, enum: ["Fashion & Apparel", "Electronics", "Home & Garden", "Arts & Crafts", "Other"], required: true },
  condition: { type: String, enum: ["New", "Used - Like New", "Used - Good", "Used - Fair"], required: true },
  imageUrl: { type: String, default: "https://via.placeholder.com/300" },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);
