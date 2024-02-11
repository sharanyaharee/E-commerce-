require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const Coupon = require("../models/couponModel");
const Return = require("../models/returnModel");
const Banner = require("../models/bannerModel");
const WalletTransaction = require("../models/walletModel");
const adminMail = process.env.ADMIN_MAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const loadAdminLogin = async (req, res) => {
  const message = req.query.message;
  const categories = await Category.find({ blocked: false });
  res.render("admin/adminLogin", { message, session: req.session, categories });
};
const verifyAdminLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
  
    if (!email || !password) {
      return res.render("admin/adminLogin", { message: "Please enter both email and password" });
    }

    if (email !== adminMail) {
      return res.render("admin/adminLogin", { message: "Wrong email address" });
    }

    if (password !== adminPassword) {
      return res.render("admin/adminLogin", { message: "Wrong password" });
    }
    req.session.adminData = { email: adminMail };
    res.redirect("/admin/adminDashboard");
  } catch (error) {
    console.error("Error rendering adminDashboard:", error);
    next(error);
  }
};


const loadAdminDashboard = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments();
    const totalSales = await Order.countDocuments();
    const totalRevenueAggregate = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);
    
    const totalRevenue =
      totalRevenueAggregate.length > 0
        ? totalRevenueAggregate[0].totalAmount
        : 0;

    const deliveredOrders = await Order.find(
      { "orderItems.status": "delivered" },
      { totalAmount: 1, orderDate: 1, _id: 0 }
    );
    const salesData = deliveredOrders.map((order) => ({
      totalAmount: order.totalAmount,
      orderDate: order.orderDate.toISOString().split("T")[0],
    }));
    console.log(salesData);
    res.render("admin/adminDashboard", {
      salesData,
      totalCustomers,
      totalSales,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const filteredSalesData = async (req, res) => {
  try {
    let filterOption = req.query.filterOption || null;
    let filterQuery = {};
    if (filterOption === "weekly") {
      const currentDate = new Date();
      const firstDayOfWeek = new Date(currentDate);
      firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const lastDayOfWeek = new Date(currentDate);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

      filterQuery = {
        "orderItems.status": "delivered",
        orderDate: {
          $gte: firstDayOfWeek,
          $lt: new Date(lastDayOfWeek.setHours(23, 59, 59, 999)),
        },
      };
    } else if (filterOption === "monthly") {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      filterQuery = {
        "orderItems.status": "delivered",
        orderDate: {
          $gte: firstDayOfMonth,
          $lt: new Date(lastDayOfMonth.setHours(23, 59, 59, 999)),
        },
      };
    }
    const deliveredOrders = await Order.find(filterQuery, {
      totalAmount: 1,
      orderDate: 1,
      _id: 0,
    });

    const salesData = deliveredOrders.map((order) => ({
      totalAmount: order.totalAmount,
      orderDate: order.orderDate.toISOString().split("T")[0],
    }));

    console.log(filterOption);
    console.log(salesData);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const filteredOrders = async (req, res) => {
  try {
    const filter = req.query.filter;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let ordersQuery;

    if (filter === "today") {
      const startOfDay = new Date(new Date().setHours(0, 0, 0));
      const endOfDay = new Date(new Date().setHours(23, 59, 59));

      ordersQuery = {
        orderItems: { $elemMatch: { status: "delivered" } },
        orderDate: { $gte: startOfDay, $lte: endOfDay },
      };
    } else if (filter === "week") {
      const startOfWeek = new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay())
      );
      const endOfWeek = new Date(new Date().setDate(startOfWeek.getDate() + 6));

      ordersQuery = {
        orderItems: { $elemMatch: { status: "delivered" } },
        orderDate: { $gte: startOfWeek, $lte: endOfWeek },
      };
    } else if (filter === "month") {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      const endOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      );

      ordersQuery = {
        orderItems: { $elemMatch: { status: "delivered" } },
        orderDate: { $gte: startOfMonth, $lte: endOfMonth },
      };
    } else if (filter === "all") {
      ordersQuery = {
        orderItems: { $elemMatch: { status: "delivered" } },
      };
    } else {
      return res.status(400).json({ error: "Invalid filter" });
    }

    const orders = await Order.find(ordersQuery)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId")
      .populate({
        path: "orderItems.product",
        model: "Product",
        select: "productName",
      });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching filtered orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const salesReport = async (req, res) => {
  try {
    const orders = await Order.find({
      orderItems: {
        $elemMatch: { status: "delivered" },
      },
    })
      .sort({ orderDate: -1 })
      .populate("userId")
      .populate({
        path: "orderItems.product",
        model: "Product",
        select: "productName",
      });

    res.render("admin/sales", { orders });
  } catch (error) {
    console.log(error);
  }
};

const adminProductView = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });
    res.render("admin/adminProductView", { products });
  } catch (error) {
    console.error("Error loading admin products:", error);
    res.status(500).render("admin/adminProductView", { products: [] });
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, description, price, quantity, category } = req.body;
    const images = req.files.map((file) => file.filename);

    const categories = await Category.find();

    const existingProduct = await Product.findOne({ productName: productName });
    if (existingProduct) {
      return res.render("admin/adminAddProduct", {
        message: "Product name must be unique",
        categories,
      });
    }

    const newProduct = new Product({
      productName,
      productImages: images,
      description,
      price,
      quantity,
      category,
    });

    const savedProduct = await newProduct.save();
    res.redirect("/admin/adminProductView");
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("admin/adminAddProduct", { message: "", categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const adminCategoryView = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("admin/adminCategoryView", { categories });
  } catch (error) {
    console.error("Error loading admin categories:", error);
    res.status(500).render("admin/adminCategoryView", { categories: [] });
  }
};

const addCategory = async (req, res) => {
  try {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(req.body.name, "i") },
    });

    if (existingCategory) {
      return res.render("admin/adminAddCategory", {
        msg: "Category with the same name already exists",
      });
    }

    const newCategory = new Category({
      name: req.body.name,
      image: "/assets/uploads/" + req.file.filename,
    });

    await newCategory.save();

    res.redirect("/admin/adminCategoryView");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const adminDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    const imagePath = path.join(__dirname, "..", "public", category.image);
    fs.unlinkSync(imagePath);

    await Category.findByIdAndDelete(categoryId);

    res.redirect("/admin/adminCategoryView");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadAddCategory = async (req, res) => {
  res.render("admin/adminAddCategory", { msg: "" });
};

const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const updatedCategoryName = req.body.editCategoryName;
    const category = await Category.findById(categoryId);

    if (!category) {
      console.error("Category not found for id:", categoryId);
      return res.status(404).send("Category not found");
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(updatedCategoryName, "i") },
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      return res.render("admin/editCategory", {
        category: category,
        msg: "Category with the same name already exists",
      });
    }
    category.name = updatedCategoryName;

    if (!req.file) {
      category.image = category.image;
    } else {
      category.image = "/assets/uploads/" + req.file.filename;
    }

    await category.save();

    res.redirect("/admin/adminCategoryView");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      console.error("Category not found for id:", categoryId);
      return res.status(404).send("Category not found");
    }

    res.render("admin/editCategory", { category, msg: "" });
  } catch (error) {
    console.error("Error rendering edit form:", error);
    res.status(500).send("Internal Server Error");
  }
};

const adminUserView = async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/adminUserView", { users });
  } catch (error) {
    console.error("Error loading admin users:", error);
    res.status(500).render("admin/adminUserView", { users: [] });
  }
};

const toggleBlockUser = async (req, res) => {
  const userId = req.query.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.blocked = !user.blocked;
    const updatedUser = await user.save();
    res.redirect("/admin/adminUserView");
  } catch (error) {
    console.error("Error toggling block status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const toggleBlockCategory = async (req, res) => {
  const catId = req.params.categoryId;
  try {
    const category = await Category.findById(catId);

    if (!category) {
      return res.status(404).json({ error: "category Not found" });
    }
    category.blocked = !category.blocked;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error toggling block status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const toggleBlockProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.blocked = !product.blocked;
    const updatedProduct = await product.save();
    res.json({ blocked: updatedProduct.blocked });
  } catch (error) {
    console.error("Error toggling block status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { productName, description, price, quantity, category } = req.body;
    let deletedImages;
    if (req.body.deletedImages) {
      deletedImages = JSON.parse(req.body.deletedImages);
    }
    console.log(deletedImages);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.productName = productName;
    product.description = description;
    product.price = price;
    product.quantity = quantity;
    product.category = category;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      product.productImages = [...product.productImages, ...newImages];
    }

    if (product.productImages && deletedImages) {
      product.productImages = product.productImages.filter(
        (image) => !deletedImages.includes(image)
      );
    }

    await product.save();

    res.redirect("/admin/adminProductView");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const categories = await Category.find();

    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
      console.error("product not found for id:", productId);
      return res.status(404).send("product not found");
    }

    res.render("admin/editProduct", { product, categories });
  } catch (error) {
    console.error("Error rendering edit form:", error);
    res.status(500).send("Internal Server Error");
  }
};

const logout = async (req, res) => {
  try {
    req.session.adminData = null;
    res.redirect("/admin/adminLogin");
  } catch (error) {
    console.log(error);
  }
};

const adminOrderView = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;
    const orders = await Order.find()
      .populate("userId", "name")
      .sort({ orderDate: -1 });

    res.render("admin/adminOrderView", { orders, userId });
  } catch (error) {
    console.error("Error loading Orders:", error);
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, orderItemsId, newStatus } = req.body;
    const order = await Order.findOne({ _id: orderId, "orderItems.product": orderItemsId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    const orderItemIndex = order.orderItems.findIndex(item => item.product.equals(orderItemsId));

    if (orderItemIndex === -1) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    const previousStatus = order.orderItems[orderItemIndex].status;
    const isNewStatusReturnApproved = newStatus === "return_approved";
    const isPreviousStatusReturnRequested = previousStatus === "return_requested";

    if ((isNewStatusReturnApproved && isPreviousStatusReturnRequested) || (isNewStatusReturnApproved && newStatus === previousStatus)) {
    
      const refundedAmount = calculateRefundedAmount(order.orderItems[orderItemIndex]);
      const userId = order.userId;
      const user = await User.findById(userId);

      user.wallet += refundedAmount;
      await user.save();

      const walletTransaction = new WalletTransaction({
        user: order.userId,
        type: "credit",
        amount: refundedAmount,
        reason: "Order return approved",
      });
      await walletTransaction.save();
      const returnDetails = await Return.findOne({
        orderId: orderId,
        orderItemId: orderItemsId,
      });

      if (!returnDetails) {
        return res
          .status(404)
          .json({ success: false, message: "Return details not found" });
      }
      if (returnDetails && returnDetails.reason !== "damaged") {
      
        const productId = order.orderItems[orderItemIndex].product;
        const product = await Product.findById(productId);
        product.quantity += order.orderItems[orderItemIndex].quantity;
        await product.save();
      }

      order.orderItems[orderItemIndex].statusDate = new Date();
    } else if (newStatus === "admin_cancelled") {
     
      const productId = order.orderItems[orderItemIndex].product;
      const product = await Product.findById(productId);
      product.quantity += order.orderItems[orderItemIndex].quantity;
      await product.save();
    }

    if (newStatus === "delivered") {
      order.orderItems[orderItemIndex].statusDate = new Date();
    }

    order.orderItems[orderItemIndex].status = newStatus;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      updatedStatus: newStatus,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

function calculateRefundedAmount(orderItem) {
  return orderItem.quantity * orderItem.price;
}

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;

    const order = await Order.findById(orderId).populate("userId").populate({
      path: "orderItems.product",
      model: "Product",
    });

    const returnRequest = await Return.findOne({ orderId });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("admin/adminOrderDetailsView", {
      order,
      returnRequest,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Internal server error");
  }
};

const loadAddCoupon = async (req, res) => {
  try {
    res.render("admin/addCoupon", { message: "" });
  } catch (error) {}
};

const addCoupon = async (req, res) => {
  try {
    const {
      couponName,
      couponCode,
      startDate,
      endDate,
      minAmount,
      maxDiscount,
      quantity,
    } = req.body;

    const existingCoupon = await Coupon.findOne({
      couponCode: { $regex: new RegExp(`^${couponCode}$`, "i") },
    });

    if (existingCoupon) {
      res.render("admin/addCoupon", {
        message: "*Coupon code must be unique!",
      });
    } else {
      const newCoupon = new Coupon({
        couponName,
        couponCode,
        startDate,
        endDate,
        minAmount,
        maxDiscount,
        quantity,
      });
      await newCoupon.save();
      res.render("admin/addCoupon", { message: "Coupon added successfully." });
    }
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.couponCode
    ) {
      res.render("admin/addCoupon", {
        message: "*Coupon code must be unique.",
      });
    } else {
      console.error("Error adding coupon:", error);
      res.render("admin/addCoupon", {
        message: "*Please provide valid values for all fields.",
      });
    }
  }
};

const showAdminCouponView = async (req, res) => {
  try {
    const couponData = await Coupon.find();
    const currentDate = new Date();

    const coupons = couponData.map(async (coupon) => {
      const startDate = new Date(coupon.startDate);
      const endDate = new Date(coupon.endDate);

      coupon.status =
        startDate <= currentDate && currentDate <= endDate ? 1 : 0;

      await coupon.save();

      return coupon;
    });
    await Promise.all(coupons);

    res.render("admin/adminCouponView", { couponData });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).send("Internal server error");
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const couponData = await Coupon.findByIdAndDelete(couponId);

    if (!couponData) {
      return res.status(404).send("Coupon not found");
    }

    res.redirect("/admin/adminCouponView");
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).send("Internal server error");
  }
};

const showEditCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;

    const couponData = await Coupon.findById(couponId);

    if (!couponData) {
      return res.status(404).send("Coupon not found");
    }

    res.render("admin/editCoupon", { couponData });
  } catch (error) {
    console.error("Error fetching coupon for editing:", error);
    res.status(500).send("Internal server error");
  }
};
const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;

    const {
      couponName,
      couponCode,
      startDate,
      endDate,
      minAmount,
      maxDiscount,
      quantity,
    } = req.body;

    const existingCoupon = await Coupon.findOne({
      couponCode: { $regex: new RegExp(`^${couponCode}$`, "i") },
    });

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).send("Coupon not found");
    }
    coupon.couponName = couponName;
    coupon.couponCode = couponCode;
    coupon.startDate = startDate;
    coupon.endDate = endDate;
    coupon.minAmount = minAmount;
    coupon.maxDiscount = maxDiscount;
    coupon.quantity = quantity;

    await coupon.save();

    res.render("admin/addCoupon", { message: "Coupon Edited successfully!" });
    // res.redirect('/admin/adminCouponView');
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.couponCode
    ) {
      res.render("admin/addCoupon", {
        message: "*Coupon code must be unique.",
      });
    } else {
      console.error("Error adding coupon:", error);
      res.render("admin/addCoupon", {
        message: "*Please provide Valid Values to fields!.",
      });
    }
  }
};

const addOrModifyProductOffer = async (req, res) => {
  try {
    let { rateOfDiscount } = req.body;
    let productId = req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId format." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid productID." });
    }

    rateOfDiscount = Number(rateOfDiscount);
    if (isNaN(rateOfDiscount) || rateOfDiscount < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate of Discount should be a non-negative number.",
      });
    }

    const productPrice = product.price;
    const discountAmount = (productPrice * rateOfDiscount) / 100;

    let offerPrice = productPrice - discountAmount;

    offerPrice = Math.ceil(offerPrice);

    const updatedProduct = await Product.findByIdAndUpdate(productId, {
      $set: { onOffer: true, offerPrice, rateOfDiscount },
    });

    if (!(updatedProduct instanceof Product)) {
      return res.status(500).json({
        success: false,
        message: "Server is facing issues Updating Product Data",
      });
    }

    return res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ success: false, message: "Server is facing issues: " });
  }
};
const adminOfferPage = async (req, res) => {
  try {
    const products = await Product.find({ onOffer: true });
    res.render("admin/adminOffers.ejs", { products, session: req.session });
  } catch (error) {
    console.log(error);
  }
};
const deactivateOffer = async (req, res) => {
  try {
    const productId = req.params.productId;

    await Product.findByIdAndUpdate(productId, { onOffer: false });

    res.status(200).json({ message: "Offer deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating offer:", error);
    res.status(500).json({ message: "Failed to deactivate offer" });
  }
};
const categoryOffers = async (req, res) => {
  try {
    const categories = await Category.find({ blocked: false });
    res.render("admin/categoryOffers.ejs", {
      categories,
      session: req.session,
    });
  } catch (error) {
    console.log(error);
  }
};

const toggleDiscount = async (req, res) => {
  try {
    console.log("let me toggle");
    const { categoryId, categoryName, discountAmount, activate } = req.body;

    const category = await Category.findById(categoryId);
    if (category) {
      category.onDiscount = activate;
      category.discountAmount = activate ? discountAmount : 0;
      await category.save();

      res.status(200).json({
        success: true,
        message: `Discount for ${categoryName} has been ${
          activate ? "activated" : "deactivated"
        }.`,
      });
    } else {
      res.status(404).json({ success: false, message: "Category not found." });
    }
  } catch (error) {
    console.error("Error toggling discount:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const adminBannerView = async (req, res) => {
  try {
    const bannerData = await Banner.find();
    res.render("admin/adminBannerView", { bannerData });
  } catch (error) {
    console.error("Error loading Orders:", error);
  }
};
const loadAddBanner = async (req, res) => {
  try {
    res.render("admin/adminAddBanner.ejs");
  } catch (error) {
    console.error("Error loading Orders:", error);
  }
};

const newBanner = async (req, res) => {
  try {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(req.body.mainheading, "i") },
    });

    if (existingCategory) {
      return res.render("admin/adminAddBanner", {
        msg: "Banner with the same name already exists",
      });
    }
    const bannerData = new Banner({
      bannerImage: "/assets/uploads/" + req.file.filename,
      mainHeading: req.body.mainheading,
      subHeading: req.body.subheading,
      description: req.body.description,
    });

    bannerData.save();
    res.redirect("/admin/adminBannerView");
  } catch (error) {
    console.log(error);
  }
};

const deleteBanner = async(req,res)=>{
  try{
      const id = req.query.bannerId;
    
      const bannerData = await Banner.findByIdAndDelete({_id:id});
      if (bannerData.bannerImage) {
        const filePath = `public${bannerData.bannerImage}`;
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return;
          }
          console.log("File deleted successfully");
        });
      }
      res.redirect('/admin/adminBannerView');
  }
  catch (error){
      console.log(error)
  }
}
const loadEditBanner = async (req, res) => {
  try {
    const BannerId = req.query.bannerId;
    const bannerData = await Banner.findById(BannerId);
    
    res.render("admin/editBanner.ejs", {bannerData});
  } catch (error) {
    console.error("Error loading Orders:", error);
  }
};


const updateBanner = async (req, res) => {
  try {
    const bannerId = req.body.id;
    const bannerData = {
      mainHeading: req.body.mainheading,
      subHeading: req.body.subheading,
      description: req.body.description
    };

    if (req.file) {
      bannerData.bannerImage = "/assets/uploads/" + req.file.filename;
    } else {
      const existingBanner = await Banner.findById(bannerId);
      bannerData.bannerImage = existingBanner.bannerImage;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(bannerId, bannerData, { new: true });

    res.redirect("/admin/adminBannerView");
  } catch (error) {
    console.log(error);

  }
};


const listBanner = async (req, res) => {
  try {
    const id = req.query.bannerId;
    const bannerData = await Banner.findById({ _id: id });
    if (bannerData.status === 0) {
      await Banner.findByIdAndUpdate({ _id: id }, { $set: { status: 1 } });
    } else {
      await Banner.findByIdAndUpdate({ _id: id }, { $set: { status: 0 } });
    }
    res.redirect("/admin/adminBannerView");
  } catch (error) {
    next(err)
  }
};

module.exports = {
  deleteBanner,
  updateBanner,
  listBanner,
  newBanner,
  loadAddBanner,
  loadEditBanner,
  adminBannerView,
  filteredSalesData,
  toggleDiscount,
  categoryOffers,
  deactivateOffer,
  adminOfferPage,
  addOrModifyProductOffer,
  salesReport,
  filteredOrders,
  showEditCoupon,
  editCoupon,
  deleteCoupon,
  showAdminCouponView,
  addCoupon,
  loadAddCoupon,
  getOrderDetails,
  loadAdminLogin,
  verifyAdminLogin,
  loadAdminDashboard,
  adminProductView,
  addProduct,
  loadEditProduct,
  editProduct,
  loadAddProduct,
  addCategory,
  adminCategoryView,
  loadAddCategory,
  editCategory,
  loadEditCategory,
  adminDeleteCategory,
  upload,
  adminUserView,
  toggleBlockUser,
  toggleBlockCategory,
  toggleBlockProduct,
  logout,
  adminOrderView,
  updateOrderStatus,
};
