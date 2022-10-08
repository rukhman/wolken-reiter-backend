const Router = require('express');
const router = new Router()
const controller = require('../controllers/authController')
const { check } = require('express-validator');
const authMiddleware = require('../middleWares/authMiddleWare')
const emailValidate = [
	check("email", "email can not be empty").notEmpty(),
	check("email", "length: 4-100").isLength({ min: 4, max: 100}),
	check("name", "name can not be empty").notEmpty(),
];

router.get("/", controller.mainPage)
router.get("/users", [authMiddleware], controller.getUsers)
router.get("/user", [authMiddleware], controller.getUser)
router.get("/refresh", controller.refreshToken)
router.get("/products", controller.getProducts)
router.get("/favorite", [authMiddleware], controller.getFromFavorite)
router.get("/cart", [authMiddleware], controller.getFromCart)

router.post("/signup", emailValidate, controller.signup)
router.post("/login", controller.login)
router.post("/check", controller.checkEmailExisting)
router.post("/verify", controller.verify)
router.post("/favorite", [authMiddleware], controller.addToFavorite)
router.post("/cart", [authMiddleware], controller.addToCart)
router.post("/create-new-product", [authMiddleware], controller.createNewProduct)

router.delete("/favorite", [authMiddleware], controller.deleteFromFavorite)
router.delete("/cart", [authMiddleware], controller.deleteFromCart)

module.exports = router