require("dotenv").config();
const razorpayInstance = require("../config/razorpayConfig");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Wishlist = require("../models/wishlistModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Return = require("../models/returnModel");
const Banner = require("../models/bannerModel");
const WalletTransaction = require("../models/walletModel");
const bcrypt = require("bcrypt");
const adminMail = process.env.ADMIN_MAIL;
const PASS = process.env.pass;
const FROM_MAIL = process.env.FROM_MAIL;
const nodemailer = require("nodemailer");
const Cart = require("../models/cartModel");
const PDFDocument = require("pdfkit");

let msg = null;
let message = null;

const loadHome = async (req, res) => {
  try {
    const categories = await Category.find({ blocked: false });
    const bannerData = await Banner.find({ status: 0 });
    res.locals.categories = categories;
    const productsWithOffers = await Product.find({ onOffer: true });
    res.render("user/index", { categories, session: req.session,bannerData,productsWithOffers });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).render("user/index", { categories: [] });
  }
};
const contact = async (req, res) => {
  try {
    const categories = await Category.find({ blocked: false });

    res.locals.categories = categories;
    res.render("user/contact", { categories, session: req.session });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).render("user/index", { categories: [] });
  }
};

const loadHomePage = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("user/userLogin", {
      errorMessage: "Email and password are required",
      session: req.session,
    });
  }

  try {
    const user = await User.findOne({ email });

    if (user && user.blocked === true) {
      return res.render("user/userLogin", {
        errorMessage:
          "You are blocked from availing our service. Please contact us!",
        session: req.session,
      });
    }

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.render("user/userLogin", {
          errorMessage: "Invalid Password",
          session: req.session,
        });
      }

      const otp = generateOTP();
      const expiration = generateOTPExpiration();
      const otpData = { otp, expiration };

      req.session.userOTPData = otpData;
      req.session.save(async () => {
        await sendOTPByEmail(email, otpData, req, res);
        res.render("user/otpVerification", {
          email,
          message: " ",
          session: req.session,
        });
      });
    } else {
      return res.render("user/userLogin", {
        errorMessage: "Invalid credentials",
        session: req.session,
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).send("Internal Server Error");
  }
};

const loadUserLogin = async (req, res) => {
  try {
    const categories = await Category.find({ blocked: false });

    res.render("user/userLogin", { session: req.session, categories });
  } catch (error) {
    console.error("Error loading user login:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loadUserSignUp = async (req, res) => {
  message = req.query.message;
  const categories = await Category.find({ blocked: false });
  res.render("user/userSignup", { message, session: req.session, categories });
};

const generateOTP = () => {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const generateOTPExpiration = () => {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 1);
  return expiration;
};

const sendOTPByEmail = async (email, otpData, req, res) => {
  console.log(email)
  console.log(adminMail)
  console.log(FROM_MAIL)
  return new Promise((resolve, reject) => {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: adminMail,
          pass: PASS,
        },
      });

      const expirationTime = otpData.expiration.toLocaleString();
      const mailOptions = {
        from: FROM_MAIL,
        to: email,
        subject: "Your OTP for Login",
        html: `<p>Hi, Your One Time Password to Login is ${otpData.otp}. This OTP is valid until ${expirationTime}</p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          reject(error);
        } else {
          console.log("Email sent:", info.response);
          resolve();
        }
      });
    } catch (error) {
      console.error("Error sending email:", error);
      reject(error);
    }
  });
};

const verifyOTP = async (req, res) => {
  const { email, userInputOTP } = req.body;

  const otpData = req.session.userOTPData;

  if (!otpData) {
    return res.render("user/otpVerification", {
      email,
      message: "Invalid OTP data",
      session: req.session,
    });
  }
  const expectedOTP = otpData.otp;
  const expirationTime = new Date(otpData.expiration);
  if (userInputOTP === expectedOTP && new Date() < expirationTime) {
    const user = await User.findOne({ email });

    req.session.userData = user;

    req.session.save(() => {
      return res.redirect("/");
    });
  } else {
    res.render("user/otpVerification", {
      email,
      message: "Wrong OTP",
      session: req.session,
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = generateOTP();
    const expiration = generateOTPExpiration();
    const otpData = { otp, expiration };

    req.session.userOTPData = otpData;

    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res
          .status(500)
          .render("error", { message: "Error resending OTP" });
      }
      sendOTPByEmail(email, otpData, req, res);

      res.render("user/otpVerification", {
        email,
        message: "OTP Resent Successfully",
        session: req.session,
      });
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).render("error", { message: "Error resending OTP" });
  }
};

const userSignOut = async (req, res) => {
  try {
    req.session.userData = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

//Bcrypt
const securePassword = async (password) => {
  try {
    const passwordHash = bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, mobile } =
      req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !mobile
    ) {
      return res.render("user/userSignup", {
        message: "All fields are required!",
        session: req.session,
      });
    }

    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.render("user/userSignup", {
        message: "Email is already registered! Please Login",
        session: req.session,
      });
    }

    const existingUsernameUser = await User.findOne({ username });
    if (existingUsernameUser) {
      return res.render("user/userSignup", {
        message: "Username is already taken! Please Try some other!",
        session: req.session,
      });
    }

    const hashedPassword = await securePassword(password);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      mobile,
    });

    await newUser.save();
    req.session.userName = newUser.name;
    res.render("user/userSignup", {
      message: "Successfully Registered! Please Login Now!",
      session: req.session,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const fetchCategoriesMiddleware = async (req, res, next) => {
  try {
    const categories = await Category.find({ blocked: false });
    res.locals.categories = categories;
    next();
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
};

const searchSuggestions = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const regex = new RegExp(searchTerm, "i");

    const suggestions = await Product.aggregate([
      {
        $match: {
          $or: [
            { productName: { $regex: regex } },
            { description: { $regex: regex } },
          ],
          blocked: false,
        },
      },
      {
        $group: {
          _id: null,
          suggestions: { $addToSet: "$productName" },
        },
      },
      {
        $unwind: "$suggestions",
      },
      {
        $limit: 5,
      },
    ]);

    const uniqueSuggestions = suggestions.map((doc) => doc.suggestions);

    res.status(200).json(uniqueSuggestions);
  } catch (error) {
    console.error("Error in searchSuggestions route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const search = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const regex = new RegExp(searchTerm, "i");
    const sortOrder = req.query.sortOrder || "default";

    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const sortOptions =
      sortOrder === "lowToHigh"
        ? { price: 1 }
        : sortOrder === "highToLow"
        ? { price: -1 }
        : {};

    const searchResults = await Product.find({
      $or: [
        { productName: { $regex: regex } },
        { description: { $regex: regex } },
      ],
      blocked: false,
    })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const userId = req.session?.userData?._id;
    let user, cart, wishlist;

    if (userId) {
      user = await User.findOne({ _id: userId });
      cart = await Cart.findOne({ userId: userId });
      wishlist = await Wishlist.findOne({ userId: userId });
    } else {
      cart = { item: [] };
      wishlist = { products: [] };
    }

    const totalCount = await Product.countDocuments({
      $or: [
        { productName: { $regex: regex } },
        { description: { $regex: regex } },
      ],
      blocked: false,
    });

    const totalPages = Math.ceil(totalCount / limit);

    const categories = await Category.find({ blocked: false });

    res.render("user/shop.ejs", {
      products: searchResults,
      session: req.session,
      categories,
      wishlist,
      searchTerm,
      sortOrder,
      cart,
      catId: undefined,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error in search route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllProducts = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const sortOrder = req.query.sortOrder || "default";
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    let cart, wishlist;
    let products, totalCount, totalPages, catId;

    const searchTerm = req.query.term;

    if (req.params.catId) {
      catId = req.params.catId;
      if (searchTerm) {
        products = await sortProductsByPriceWithSearch(
          catId,
          searchTerm,
          sortOrder,
          skip,
          limit
        );
        totalCount = await countProducts(catId, searchTerm);
      } else {
        products = await sortProductsByPrice(catId, sortOrder, skip, limit);
        totalCount = await countProducts(catId);
      }
    } else {
      if (searchTerm) {
        products = await sortProductsByPriceWithSearch(
          null,
          searchTerm,
          sortOrder,
          skip,
          limit
        );
        totalCount = await countProducts(null, searchTerm);
      } else {
        products = await sortProductsByPrice(null, sortOrder, skip, limit);
        totalCount = await countProducts(null);
      }
    }

    totalPages = Math.ceil(totalCount / limit);

    if (userId) {
      cart = await Cart.findOne({ userId: userId });
      wishlist = await Wishlist.findOne({ userId: userId });
    }
    await Product.populate(products, { path: 'category', select: 'discountAmount onDiscount' });

    products.forEach(product => {
      if (product.category && product.category.onDiscount) {
        const discountAmount = product.category.discountAmount || 0;
        product.reducedPrice = product.price - discountAmount;
      } else {
        product.reducedPrice = null; 
      }
    });
  
    const categories = await Category.find({ blocked: false });

    res.render("user/shop", {
      products,
      session: req.session,
      categories,
      wishlist,
      cart,
      catId,
      searchTerm,
      sortOrder,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error loading products:", error);
    res.status(500).send("Internal Server Error");
  }
};

const sortProductsByPriceWithSearch = async (
  catId,
  searchTerm,
  sortOrder,
  skip,
  limit
) => {
  const baseQuery = catId
    ? { category: catId, blocked: false }
    : { blocked: false };

  const query = searchTerm
    ? { ...baseQuery, productName: { $regex: searchTerm, $options: "i" } }
    : baseQuery;

  const sortOptions =
    sortOrder === "lowToHigh"
      ? { price: 1 }
      : sortOrder === "highToLow"
      ? { price: -1 }
      : {};

  const sortedProducts = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate("category", "discountAmount");

  return sortedProducts;
};

// sorting
const sortProductsByPrice = async (catId, sortOrder, skip, limit) => {
  const query = catId
    ? { category: catId, blocked: false }
    : { blocked: false };

  const sortOptions =
    sortOrder === "lowToHigh"
      ? { price: 1 }
      : sortOrder === "highToLow"
      ? { price: -1 }
      : {};

  const sortedProducts = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate("category", "discountAmount");

  return sortedProducts;
};
const countProducts = async (catId) => {
  const query = catId
    ? { category: catId, blocked: false }
    : { blocked: false };
  const count = await Product.countDocuments(query);
  return count;
};

const loadProfile = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const addresses = await Address.find({ userId: userId });
    const userData = await User.findById(userId);
    res.render("user/profile", {
      userData,
      session: req.session,
      addresses,
    });
  } catch (error) {
    console.error("Error rendering profile.ejs:", error);
  }
};

const loadProductDetails = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    let user, cart, wishlist;

    if (userId) {
      user = await User.findOne({ _id: userId });
      cart = await Cart.findOne({ userId: userId });
      wishlist = await Wishlist.findOne({ userId: userId });
    }

    const productId = req.params.productId;
    const productDetails = await Product.findById(productId);

    if (!productDetails) {
      console.error(`Product not found for productId: ${productId}`);
      return res.status(404).send("Product not found");
    }

    const addedToWishlist = req.query.addedToWishlist === "true";

    const successMessage = addedToWishlist
      ? "Item added to wishlist"
      : "Item removed from wishlist";

    const relatedProducts = await Product.find({
      category: productDetails.category,
      _id: { $ne: productId },
    }).limit(4);

    res.render("user/productDetails", {
      user,
      session: req.session,
      productDetails,
      relatedProducts,
      wishlist,
      cart,
      errorMessage: successMessage,
      addedToWishlist: addedToWishlist,
    });
  } catch (error) {
    console.error("Error loading product Details:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const data = req.body;
    const returnUrl = req.query.returnUrl || "/profile";

    if (
      data.name &&
      data.city &&
      data.state &&
      data.district &&
      data.country &&
      data.postCode &&
      data.addressLine
    ) {
      const newAddress = new Address({
        userId: userId,
        name: data.name,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        postCode: data.postCode,
        country: data.country,
        district: data.district,
      });

      await newAddress.save();

      res.redirect(returnUrl);
    } else {
      res.redirect(returnUrl);
    }
  } catch (error) {
    console.log(error);
  }
};

const loadAddAddress = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const returnUrl = req.query.returnUrl || "/profile";

    const user = await User.findOne({ userId });
    res.render("user/addAddress", {
      userId,
      msg,
      message,
      returnUrl,
      session: req.session,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

const saveEditedAddress = async (req, res) => {
  try {
    const addressId = req.body.addressId;

    const updatedName = req.body.name;
    const updatedAddressLine = req.body.addressLine;
    const updatedCity = req.body.city;
    const updatedDistrict = req.body.district;
    const updatedCountry = req.body.country;
    const updatedPostCode = req.body.postCode;

    const updatedState = req.body.state;

    const updatedAddress = await Address.findByIdAndUpdate(
      { _id: addressId },
      {
        name: updatedName,
        addressLine: updatedAddressLine,
        city: updatedCity,
        district: updatedDistrict,
        country: updatedCountry,
        postCode: updatedPostCode,
        state: updatedState,
      },
      { new: true }
    );

    if (updatedAddress) {
      res.redirect("/profile");
    } else {
      res.render("user/editAddress", {
        message: "Failed to update the address. Please try again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    await Address.deleteOne({ _id: addressId });
    res.redirect("/profile");
  } catch (error) {
    console.error("Error deleting address:", error);

    res.redirect("/profile");
  }
};

const checkout = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
const totalCartPrice = req.query.totalCartPrice;
    const user = await User.findOne({ _id: userId });
    const cart = await Cart.findOne({ userId }).populate(
      "item.product",
      "productName"
    );
    const userAddresses = await Address.find({ userId });

    const currentDate = new Date();
    const expectedDeliveryDate = new Date(
      currentDate.getTime() + 5 * 24 * 60 * 60 * 1000
    );
    req.session.delivered_date = expectedDeliveryDate;
    res.render("user/checkout", {
      userId,
      msg,
      message,
      session: req.session,
      user,
      userAddresses,
      cart,
      expectedDeliveryDate,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const address = await Address.findById(addressId);

    const userId = req.session?.userData?._id;
    const user = await User.find({ userId });

    const categories = await Category.find({ blocked: false });

    res.render("user/editAddress", {
      address,
      userId,
      msg,
      message,
      session: req.session,
      user,
      categories,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadPaymentPage = async (req, res) => {
  try {
    console.log("i am here in checkout POST")
    const selectedAddress = req.body.selectedAddress; 
    const userId = req.session?.userData?._id;
    const addressDetails = await Address.findOne({ _id: selectedAddress });
   
    if (!selectedAddress) {
      console.log("No selectedAddress provided. Redirecting to /checkout");
      return res.redirect("/checkout");
    }
    const cart = await Cart.findOne({ userId })
    const totalAmount = cart.totalCartPrice

    req.session.userData.total = totalAmount;
    req.session.selectedAddress = addressDetails;
console.log(">>>>>>>totalAMount",totalAmount)
    const user = await User.findOne({ _id: userId });

    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).send("User not found");
    }

    res.render("user/paymentPage", {
      selectedAddress,
      totalAmount,
      session: req.session,
      userId,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const orderData = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const user = await User.findById(userId);

    const page = parseInt(req.query.page) || 1;
    const limit = 3;

    const totalOrders = await Order.countDocuments({ userId });

    const totalPages = Math.ceil(totalOrders / limit);

    const offset = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate({
        path: "shippingInfo.address",
        model: "Address",
      })
      .populate("orderItems.product")
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: totalPages,
    };

    res.render("user/orderPage", {
      orders,
      pagination,
      session: req.session,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

const orderDetails = async (req, res) => {
  try {
    const id = req.query.orderId;
    const productId = req.query.productId;
    const userId = req.session?.userData?._id;

    const orders = await Order.findOne({ _id: id, userId })
      .populate({
        path: "shippingInfo.address",
        model: "Address",
      })
      .populate("orderItems.product")
      .sort({ _id: -1 });
    const selectedProduct = orders.orderItems.find(
      (item) => item.product._id.toString() === productId
    );

    if (!selectedProduct) {
      return res.redirect("/orders");
    }
    const otherProducts = orders.orderItems.filter(
      (item) => item.product._id.toString() !== productId
    );

    res.render("user/orderDetailsPage", {
      orders,
      id,
      userId,
      session: req.session,
      productId,
      otherProducts,
      selectedProduct,
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const orderId = req.query.orderId;
    const orderItemId = req.query.orderItemId;
const total= req.session.userData.total
    const order = await Order.findOne({ _id: orderId });
    const orderItem = order.orderItems.find(
      (item) => item.product.toString() === orderItemId
    );

    if (!order || !orderItem) {
      return res.status(404).json({ error: "Order or item not found." });
    }

    if (order.paymentMethod === "COD") {
      orderItem.status = "user_cancelled";
      order.statusDate = new Date();
      await order.save();

      await Product.updateOne(
        { _id: orderItem.product },
        { $inc: { quantity: orderItem.quantity } }
      );

    } else {
      orderItem.status = "user_cancelled";
      order.statusDate = new Date();
      await order.save();

      await Product.updateOne(
        { _id: orderItem.product },
        { $inc: { quantity: orderItem.quantity } }
      );

      const refundAmount = order.totalAmount;
      const user = await User.findOneAndUpdate(
        { _id: userId },
        { $inc: { wallet: refundAmount } },
        { new: true }
      );
      await user.save();

      const walletTransaction = new WalletTransaction({
        user: userId,
        type: "credit",
        amount: refundAmount,
        reason: "Order cancellation refund",
      });
      await walletTransaction.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const returnOrder = async (req, res) => {
  const { orderId, productId, reason, comment } = req.body;

  const userId = req.session?.userData?._id;

  try {
    const returnDetails = {
      orderId: orderId,
      orderItemId: productId,
      userId: userId,
      reason: reason,
      comment: comment,
      returnDate: Date.now(),
    };
    await Return.create(returnDetails);

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    const orderItemIndex = order.orderItems.findIndex(
      (item) => item.product.toString() === productId.toString()
    );
    if (orderItemIndex !== -1) {
      order.orderItems[orderItemIndex].status = "return_requested";
      console.log("llllllllllllllllllllllll",order.orderItems[orderItemIndex].status)
      await order.save();
    } else {
      throw new Error("Order item not found in the order.");
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Return request submitted successfully.",
      });
  } catch (error) {
    console.error("Error processing return request:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process return request." });
  }
};

const sendOTPtoResetPassword = async (req, res) => {
  try {
    let email;
    if (req.session && req.session.userData && req.session.userData.email) {
      email = req.session.userData.email;
    } else {
      return res.status(400).render("error", { message: "Email not provided" });
    }

    const otp = generateOTP();
    const otpData = {
      otp,
      expiration: generateOTPExpiration(),
    };

    req.session.userOTPData = otpData;
    req.session.save(async (err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res
          .status(500)
          .render("error", { message: "Error sending OTP" });
      }

      await sendOTPByEmail(email, otpData, req, res);
      let errorMessage = "OTP has sent to your Email";
      res.render("user/resetPassword", {
        session: req.session,
        errorMessage,
        email,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};
const sendOTPtoForgotPassword = async (req, res) => {
  try {
    let email;
    if (req.body && req.body.email) {
      email = req.body.email;
    } else {
      return res.status(400).render("error", { message: "Email not provided" });
    }

    const otp = generateOTP();
    const otpData = {
      otp,
      expiration: generateOTPExpiration(),
    };

    req.session.userOTPData = otpData;
    req.session.save(async (err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res
          .status(500)
          .render("error", { message: "Error sending OTP" });
      }

      await sendOTPByEmail(email, otpData, req, res);
      let errorMessage = "OTP has sent to your Email";
      res.render("user/userPasswordReset", {
        session: req.session,
        errorMessage,
        email,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const loadResetPassword = async (req, res) => {
  try {
    let errorMessage = req.query.errorMessage || null;
   
    res.render("user/resetPassword", { session: req.session, errorMessage });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const handleResetPassword = async (req, res) => {
  try {
    let errorMessage;
    const { currentPassword,password, confirmPassword } = req.body;
    const user = await User.findById(req.session.userData._id);

    if (!user) {
      return res.status(404).send("User not found");
    }
  
if(user){
  const passwordMatch = await bcrypt.compare(currentPassword,user.password)
if(passwordMatch){
    if (password === confirmPassword) {
      const hashPassword = await securePassword(password);
      user.password = hashPassword;
      await user.save();
      req.session.userData = null;

      return res.render("user/userLogin", {
        errorMessage:
          "Password reset successfully. Please login with your updated password.",
        session: req.session,
      });
    }
    } else {
      errorMessage = "The entered Current password is wrong!";
      return res.render("user/resetPassword", {
        errorMessage,
        session: req.session,
      });
    }}
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    let errorMessage = null;
    res.render("user/forgotPassword", { session: req.session, errorMessage });
  } catch (error) {
    console.log(error);
  }
};

const handleForgotPassword = async (req, res) => {
  try {
    let errorMessage = null;
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      errorMessage = "This email is not registered with Us. Please Sign In!";
      return res.render("user/forgotPassword", {
        errorMessage,
        session: req.session,
        email,
      });
    }
    if (user) {
      errorMessage = "Click on GetOTP to reset your Password!";
      return res.render("user/userPasswordReset", {
        errorMessage,
        session: req.session,
        email,
      });
    }
  } catch (error) {
    console.error("Error in forgotPassword route:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const forgotPasswordVerifyHandler = async (req, res) => {
  try {
    let errorMessage;
    const userEnteredOTP = req.body.otp;
    const email = req.body.email;
    const storedOTP = req.session.userOTPData.otp;

    const otpData = req.session.userOTPData;
    const expirationTime = new Date(otpData.expiration);

    if (new Date() >= expirationTime) {
      errorMessage = "Invalid OTP or expired. Please try resending OTP.";
      return res.render("user/userPasswordReset", {
        errorMessage,
        session: req.session,
        email,
      });
    } else {
      if (userEnteredOTP !== storedOTP) {
        errorMessage = "Invalid OTP. Please try resending OTP.";
        return res.render("user/userPasswordReset", {
          errorMessage,
          session: req.session,
          email,
        });
      }
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }
    const { password, confirmPassword } = req.body;

    if (password === confirmPassword) {
      const hashPassword = await securePassword(password);
      user.password = hashPassword;
      await user.save();
      req.session.userData = null;

      return res.render("user/userLogin", {
        errorMessage:
          "Password reset successfully. Please login with your updated password.",
        session: req.session,
      });
    } else {
      errorMessage = "Password does not match!";
      return res.render("user/userPasswordReset", {
        errorMessage,
        session: req.session,
      });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const loadEditProfile = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const userData = await User.findById(userId);
    const addresses = await Address.find({ userId: userId }).populate("userId");

    res.render("user/editProfile", {
      userData,
      session: req.session,
      addresses,
    });
  } catch (error) {
    console.error("Error loading edit profile:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const addresses = await Address.find({ userId: userId });

    if (!userId) {
      return res.status(400).json({ error: "User ID not found in session" });
    }

    const { name, mobile } = req.body;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) {
      existingUser.name = name;
    }

    if (mobile) {
      existingUser.mobile = mobile;
    }

    await existingUser.save();
    const userData = await User.findById(userId);
    res.render("user/profile", { session: req.session, userData, addresses });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const updateUserProfilePic = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const addresses = await Address.find({ userId: userId });

    if (!userId) {
      return res.status(400).json({ error: "User ID not found in session" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No profile image provided" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: "/assets/uploads/" + req.file.filename },
      { new: true, runValidators: true }
    );
    res.render("user/profile", {
      session: req.session,
      userData: updatedUser,
      addresses,
    });
  } catch (error) {
    console.error("Error updating user profile picture:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const walletHistory = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const user = await User.findById(userId);

    const currentPage = parseInt(req.query.page) || 1;
    const rowsPerPage = 7; 
    const startIndex = (currentPage - 1) * rowsPerPage;
   

    const walletTransactions = await WalletTransaction.find({ user: userId })
      .sort({ updatedAt: -1 })
      .skip(startIndex)
      .limit(rowsPerPage);

    res.render("user/walletHistory.ejs", {
      session: req.session,
      walletTransactions: walletTransactions,
      wallet: req.session.userData?.wallet,
      currentPage: currentPage,
      user:user
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}
const placeOrder = async (req, res) => {
  try {
    console.log("im placing Order");
    const amount = req.query.amount;
    const paymentMethod = req.query.paymentMethod;
    console.log("i got amount and method", amount, paymentMethod)
    const userId = req.session?.userData?._id;
    const cart = await Cart.findOne({ userId }).populate("item.product");

    if (!(cart && cart.item && cart.item.length > 0)) {
      return res.status(400).json({ success: false, msg: "Cart is empty" });
    }

    let name = '';
    if (cart.item && cart.item.length > 0) {
      name = cart.item[0].product.productName;
    }

    let address = req.session.selectedAddress;

    const orderItems = cart.item.map((item) => ({
      product: item.product,
      price: item.price,
      quantity: item.quantity,
    }));

    const order = new Order({
      userId: userId,
      orderItems,
      shippingInfo: {
        address: address,
      },
      shippingCharges: req.session.shippingCharges,
      totalAmount: amount,
      itemPrice: orderItems.reduce((acc, item) => acc + item.price, 0),
      orderDate: new Date().toISOString(),
      paymentMethod,
    });

    await order.save();

    for (let i = 0; i < orderItems.length; i++) {
      const product = await Product.findById(orderItems[i].product);
      product.quantity -= orderItems[i].quantity;
      await product.save();
    }

    await Cart.deleteMany({ userId });

    console.log("i have done with placing order>>", paymentMethod);
    req.session.userData.total = null;
    req.session.total = null;
    const couponCode = req.session.userData?.couponCode;
    const coupon = await Coupon.findOne({ couponCode });
    if (coupon) {
      coupon.user.push(userId);
      await coupon.save();
    }
    const userData = await User.findOne({ _id: userId });
    const orders = await Order.findOne({ userId }).sort({ _id: -1 }).limit(1).populate("orderItems.product");

    if (paymentMethod === "RAZORPAY") {

    
      return res.redirect('/paymentSuccess');
    }

    return res.json({
      success: true,
      msg: "Order placed successfully",
      paymentMethod: paymentMethod,
      orders: orders,
      userId: userId,
      userData: userData,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const orderConfirmation = async (req, res) => {
  try {
    const amount = req.body.amount;
    const paymentMethod = req.body.flexRadioDefault;
    console.log("tottt", amount)
    console.log("tottt", paymentMethod)
      if (paymentMethod === "RAZORPAY") {
        console.log("i am creating instance");
        const name = req.session.userData.name;
        const email = req.session.userData.email;
        const options = {
          amount: amount * 100,
          currency: "INR",
          receipt: "sharanyaharee@gmail.com",
        };
        razorpayInstance.orders.create(options, (err, order) => {
          if (!err) {
            res.status(200).send({
              success: true,
              msg: "order created",
              order_id: order.id,
              amount: amount,
              key_id: razorpayInstance.key_id,
              name: name,
              email: email,
            });
          } else {
            res
              .status(400)
              .send({ success: false, msg: "SOmething went wrong!" });
          }
        });
        console.log("i have done with instance creation");
      }


      if (paymentMethod === "COD") {
        res.redirect(`/placeOrder?amount=${amount}&paymentMethod=${paymentMethod}`);
    }
    if(paymentMethod === "WALLET"){
      const userInfo = await User.findOne({ _id: req.session.userData?._id });
      console.log(userInfo)
      const walletBalance = userInfo.wallet;
      return res.json({
        success: true,
        paymentMethod,
        walletBalance,
        paymentAmount: req.session?.userData?.total,
      });
    }
    }catch (error) {
    console.log(error);
  }
};

const deductWalletBalanceForPartialPayment = async (req, res) => {
  try {
    console.log("i am  just deducting");
    const userId = req.session?.userData?._id;
    const { amount } = req.body;
    const userInfo = await User.findOne({ _id: userId });
    userInfo.wallet -= amount;
    await userInfo.save();

    const walletTransaction = new WalletTransaction({
      user: userId,
      type: "debit",
      amount,
      reason: "Partial payment",
    });

    await walletTransaction.save();

    return res.json({ success: true, userId: userId, wallet: userInfo.wallet });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
const deductWalletBalance = async (req, res) => {
  try {
    console.log("i am  deducting and placing order");
    const userId = req.session?.userData?._id;
    const { amount } = req.body;

    const userInfo = await User.findOne({ _id: userId });

    const cart = await Cart.findOne({ userId }).populate("item.product");
    let name;

    if (cart && cart.item && cart.item.length > 0) {
      name = cart.item[0].product.productName;
    }

    let address = req.session.selectedAddress;

    const orderItems = cart.item.map((item) => ({
      product: item.product,
      price: item.price,
      quantity: item.quantity,
    }));

    const order = new Order({
      userId: userId,
      orderItems,
      name,
      shippingInfo: {
        address: address,
      },
      shippingCharges: req.session.shippingCharges,
      totalAmount: amount,
      itemPrice: orderItems.reduce((acc, item) => acc + item.price, 0),
      orderDate: new Date().toISOString(),
      paymentMethod: "WALLET",
    });

    await order.save();
6 
    // Stock update
    for (let i = 0; i < orderItems.length; i++) {
      const product = await Product.findById(orderItems[i].product);
      product.quantity -= orderItems[i].quantity;
      await product.save();
    }

    await Cart.deleteMany({ userId });
    const couponCode = req.session.userData?.couponCode;
    const coupon = await Coupon.findOne({ couponCode });
    if (coupon) {
      coupon.user.push(userId);
      await coupon.save();
    }
    const orders = await Order.findOne({ userId })
      .sort({ _id: -1 })
      .limit(1)
      .populate("orderItems.product");
    userInfo.wallet -= amount;
    await userInfo.save();

    const walletTransaction = new WalletTransaction({
      user: userId,
      type: "debit",
      amount,
      reason: "Order payment",
    });

    await walletTransaction.save();

    return res.json({
      success: true,
      orders: orders,
      userId: userId,
      wallet: userInfo.wallet,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};


const paymentSuccess = async (req, res) => {
  const userId = req.session?.userData?._id;
  const userData = await User.findOne({ _id: userId });
  const orders = await Order.findOne({ userId })
    .sort({ _id: -1 })
    .limit(1)
    .populate("orderItems.product");

  res.render("user/displayConfirmation", {
    session: req.session,
    orders,
    userId,
    userData,
  });
};

// item Availability @ checkout

const stockCheck = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const userCart = await Cart.findOne({ userId }).populate({
      path: 'item.product',
      model: 'Product',
    });
    const outOfStockProducts = [];

    for (const cartItem of userCart.item) {
      const product = cartItem.product;
      const orderedQuantity = cartItem.quantity;
     
      if (orderedQuantity > product.quantity) {
        outOfStockProducts.push({
          productName: product.productName,
          orderedQuantity,
          availableQuantity: product.quantity,
        });
      }
    }

    if (outOfStockProducts.length > 0) {
      res.status(200).json({ "available": false, outOfStockProducts });
    } else {
      res.status(200).json({ "available": true });
    }
  } catch (error) {
    console.error('Error in stock check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const validateCoupon = async (req, res) => {
  try {
    const { couponCode, totalCartAmount } = req.body;
    const coupon = await Coupon.findOne({ couponCode });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid Coupon" });
    }
    let userId = req.session.userData._id;

    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
      return res.json({ success: false, message: "Coupon Expired!" });
    }
    if (coupon.quantity !== null && coupon.quantity <= 0) {
      return res.json({
        success: false,
        message: "Coupon has reached its maximum usage limit",
      });
    }

    if (totalCartAmount < coupon.minAmount) {
      return res.json({
        success: false,
        message: "Cart total does not meet the minimum requirement",
      });
    }
    if (coupon.user.includes(userId)) {
      return res.json({
        success: false,
        message: "You  have already used this coupon!",
      });
    }

    return res.json({
      success: true,
      couponCode: coupon.couponCode,
      discountAmount: coupon.maxDiscount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res.json({ success: false, message: "Internal server error" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, totalCartAmount } = req.body;

    const userId = req.session.userData._id;
    const coupon = await Coupon.findOne({ couponCode });
    const cart = await Cart.findOne({ userId: userId });
    const discountAmount = Math.min(totalCartAmount, coupon.maxDiscount);
    const newCartTotal = totalCartAmount - discountAmount;
    req.session.userData.discountAmount = discountAmount;
   
    req.session.userData.couponCode= couponCode;
   
    cart.totalCartPrice = newCartTotal;
    cart.discountAmount=discountAmount;
    req.session.userData.total = newCartTotal;
    req.session.total = newCartTotal;
    await cart.save();

    return res.json({
      success: true,
      discountAmount,
      newCartTotal: cart.totalCartPrice,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  placeOrder,
  contact,
  stockCheck,
  walletHistory,
  validateCoupon,
  applyCoupon,
  returnOrder,
  deductWalletBalanceForPartialPayment,
  deductWalletBalance,
  orderConfirmation,
  search,
  searchSuggestions,
  paymentSuccess,
  loadHome,
  loadUserLogin,
  loadUserSignUp,
  loadHomePage,
  generateOTP,
  userSignOut,
  resendOTP,
  verifyOTP,
  sendOTPByEmail,
  generateOTPExpiration,
  insertUser,
  securePassword,
  getAllProducts,
  loadProductDetails,
  fetchCategoriesMiddleware,
  loadProfile,
  loadAddAddress,
  addAddress,
  checkout,
  deleteAddress,
  loadEditAddress,
  saveEditedAddress,
  loadPaymentPage,
  orderData,
  orderDetails,
  cancelOrder,
  loadResetPassword,
  handleResetPassword,
  sendOTPtoResetPassword,
  loadForgotPassword,
  handleForgotPassword,
  forgotPasswordVerifyHandler,
  sendOTPtoForgotPassword,
  loadEditProfile,
  updateUserProfile,
  updateUserProfilePic,
};
