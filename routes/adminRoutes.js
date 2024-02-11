const express = require("express");
const admin_route = express();
admin_route.use(express.static('public'));
const adminAuth = require('../middlewares/isAdminLoggedIn')
const adminController = require("../controllers/adminController");


// Middleware to log information about incoming requests
admin_route.use((req, res, next) => {
    console.log(`Incoming request to adminRoute.js: ${req.method} ${req.url}`);
    next();
  });
  
 admin_route.get('/adminLogin',adminAuth.isAdLoggedOut, adminController.loadAdminLogin);
 admin_route.post('/adminLogin',adminController.verifyAdminLogin);
 admin_route.get('/adminDashboard', adminController.loadAdminDashboard);

 admin_route.get('/filteredOrders',adminAuth.isAdLoggedIn,adminController.filteredOrders);
 admin_route.get('/salesReport',adminAuth.isAdLoggedIn,adminController.salesReport);
 admin_route.get('/adminUserView',adminAuth.isAdLoggedIn, adminController.adminUserView);

 admin_route.get('/getFilteredSalesData',adminAuth.isAdLoggedIn, adminController.filteredSalesData);

 admin_route.get('/blockUser',adminAuth.isAdLoggedIn, adminController.toggleBlockUser);
 admin_route.post('/toggleBlockCat/:categoryId',adminAuth.isAdLoggedIn, adminController.toggleBlockCategory);
 
 admin_route.post('/toggleBlockPro/:productId',adminAuth.isAdLoggedIn, adminController.toggleBlockProduct);
 admin_route.get('/adminProductView',adminAuth.isAdLoggedIn,adminController.adminProductView);
 admin_route.get('/adminAddProduct',adminAuth.isAdLoggedIn, adminController.loadAddProduct);
 admin_route.post('/adminAddProduct',adminAuth.isAdLoggedIn,adminController.upload.array('productImages', 12), adminController.addProduct);
 admin_route.post('/editProduct/:productId',adminAuth.isAdLoggedIn,adminController.upload.array('productImages', 12),  adminController.editProduct);
 admin_route.get('/editProduct/:productId',adminAuth.isAdLoggedIn, adminController.loadEditProduct);
 
 admin_route.get('/adminBannerView',adminAuth.isAdLoggedIn, adminController.adminBannerView);
 admin_route.get('/adminAddBanner',adminAuth.isAdLoggedIn, adminController.loadAddBanner);
 admin_route.get('/editBanner',adminAuth.isAdLoggedIn, adminController.loadEditBanner);
 admin_route.post('/addBanner',adminAuth.isAdLoggedIn,adminController.upload.single("bannerImage"), adminController.newBanner);
 admin_route.get('/listBanner',adminAuth.isAdLoggedIn, adminController.listBanner);
admin_route.get('/deleteBanner',adminAuth.isAdLoggedIn,adminController.deleteBanner);
admin_route.post('/editBanner',adminAuth.isAdLoggedIn,adminController.upload.single("editBannerImage"), adminController.updateBanner);

 admin_route.get('/adminCategoryView',adminAuth.isAdLoggedIn, adminController.adminCategoryView);
 admin_route.get('/adminAddCategory',adminAuth.isAdLoggedIn, adminController.loadAddCategory);
 admin_route.post('/adminAddCategory',adminAuth.isAdLoggedIn,adminController.upload.single('image'), adminController.addCategory);
 admin_route.post('/adminDeleteCategory/:categoryId',adminAuth.isAdLoggedIn, adminController.adminDeleteCategory);


 admin_route.post('/editCategory/:categoryId',adminAuth.isAdLoggedIn,adminController.upload.single('editCategoryImage'), adminController.editCategory);
 admin_route.get('/editCategory/:categoryId', adminAuth.isAdLoggedIn,adminController.loadEditCategory);
admin_route.get('/logout', adminAuth.isAdLoggedIn, adminController.logout)

admin_route.get('/adminOrderView',adminAuth.isAdLoggedIn,adminController.adminOrderView);
admin_route.post('/updateOrderStatus',adminAuth.isAdLoggedIn,adminController.updateOrderStatus);
admin_route.get('/getOrderDetails',adminAuth.isAdLoggedIn,adminController.getOrderDetails);

admin_route.post('/addOffer/:productId',adminAuth.isAdLoggedIn,adminController.addOrModifyProductOffer);
admin_route.get('/adminOfferManagement',adminAuth.isAdLoggedIn,adminController.adminOfferPage);
admin_route.post('/deactivateOffer/:productId',adminAuth.isAdLoggedIn,adminController.deactivateOffer);

admin_route.get('/categoryOffers',adminAuth.isAdLoggedIn,adminController.categoryOffers);
admin_route.post('/toggleDiscount',adminAuth.isAdLoggedIn,adminController.toggleDiscount);

admin_route.get('/addCoupon',adminAuth.isAdLoggedIn,adminController.loadAddCoupon);
admin_route.post('/addCoupon',adminAuth.isAdLoggedIn,adminController.addCoupon);
admin_route.get('/adminCouponView',adminAuth.isAdLoggedIn,adminController.showAdminCouponView);
admin_route.get('/editCoupon/:couponId',adminAuth.isAdLoggedIn,adminController.showEditCoupon);
admin_route.post('/editCoupon/:couponId',adminAuth.isAdLoggedIn,adminController.editCoupon);
admin_route.get('/deleteCoupon/:couponId',adminAuth.isAdLoggedIn,adminController.deleteCoupon);



module.exports = admin_route;
