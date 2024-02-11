const express = require("express");
const user_route = express();

const cartController = require("../controllers/cartController");
const userController = require("../controllers/userController");
const adminController = require('../controllers/adminController')
const block = require('../middlewares/isUserBlocked')
const auth = require('../middlewares/isLoggedIn')
const errorHandler = require('../middlewares/errorHandling')

user_route.get('/',userController.loadHome);
user_route.get('/userLogin',userController.fetchCategoriesMiddleware,auth.loggedOut ,userController.loadUserLogin);
user_route.post('/userLogin',userController.fetchCategoriesMiddleware,block.userBlocked,userController.loadHomePage);
user_route.get('/userSignup',userController.fetchCategoriesMiddleware,auth.loggedOut,userController.loadUserSignUp);
user_route.post('/userSignup',userController.fetchCategoriesMiddleware,userController.insertUser);
user_route.get('/userSignOut',userController.fetchCategoriesMiddleware,auth.loggedIn,userController.userSignOut);
 user_route.get('/shop/:catId?', userController.fetchCategoriesMiddleware, userController.getAllProducts);

user_route.get('/contact', userController.fetchCategoriesMiddleware, userController.contact);

user_route.get('/product/:productId', userController.fetchCategoriesMiddleware,userController.loadProductDetails);
user_route.post('/verifyOTP',userController.fetchCategoriesMiddleware, userController.verifyOTP);
user_route.post('/resendOTP',userController.fetchCategoriesMiddleware, userController.resendOTP);

user_route.get( "/addToCart/:id",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.addToCart);
user_route.get( "/cart",block.userBlocked,auth.loggedIn,  userController.fetchCategoriesMiddleware, cartController.loadCart);
user_route.get( "/addToWishlist/:id",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.addToWishlist);
user_route.get( "/wishlist",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.loadWishlist);
user_route.get( "/removeWishlist/:id",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.removeWishlist);
user_route.post('/incrementCart',auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.incrementCartItemQuantity);
user_route.post('/decrementCart',auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.decrementCartItemQuantity);
user_route.post( "/removeCart",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, cartController.removeCart);


user_route.get("/profile", auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.loadProfile);
user_route.get("/addAddress",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,  userController.loadAddAddress);
user_route.post("/addAddress",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,  userController.addAddress);
user_route.post('/deleteAddress/:addressId', auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.deleteAddress);
user_route.get('/editAddress/:addressId',auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.loadEditAddress);
user_route.post('/editAddress', auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,userController.saveEditedAddress);

user_route.get( "/checkout",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.checkout);
user_route.post( "/checkout",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.loadPaymentPage);
user_route.get( "/stockCheck",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.stockCheck);

user_route.get( "/placeOrder",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.placeOrder);
user_route.post( "/orderConfirmation",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.orderConfirmation);
user_route.get("/paymentSuccess", auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.paymentSuccess);


user_route.post("/deductWalletBalance", auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.deductWalletBalance);
user_route.post("/deductWalletBalanceForPartialPayment", auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.deductWalletBalanceForPartialPayment);
user_route.get("/walletHistory", auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.walletHistory);


user_route.get( "/orders",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.orderData);
user_route.get( "/orderDetails",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.orderDetails);
user_route.get( "/cancelOrder",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.cancelOrder);

user_route.post( "/returnOrder",auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.returnOrder);

user_route.get('/resetPassword', auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,userController.loadResetPassword);
user_route.post('/resetpassword', auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,userController.handleResetPassword);


user_route.get('/search/suggestions', userController.fetchCategoriesMiddleware, userController.searchSuggestions);
user_route.get('/search', userController.fetchCategoriesMiddleware, userController.search);

user_route.get('/forgotPassword', block.userBlocked, userController.fetchCategoriesMiddleware,userController.loadForgotPassword);
user_route.post('/forgotPassword', block.userBlocked, userController.fetchCategoriesMiddleware,userController.handleForgotPassword);
user_route.post('/forgotPassword/sendOTP', block.userBlocked, userController.fetchCategoriesMiddleware,userController.sendOTPtoForgotPassword);
user_route.post('/forgotPassword/verifyOTP', block.userBlocked, userController.fetchCategoriesMiddleware,userController.forgotPasswordVerifyHandler);

user_route.get('/editProfile',auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.loadEditProfile);
user_route.post('/editProfile', auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,userController.updateUserProfile);
user_route.post('/updateProfileImage', auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware,adminController.upload.single('profileImage'),userController.updateUserProfilePic);

user_route.post('/applyCoupon',auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.applyCoupon);
user_route.post('/validateCoupon',auth.loggedIn, block.userBlocked, userController.fetchCategoriesMiddleware, userController.validateCoupon);
user_route.use(errorHandler.userErrorHandler);
module.exports = user_route;
