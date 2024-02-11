const mongoose = require ('mongoose');

const cartSchema = new mongoose.Schema({


    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    item:[{
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    quantity:{
      type:Number
    },
    price:{
        type:Number
    },
    totalPrice:{
        type:Number,
        default:0
     }
    }],
    totalCartPrice:{
        type:Number,
        default:0
     },
     discountAmount:{
        type:Number,
        default:0
     }
});

module.exports = mongoose.model('Cart',cartSchema);