const db = require("../config/connection");
const collection = require("../config/collection");
const objectid = require("mongodb").ObjectId;

module.exports = {
  addProduct: (productdata) => {
    console.log(productdata);
    return new Promise(async (res, rej) => {
      productdata.discount = 0;
      productdata.finalPrice = productdata.price - productdata.discount;
      productdata.offer = false;
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(productdata)
        .then((response) => {
          res(response.insertedId);
        });
    });
  },
  getAllProduct: () => {
    return new Promise(async (res, rej) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      res(product);
    });
  },

  getFillterdProduct: (category) => {
    return new Promise(async (res, rej) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ category: category })
        .toArray();
      res(product);
    });
  },

  advancedFilter: (subCategory, currectCategory, minPrice, maxPrice) => {
    let ArraysubCategory = [];

    let isArray = Array.isArray(subCategory);

    if (isArray) {
      ArraysubCategory = subCategory;
    } else {
      ArraysubCategory.push(subCategory);
    }

    return new Promise(async (res, rej) => {
      minPrice = parseInt(minPrice);
      maxPrice = parseInt(maxPrice);
      console.log(minPrice);
      console.log(maxPrice);
      let product;
      if (currectCategory == "All") {
        product = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: {
                subcategory: { $in: ArraysubCategory },
                finalPrice: {
                  $gte: minPrice,
                  $lt: maxPrice,
                },
              },
            },
          ])
          .toArray();
      } else {
        product = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: {
                subcategory: { $in: ArraysubCategory },
                category: currectCategory,
                finalPrice: {
                  $gte: minPrice,
                  $lt: maxPrice,
                },
              },
            },
          ])
          .toArray();
      }

      console.log(product);

      res(product);
    });
  },

  addCategory: (category) => {
    category.offer = false;
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .insertOne(category)
        .then((response) => {
          // passing the resonse it may usefull in future
          res(response);
        });
    });
  },
  getAllCategory: () => {
    return new Promise((res, rej) => {
      let category = db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      res(category);
    });
  },
  deleteCategory: (id) => {
    console.log("delete stared");
    console.log(id);
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: objectid(id) })
        .then((response) => {
          // passing the response. may use later
          res(response);
        });
    });
  },

  deleteProduct: (id) => {
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectid(id) })
        .then((response) => {
          res(response);
        });
    });
  },
  getEditProduct: (id) => {
    return new Promise((res, rej) => {
      let editingProduct = db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectid(id) });
      res(editingProduct);
    });
  },
  editProduct: (editedData, id) => {
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectid(id) },
          {
            $set: {
              product_name: editedData.product_name,
              price: editedData.price,
              discription: editedData.discription,
              category: editedData.category,
              stock: editedData.stock,
            },
          }
        )
        .then((response) => {
          res(response.insertedId);
        });
    });
  },
  getProductDetails: (proId) => {
    return new Promise(async (res, rej) => {
      try {
        let ProductDetails = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: objectid(proId) });
        res(ProductDetails);
      } catch (err) {
        rej(err);
      }
    });
  },
  getAllProductWithoutOffer: () => {
    return new Promise(async (res, rej) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { offer: false },
          },
        ])
        .toArray();
      res(product);
    });
  },
  getAllCategoryWithoutOffer: () => {
    return new Promise((res, rej) => {
      let category = db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .aggregate([
          {
            $match: { offer: false },
          },
        ])
        .toArray();
      console.log(category);
      res(category);
    });
  },
};
