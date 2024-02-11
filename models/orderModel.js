const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shippingInfo: {
      address: {
        type: Object,
      },
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
      
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          required: true,
        },
        status: {
          type: String,
          enum: ["processing", "shipped", "delivered","user_cancelled","admin_cancelled","return_requested", "return_approved", "return_rejected"],
          default: "processing",
        },
        
    statusDate: Date,
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "WALLET", "RAZORPAY"],
      default: "COD",
    },
    paidAt: Date,
    paymentInfo: {
      id: String,
      status: String,
    },
 
    shippingCharges: {
      type: Number,
      required: true,
      default:0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderDate: Date,
    
  },

  {
    timestamp: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
