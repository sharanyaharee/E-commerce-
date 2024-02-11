const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  productImages: [
    {
      type: String,
      required: true,
    },
  ],
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  blocked: {
    type: Boolean,
    default: false, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  onOffer: {
    type: Boolean,
    default: false
},
rateOfDiscount: {
    type: Number,
    default: 0
},
offerPrice: {
    type: Number,
    default: 0
}
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;