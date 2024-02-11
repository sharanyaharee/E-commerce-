const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    
    comment:{
        type: String,
    } ,
    returnDate:{
        type: Date
    },
});

const Return = mongoose.model('Return', returnRequestSchema);
module.exports = Return;
