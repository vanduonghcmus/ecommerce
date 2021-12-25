const { exec } = require("child_process");
const formidable = require("formidable");
const fs = require("fs");
const _ = require("lodash");

const { errorHandler } = require("../helper/dbErrorsHandler");

const Product = require("../models/product");

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        console.log(product);
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;

      next();
    });
};

exports.read = (req, res) => {
  req.product.photo = undefined;

  res.json(req.product);
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtension = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }

    // check all field
    const { name, description, price, category, quantity, shipping } = fields;

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All field are required",
      });
    }

    let product = new Product(fields);

    // 1kb=1000
    // 1mb=1000000

    if (file.photo) {
      if (file.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb size",
        });
      }

      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }

      return res.json(result);
    });
  });
};

exports.remove = (req, res) => {
  let product = req.product;

  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    return res.json({
      message: "Delete product successfully",
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtension = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }

    let product = req.product;
    product = _.extend(product, fields);

    // 1kb=1000
    // 1mb=1000000

    if (file.photo) {
      // console.log("file.photo", file.photo);
      if (file.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb size",
        });
      }

      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }

      return res.json(result);
    });
  });
};

/**
 *  Sell / Arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by sell = /products?sortBy=createAt&order=desc&limit=4
 * if no param, then return all product
 */

/**
 *  Mongoose knowledge
 * select() : if "-field" -> get all exclude field, if "field" -> include field
 * populate() : get fields associated with current field
 * sort() :
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }
      return res.json(products);
    });
};

/**
 * MongoDb knowledge
 * $gte selects the documents where the value of the field is greater than or equal to (i.e. >=) a specified value
 * $ne selects the documents where the value of the field is not equal to the specified value. This includes documents that do not contain the field.
 */

/**
 * it will the products based on the req product category
 * other product has the same category will be returned
 */

/**
 * @todo: get products has the same category and not includes product has same id
 */

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate("category", "_id name")
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }
      return res.json(products);
    });
};

exports.listCategories = (req, res) => {
  Product.distinct("category", {}, (err, categories) => {
    if (err) {
      return res.status(400).json({
        error: "Categories not found",
      });
    }
    return res.json(categories);
  });
};

/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 * /products?sortBy=sold&order=desc&limit=4
 */

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "asc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 4;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .skip(skip)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }
      return res.json({
        size: products.length,
        products,
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.listSearch = (req, res) => {
  /** create query object to hold search value and category value */
  const query = {};

  // assign search query value to query name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" };

    // assignee category value to query category
    if (req.query.category && req.query.category !== "All") {
      query.category = req.query.category;
    }

    // find products base on query object with 2 properties
    // category and search

    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      } else {
        return res.json(products);
      }
    }).select("-photo");
  }
};

// middleware
exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item._id },
        // If you were using the MongoDB driver directly, you'd need to do
        // `update: { $set: { title: ... } }` but mongoose adds $set for
        // you.
        update: {
          $inc: {
            quantity: -item.count,
            sold: +item.count,
          },
        },
      },
    };
  });

  Product.bulkWrite(bulkOps, (err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Could not product update",
      });
    }
    next();
  });
};
