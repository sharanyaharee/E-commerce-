const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true
  },
  blocked: {
    type: Boolean,
    default: false, 
  },
  onDiscount: {
      type: Boolean,
      default: false
  },
  discountName: {
      type: String,
      default: 'Category Discount'
  },
  discountAmount: {
      type: Number,
      default: 0,
  }

});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;