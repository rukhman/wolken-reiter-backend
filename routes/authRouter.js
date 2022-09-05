const Router = require('express');
const router = new Router()
const controller = require('../controllers/authController')
const { check } = require('express-validator');
const authMiddleware = require('../middleWares/authMiddleWare')

router.get("/users", [authMiddleware], controller.getUsers)
router.get("/user", [authMiddleware], controller.getUser)
router.post("/signup", [
	check("email", "email can not be empty").notEmpty(),
	check("email", "length: 4-100").isLength({ min: 4, max: 100}),
	check("name", "name can not be empty").notEmpty(),
], controller.signup)
router.post("/login", controller.login)
router.post("/check", controller.checkEmailExisting)
router.post("/verify", controller.verify)
router.get("/refresh", controller.refreshToken)
router.get("/test", controller.refreshToken)

module.exports = router