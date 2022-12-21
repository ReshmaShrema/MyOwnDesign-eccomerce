const express = require("express");
const adminHelper = require("../helper/admin");
const productHelper = require("../helper/product");
const userHelper = require("../helper/user");
const router = express.Router();
const excelJs = require("exceljs");

// setting id and pass from env
const email = "admin@gmail.com";
const password = "admin";

// middleware
const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminLogin) {
    next();
  } else {
    res.redirect("/admin/adminLogin");
  }
};

// admin dashboard
router.get("/", verifyAdminLogin, async function (req, res, next) {
  const SalesReport = await adminHelper.getMonthSalesReport();
  const ProductReport = await adminHelper.getProductReport();
  const totalProducts = await adminHelper.getTotalProducts();
  const totalOrders = await adminHelper.getTotalOrders();
  let totalsales = 0;
  SalesReport.forEach((doc) => {
    totalsales += doc.totalSalesAmount;
  });
  res.render("admin/dashbord", {
    admin: true,
    adminLoginPage: false,
    SalesReport,
    totalsales,
    ProductReport,
    totalProducts,
    totalOrders,
  });
});

// admin loggin
router.get("/adminLogin", (req, res) => {
  if (req.session.adminLogin) {
    res.redirect("/admin");
  } 
  else {
    res.render("admin/login", {
      adminLoginErr: req.session.adminLoginErr,
      admin: true,
      adminLoginPage: true,
    });
  }
});

router.post("/adminLogin", function (req, res) {
  if (req.body.name == email && req.body.password == password) {
    req.session.adminLogin = true;
    req.session.adminLoginErr = false;
    res.redirect("/admin");
  } 
  else {
    req.session.adminLoginErr = true;
    res.redirect("/admin");
  }
});

// admin logout
router.get("/adminLogout", (req, res) => {
  req.session.adminLogin = false;
  res.redirect("/admin");
});

// user managerment
router.get("/users", verifyAdminLogin, (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0"
  );
  adminHelper.getAllUsers().then((allUsersDetails) => {
    res.render("admin/userManagement", {
      admin: true,
      adminLogin: req.session.adminLogin,
      allUsersDetails,
    });
  });
});

// block user
router.get("/block/:id", verifyAdminLogin, (req, res) => {
  const proId = req.params.id;
  adminHelper.blockUser(proId).then((response) => {
    console.log(response);
    res.redirect("/admin/users");
  });
});

// unblock user
router.get("/unblock/:id", verifyAdminLogin, (req, res) => {
  const proId = req.params.id;
  adminHelper.unblockUser(proId).then((response) => {
    res.redirect("/admin/users");
  });
});

// category management
router.get("/manage-category", verifyAdminLogin, (req, res) => {
  productHelper.getAllCategory().then((category) => {
    res.render("admin/view-category", {
      admin: true,
      adminLogin: req.session.adminLogin,
      category,
    });
  });
});

router.get("/add-category", verifyAdminLogin, (req, res) => {
  res.render("admin/add-category", {
    admin: true,
    adminLogin: req.session.adminLogin,
  });
});

router.post("/add-category", (req, res) => {
  productHelper.addCategory(req.body).then((response) => {
    res.redirect("/admin/manage-category");
  });
});

// delete category
router.get("/delete-category/:id", (req, res) => {
  const id = req.params.id;
  productHelper.deleteCategory(id).then((response) => {
    res.redirect("/admin/manage-category");
  });
});

// product
router.get("/product", verifyAdminLogin, (req, res) => {
  productHelper.getAllProduct().then((product) => {
    res.render("admin/view-product", {
      admin: true,
      adminLogin: req.session.adminLogin,
      product,
    });
  });
});

// delete product
router.get("/DeleteProduct/:id", (req, res) => {
  const prodId = req.params.id;
  productHelper.deleteProduct(prodId).then((response) => {
    console.log(response);
    res.redirect("/admin/product");
  });
});

router.get("/EditProduct/:id", (req, res) => {
  const prodId = req.params.id;
  Promise.all([
    productHelper.getAllCategory(),
    productHelper.getEditProduct(prodId),
  ]).then((response) => {
    res.render("admin/edit-product", {
      admin: true,
      adminLogin:req.session.adminLogin,
      category: response[0],
      editingProduct: response[1],
      modelJqury: true,
    });
  });
});

router.post("/EditProduct/:id", (req, res) => {
  const id = req.params.id;
  productHelper.editProduct(req.body, id).then((response) => {
    res.redirect("/admin/product");
    if (req.files) {
      let image = req.files.image;
      image.mv("./public/product-images/" + id + ".jpg");
    }
  });
});

// add products
router.get("/add-product", verifyAdminLogin, (req, res) => {
  Promise.all([
    productHelper.getAllCategory(),
  ]).then((response) => {
    res.render("admin/add-product", {
      admin: true,
      adminLogin: req.session.adminLogin,
      category: response[0],
      subCategory: response[1],
      modelJqury: true,
    });
  });
});

router.post("/add-product", (req, res) => {
 
  productHelper.addProduct(req.body).then((response) => {
    let id = response.toString();

    if (req.files) {
      let image = req.files.image;
      image.mv("./public/product-images/" + id + ".jpg");
    }

    res.redirect("/admin/product");
  });
});


// Orders listing

router.get("/orders", (req, res) => {
  adminHelper.getAllOrders().then((allOrders) => {
    console.log("debut orders");
    console.log(allOrders);
    res.render("admin/vew-orders", {
      admin: true,
      adminLogin: req.session.adminLogin,
      allOrders,
    });
  });
});

router.get("/view-order-details/:id", async (req, res) => {
  orderId = req.params.id;
  // get total price

  await userHelper.getOrderdProducts(orderId).then((orderDetails) => {
    console.log(orderDetails);
    (totalPrice = orderDetails[0].totalPrice),
      (deliveryDetails = orderDetails[0].deliveryDetails),
      (CurrentStatus = orderDetails[0].status);
    PaymentMethod = orderDetails[0].paymentMethod.toUpperCase();
    CurrentDate = orderDetails[0].date;
    console.log(PaymentMethod);
    paymentStatus = PaymentMethod == "COD" ? "pending" : "paid";

    res.render("admin/view-order-details", {
      admin: true,
      adminLogin: req.session.adminLogin,
      orderDetails,
      totalPrice,
      deliveryDetails,
      CurrentStatus,
      PaymentMethod,
      CurrentDate,
      paymentStatus,
    });
  });
});

// changing order status

router.get("/statusToPacking/:id", (req, res) => {
  console.log("packing is working");
  const orderId = req.params.id;
  adminHelper.satusToPacking(orderId).then((response) => {
    console.log(response);
    res.redirect("/admin/orders");
  });
});

router.get("/statusToShipped/:id", (req, res) => {
  console.log("shippped is working");
  const orderId = req.params.id;
  adminHelper.satusToShipped(orderId).then((response) => {
    console.log(response);
    res.redirect("/admin/orders");
  });
});
router.get("/statusToDeliverd/:id", (req, res) => {
  console.log("delivery is working");
  const orderId = req.params.id;
  adminHelper.satusToDelivered(orderId).then((response) => {
    console.log(response);
    res.redirect("/admin/orders");
  });
});

router.get("/cancelOrder/:id", (req, res) => {
  const orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then((response) => {
    console.log(response);
    res.redirect("/admin/orders");
  });
});

router.get("/edit-page", async (req, res) => {
  const carousels = await adminHelper.getCarousel();
  const homeCategory = await adminHelper.getHomeCategory();
  const trendingProduct = await adminHelper.getTrending();

  const AllCategory = await productHelper.getAllCategory();
  const AllProductList = await productHelper.getAllProduct();
  console.log(carousels);

  res.render("admin/edit", {
    admin: true,
    adminLogin: req.session.adminLogin,
    carousels,
    AllCategory,
    AllProductList,
    homeCategory,
    trendingProduct,
  });
});

router.get("/addcarousel", (req, res) => {
  res.render("admin/add-carousel", {
    admin: true,
    adminLogin: req.session.adminLogin,
    modelJqury: true,
  });
});

router.post("/addcarousel", (req, res) => {
  adminHelper.addCarousel(req.body).then((response) => {
    const id = response.toString();

    if (req.files) {
      let image = req.files.image;
      console.log(image);
      image.mv("./public/carousel-images/" + id + ".jpg");
    }

    res.redirect("/admin/edit-page");
  });
});

// delete the caursol

router.get("/Delete-caursol/:id", (req, res) => {
  const caursolId = req.params.id;
  adminHelper.deleteCaursol(caursolId).then((response) => {
    res.redirect("/admin/edit-page");
  });
});

// add category to home page by admin
router.post("/addCategoryToHome", (req, res) => {
  adminHelper.addCategoryTohome(req.body).then((response) => {
    res.redirect("/admin/edit-page");
  });
});

router.post("/addTrendingProducts", (req, res) => {
  adminHelper.addTrendingProducts(req.body).then((response) => {
    res.redirect("/admin/edit-page");
  });
});

router.get("/sales-report", async (req, res) => {
  let SalesReport = await adminHelper.getTotalSalesReport();

  console.log(SalesReport);
  res.render("admin/sales-report", {
    admin: true,
    adminLoginPage: false,
    SalesReport,
  });
});

router.get("/export_to_excel", async (req, res) => {
  let SalesReport = await adminHelper.getTotalSalesReport();

  try {
    const workbook = new excelJs.Workbook();

    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "S no.", key: "s_no" },
      { header: "OrderID", key: "_id" },
      { header: "User", key: "name" },
      { header: "Date", key: "date" },
      { header: "Products", key: "products" },
      { header: "Method", key: "paymentMethod" },
      { header: "status", key: "status" },
      { header: "Amount", key: "totalPrice" },
    ];
    let counter = 1;
    SalesReport.forEach((report) => {
      report.s_no = counter;
      report.products = "";
      report.name = report.users[0].name;
      report.product.forEach((eachProduct) => {
        report.products += eachProduct.name + ",";
      });
      worksheet.addRow(report);
      counter++;
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    // console.log("finaly resolving the promic ")

    res.header(
      "Content-Type",
      "application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet"
    );
    res.header("Content-Disposition", "attachment; filename=report.xlsx");

    workbook.xlsx.write(res);
  } catch (err) {
    console.log(err.message);
  }
});

// product offer stars

router.get("/offer-management", verifyAdminLogin, async (req, res) => {
  let offers = await adminHelper.getAllOffers();
  res.render("admin/manage-offer", {
    admin: true,
    adminLogin: req.session.adminLogin,
    offers,
  });
});

// add product offer

router.get("/add-product_offer", verifyAdminLogin, async (req, res) => {
  const AllProductList = await productHelper.getAllProductWithoutOffer();

  res.render("admin/add-product-offers", {
    admin: true,
    adminLogin: req.session.adminLogin,
    AllProductList,
  });
});

router.post("/add-product_offer", (req, res) => {
  adminHelper.addProductOffer(req.body).then((response) => {
    res.redirect("/admin/offer-management");
  });
});

router.get("/delete-offer/:id", (req, res) => {
  const offId = req.params.id;
  console.log(offId);
  adminHelper.deleteOffer(offId).then((response) => {
    console.log(response);
    res.redirect("/admin/offer-management");
  });
});
// product offer ends

// add category offer

router.get("/add-category_offer", verifyAdminLogin, async (req, res) => {
  const AllCategoryList = await productHelper.getAllCategoryWithoutOffer();

  res.render("admin/add-category-offers", {
    admin: true,
    adminLogin: req.session.adminLogin,
    AllCategoryList,
  });
});

router.post("/add_category_offer", (req, res) => {
  adminHelper.addCategoryOffer(req.body).then((response) => {
    res.redirect("/admin/offer-management");
  });
});

// category offer ends

// adding coupen code
router.get("/manage-coupen", verifyAdminLogin, (req, res) => {
  adminHelper.getAllCoupen().then((coupen) => {
    res.render("admin/view-coupen", {
      admin: true,
      adminLogin: req.session.adminLogin,
      coupen,
    });
  });

  router.get("/add-coupen", verifyAdminLogin, (req, res) => {
    res.render("admin/add-coupen-page", {
      admin: true,
      adminLogin: req.session.adminLogin,
    });
  });

  router.post("/add-coupen", (req, res) => {
    adminHelper.addCoupen(req.body).then((response) => {
      res.redirect("/admin/manage-coupen");
    });
  });

  router.get("/delete-coupen/:id", (req, res) => {
    const id = req.params.id;
    adminHelper.deleteCoupen(id).then((response) => {
      console.log(response);
      res.redirect("/admin/manage-coupen");
    });
  });
});

module.exports = router;
