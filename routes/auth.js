const express = require("express");
const router = express.Router();

const { signup, signin, signout } = require("../controller/auth");
const { useSignupValidator } = require("../validator");

router.post("/signup", useSignupValidator, signup);
router.post("/signin", signin);
router.get("/signout", signout);

module.exports = router;
