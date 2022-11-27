const fn = require('../functions/functions')
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

class ShortUser {
	constructor(userParams) {
		this.id = userParams.id
		this.name = userParams.name
		this.surname = userParams.surname
		this.email = userParams.email
	}
}

class AuthController {
	async signup(req, res) {
		try {
			const errors = validationResult(req)
			if(!errors.isEmpty()) {
				return res.status(400).json({ errors });
			}
			const email = req.body.email
			const userExist = await fn.emailAlreadyExist(email)
			if(userExist) {
				return res.status(400).json({ 
					message: "user already exists",
					type: "signup"
				 });
			} 
			const user = await fn.addUser(req.body)
			fn.addRole(user.id, "user")
			res.json({
				userCreated: true,
			})
			if(!user.verified) {
				fn.sendMail(user.id, user.email)
			}
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}
	
	async login(req, res) {
		try {
			const { email, password } = req.body
			const user = await fn.findUser(email)
			if(!user) {
				return res.status(400).json({ 
					message: `user with email ${email} not found`,
					type: "login"
				});
			}
			if(!fn.isPasswordValid(password, user.password)) {
				return res.status(400).json({ 
					message: `password not valid`,
					type: "password"
				 });
			}
			const roles = await fn.getUserRoles(user.id)
			const accessTokenData = await fn.generateAccessToken(user.id, roles)
			const ip = req.headers['visitor-id']
			const refreshToken = await fn.generateRefreshToken(user.id, ip)
			res.json({
				accessTokenData,
				refreshToken
			})
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}
	
	async getUsers(req, res) {
		try {
			const users = await fn.getUsers()
			res.json(users)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async getUser(req, res) {
		try {
			const user = await fn.findUserById(req.user.id)
			const shortUser = new ShortUser(user)
			res.json(shortUser)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}
	
	async verify(req, res) {
		try {
			const verifyToken = req.body.token
			const decodedData = jwt.verify(verifyToken, process.env.SECRET)
			const id = decodedData.id
			await fn.verifyEmail(id)
			res.json({ 
				verified: true,
			})
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}
	
	async checkEmailExisting(req, res) {
		try {
			const email = req.body.email
			const userExists = await fn.emailAlreadyExist(email)
			res.json({ 
				emailExists: userExists,
			})
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async refreshToken(req, res) {
		try {
			const token = JSON.parse(req.headers['refresh-token'])
			const ip = req.headers['visitor-id']
			const tokens = await fn.getTokensByRefresh(token, ip)//?
			res.json(tokens)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async createNewProduct(req, res) {
		try {
			const product = await fn.createProduct(req.body, req.user)
			res.json(product)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async addToFavorite(req, res) {
		try {
			const product = await fn.addOneTo(req.body.product, req.user.id, "in_favorite")
			res.json(product)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async addToCart(req, res) {
		try {
			const product = await fn.addOneTo(req.body.product, req.user.id, "in_cart")
			res.json(product)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async getFromFavorite(req, res) {
		try {
			const products = await fn.findProductsInFavoriteById(req.user.id)
			res.json(products)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async getFromCart(req, res) {
		try {
			const products = await fn.findProductsInCartById(req.user.id)
			res.json(products)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async deleteFromFavorite(req, res) {
		try {
			const product = await fn.deleteOneFrom(req.query.product, req.user.id, 'in_favorite')
			res.json(product)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async deleteFromCart(req, res) {
		try {
			const product = await fn.deleteOneFrom(req.query.product, req.user.id, 'in_cart')
			res.json(product)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async deleteProduct(req, res) {
		try {
			const product = await fn.deleteOneFrom(req.query.product, req.user.id, 'products')
			res.json(product)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async editProduct(req, res) {
		try {
			const images = await fn.editProductImages(req.body.imageData, req.body.id)
			const product = await fn.editProduct(req.body, req.user)
			res.json({
				product,
				images
			})
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	async getProducts(req, res) {
		try {
			const productsWithImages = await fn.getProductsWithImages()
			res.json(productsWithImages)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	mainPage(req, res) {
		res.json("©Wolken Reiter")
	}
}


module.exports = new AuthController();