const { CartItem, Order } = require("../models/order");
const { errorHandler } = require("../helper/dbErrorsHandler");

exports.create = (req, res) => {
  // console.log("ORDER", req.body);

  req.body.order.user = req.profile;

  const order = new Order(req.body.order);

  order.save((error, data) => {
    if (error) {
      return res.status(400).json({
        error: errorHandler(error),
      });
    }
    res.json(data);
  });
};

exports.listOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name address")
    .sort("-created")
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({
          error: "Orders not found",
        });
      }
      return res.json(orders);
    });
};

exports.getStatusValue = (req, res) => {
  return res.json(Order.schema.path("status").enumValues);
};

exports.orderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name price")
    .exec((err, order) => {
      if (err || !order) {
        return res.status(400).json({
          error: "Order not found",
        });
      }
      req.order = order;
      next();
    });
};

exports.updateOrderStatus = (req, res) => {
  Order.updateMany(
    {
      _id: req.body.orderId,
    },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        return res.status(400).json({
          error: "Order not updated",
        });
      }
      return res.json(order);
    }
  );
};
