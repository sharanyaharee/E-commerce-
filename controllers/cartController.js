const mongoose = require("mongoose");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

const loadCart = async (req, res) => {
  try {
    let items;
    let totalCartPrice = 0;
    const userId = req.session.userData._id;

    const user = await User.findOne({ _id: userId });

    const cart = await Cart.findOne({ userId: userId }).populate(
      "item.product"
    );

    if (!cart || !userId || !user) {
      return res.render("user/cart", {
        items: [],
        totalCartPrice,
        session: req.session,
      });
    }

    if (cart.item != null) {
      cart.item.forEach((value) => {
        totalCartPrice += value.totalPrice;
      });
      await Cart.updateOne({ userId }, { $set: { totalCartPrice } });

      items = cart.item;

      res.render("user/cart", { items, session: req.session, totalCartPrice });
    }
  } catch (err) {
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userData?._id;

    if (!userId) {
      return res.redirect("/userLogin");
    }

    const product = await Product.findOne({ _id: productId }).populate(
      "category"
    );
    const userCart = await Cart.findOne({ userId: userId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let price;

    if (product.category && product.category.onDiscount) {
      price = product.price;
      const discountAmount = product.category.discountAmount || 0;
      price -= discountAmount;
    } else {
      price = product.offerPrice || product.price;
    }

    if (userCart) {
      const itemIndex = userCart.item.findIndex(
        (item) => item.product && item.product === productId
      );

      if (itemIndex >= 0) {
        await Cart.updateOne(
          { userId: userId, "item.product": productId },
          { $inc: { "item.$.quantity": 1 } }
        );
      } else {
        await Cart.updateOne(
          { userId: userId },
          {
            $push: {
              item: {
                product: productId,
                price: price,
                quantity: 1,
                totalPrice: price,
              },
            },
          }
        );
      }
    } else {
      await Cart.create({
        userId: userId,
        item: [
          {
            product: productId,
            price: price,
            quantity: 1,
            totalPrice: price,
          },
        ],
        totalCartPrice: price,
      });
    }

    const updatedCart = await Cart.findOne({ userId: userId }).populate(
      "item.product"
    );
    let totalCartPrice = 0;

    if (updatedCart && updatedCart.item) {
      updatedCart.item.forEach((item) => {
        totalCartPrice += item.totalPrice;
      });
    }

    await Cart.updateOne({ userId: userId }, { $set: { totalCartPrice } });

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCartQuantity = async (req, res, action) => {
  try {
    const id = req.body.id;
    const userId = req.session.userData?._id;

    let cart = await Cart.findOne({ userId: userId });
    const itemIndex = cart.item.findIndex((item) => item.product == id);
    const product = await Product.findById(id);

    if (action === "increment") {
      const availableQuantity = product?.quantity;

      if (
        availableQuantity !== undefined &&
        cart.item[itemIndex].quantity >= availableQuantity
      ) {
        const errorMessage = "Quantity exceeds available quantity.";
        return res.json({
          success: false,
          message: errorMessage,
        });
      }
      cart.item[itemIndex].quantity += 1;
    } else if (action === "decrement") {
      if (cart.item[itemIndex].quantity > 1) {
        cart.item[itemIndex].quantity -= 1;
      } else {
        console.log("Quantity cannot be less than 1.");
        return res.json({
          success: false,
          message: "Quantity cannot be less than 1.",
        });
      }
    }

    cart.item[itemIndex].totalPrice =
      cart.item[itemIndex].quantity * cart.item[itemIndex].price;

    let totalCartAmount = cart.item.reduce((total, item) => {
      return total + item.totalPrice;
    }, 0);

    cart.totalCartPrice = totalCartAmount;

    await cart.save();

    res.json({
      success: true,
      quantity: cart.item[itemIndex].quantity,
      totalPrice: cart.item[itemIndex].totalPrice,
      totalCartAmount: cart.totalCartPrice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Increment quantity
const incrementCartItemQuantity = async (req, res) => {
  await updateCartQuantity(req, res, "increment");
};

// Decrement quantity
const decrementCartItemQuantity = async (req, res) => {
  await updateCartQuantity(req, res, "decrement");
};

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.userData._id;

    const user = await User.findOne({ _id: userId });

    const wishlist = await Wishlist.findOne({ userId: userId })
      .populate({
        path: "products",
        model: "Product",
      })
      .exec();

    const cartItems = await Cart.find({ userId: userId });

    const cartProductIds = new Set(
      cartItems.flatMap((item) => item.item.map((i) => i.product.toString()))
    );

    res.render("user/wishlist", {
      session: req.session,
      wishlist: wishlist,
      user: user,
      isInCart: (item) => cartProductIds.has(item._id.toString()),
    });
  } catch (error) {
    console.log(error);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userData?._id;

    if (!userId) {
      return res.redirect("/userLogin");
    }

    let wishlist = await Wishlist.findOne({ userId: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: userId, products: [] });
    }

    const addedToWishlist = req.query.addedToWishlist === "false";

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
      res.redirect(`/product/${productId}?addedToWishlist=${!addedToWishlist}`);
    } else {
      wishlist.products.pull(productId);
      await wishlist.save();
      res.redirect(`/product/${productId}?addedToWishlist=${!addedToWishlist}`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userData?._id;
    if (!userId) {
      return res.redirect("/userLogin");
    }

    const user = await User.findById({ _id: userId });
    const wishlist = await Wishlist.findOne({ userId: userId });

    if (wishlist.products.pull(productId)) {
      await wishlist.save();
      res.redirect("/wishlist");
    }
  } catch (error) {
    console.log(error);
  }
};
const removeCart = async (req, res) => {
  try {
    const id = req.body.id;
    const userId = req.session.userData?._id;

    const result = await Cart.updateOne(
      { userId: userId },
      { $pull: { item: { product: id } } }
    );

    res.json({ success: true, message: "Item removed from the cart." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  loadCart,
  addToCart,
  loadWishlist,
  removeWishlist,
  addToWishlist,
  removeCart,
  incrementCartItemQuantity,
  decrementCartItemQuantity,
};
