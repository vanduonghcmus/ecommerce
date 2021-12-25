const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const expressValidator = require("express-validator");

// import router
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const categoryRouter = require("./routes/category");
const productRouter = require("./routes/product");
const braintree = require("./routes/braintree");
const order = require("./routes/order");

// App
const app = express();

// Db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
  })
  .then(() => console.log("DB connected"));

// middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

// Routes middleware
app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", categoryRouter);
app.use("/api", productRouter);
app.use("/api", braintree);
app.use("/api", order);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running port ${port}`);
});
