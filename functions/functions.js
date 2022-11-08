require("dotenv").config()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const knex = require('knex')({
	client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_BASE_NAME,
    user: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD
  },
});

class User {
	constructor(userParams) {
		this.name = userParams.name
		this.surname = userParams.surname
		this.phone = userParams.phoneGroup.phone
		this.country_code = userParams.phoneGroup.country
		this.email = userParams.email
		this.password = bcrypt.hashSync(userParams.passwordGroup.password, 7); 
	}
}

class Product {
	constructor(productParams, userId) {
		this.name = productParams.name
		this.price = productParams.price
		this.description = productParams.description
		this.user_id = userId
	}
}

class ProductImage {
	constructor(image, productId) {
		this.product_id = productId
		this.image = image
	}
}

class FavoriteProduct {
	constructor(productId, userId) {
		this.product_id = productId
		this.user_id = userId
	}
}

class CartProduct {
	constructor(productId, userId) {
		this.product_id = productId
		this.user_id = userId
	}
}

class Functions {
	async addUser(userParams) {
		const user = new User(userParams)
		const response = await knex('users').insert(user).returning("*").limit(1).then(r => r[0])
		return response
	}

	async verifyEmail(id) {
		const user = await knex('users').where({ id }).update({
			verified: true
		}).returning("*").limit(1).then(r => r[0])
		return user
	}

	async emailAlreadyExist(email) {
		const user = await knex('users').select().where({ email }).limit(1).then(r => r[0])
		return !!user;
	};

	async findUser(email) {
		const user = await knex('users').select().where({ email }).limit(1).then(r => r[0])
		return user;
	};

	async findUserById(id) {
		const user = await knex('users').select().where({ id }).limit(1).then(r => r[0])
		return user;
	};

	async getUsers() {
		const users = await knex('users').select()
		return users;
	};

	async addRole(user_id, role) {
		const roleObject = {
			user_id,
			role
		}
		const response = await knex('roles').insert(roleObject).returning("*")
		return response;
	};

	async getUserRoles(id) {
		const roles = await knex('roles').select().where({ user_id: id })
		return roles;
	};

	generateAccessToken(id, roles) {
		const payload = { id, roles }
		const currentDate = new Date();
		const expiresAt = currentDate.setMinutes(currentDate.getMinutes() + 15);
		const accessToken = jwt.sign(payload, process.env.SECRET, { expiresIn: "15m" })
		return { 
			expiresAt,
			accessToken
		 }
	}

	async generateRefreshToken(id, ip) {
		const payload = { id, ip }
		const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" })
		const rTokens = await knex('refresh_tokens').select().where({ user_id: id })
		if(rTokens.map(r => r.ip).includes(ip)) {
			await knex('refresh_tokens').where({ user_id: id, ip }).update({ user_id: id, token, ip })
			return token
		} else {
			if(rTokens.length > 2) await knex('refresh_tokens').del({ id })
			knex('refresh_tokens').insert({ user_id: id, token, ip })
			.returning("*").limit(1).then(r => r[0])
			return token
		}
	}

	generateVerifyToken(id) {
		const payload = { id }
		const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "1h" })
		return token
	}

	async getTokensByRefresh (token, ip) {
		try {
			const decodedData = jwt.verify(token, process.env.SECRET)
			const id = decodedData.id
			const ips = "123"
			const refresh = await knex('refresh_tokens').where({ user_id: id, ip }).then(r => r[0])
			if (!refresh) {
				await knex('refresh_tokens').del({ user_id: id })
				return
			}
			const roles = await this.getUserRoles(id)
			const newRefreshToken = await this.generateRefreshToken(id, ip)
			const newAccessToken = await this.generateAccessToken(id, roles)
			return {
				accessTokenData: newAccessToken,
				refreshToken: newRefreshToken
			}
		} catch (err) {
			console.error(err.message)
		}
	}

	isPasswordValid(password, hash) {
		return bcrypt.compareSync(password, hash)
	}

	async sendMail(id, email) {
		try {
			const verifyToken = this.generateVerifyToken(id)
			let transporter = nodemailer.createTransport({
				host: process.env.MAIL_HOST,
				port: process.env.MAIL_PORT,
				secure: true,
				auth: {
					user: process.env.MAIL_LOGIN,
					pass: process.env.MAIL_PASSWORD,
				},
			})
			const link = process.env.HOST +  "/#/verify/" + verifyToken
			const html = `<p>Click on the link <strong>to verify</strong> your email</p>
			<a href="${link}">${link}</a>`
				await transporter.sendMail({
					from: '"Wolken Reiter Shop" <wr-store@mail.ru>',
					to: email,
					subject: 'Verification',
					html,
				})
		} 
		catch (err) {
			console.error(err.message)
		}
	}

	async createProduct(productParams, user) {
		try {
			const userData = user.roles?.[0]
			if(!userData) return
			const product = new Product(productParams, userData.id)
			const images = productParams.images
			const responseProduct = await knex('products').insert(product).returning("*").limit(1).then(r => r[0])
			images.forEach(async (img) => {
				const image = new ProductImage(img, responseProduct.id)
				await knex('product_images').insert(image)
			})
			return responseProduct
		} catch (err) {
			console.error(err.message)
		}
	}

	async addOneTo(productId, userId, table) {
		try {
			const product = new FavoriteProduct(productId, userId)
			const responseProduct = await knex(table)
			.insert(product)
			.returning("*")
			.limit(1)
			.then(r => r[0])
			return responseProduct
		} catch (err) {
			console.error(err.message)
		}
	}

	async findProductsInFavoriteById(id) {
		const shortProducts = await knex('in_favorite').select().where({ user_id: id }).returning("*")
		const products = await this.getProductsWithImages(shortProducts.map(p => p.product_id))
		return products;
	};

	async findProductsInCartById(id) {
		const shortProducts = await knex('in_cart').select().where({ user_id: id }).returning("*")
		const products = await this.getProductsWithImages(shortProducts.map(p => p.product_id))
		return products;
	};

	async deleteOneFrom(productId, userId, table) {
		const product = await knex(table)
		.where({ product_id: productId, user_id: userId })
		.del()
		.returning("*")
		.limit(1)
		.then(r => r[0])
		return product;
	}

	async deleteOneImage(imageId, productId, table) {
		const image = await knex(table)
		.where({ product_id: productId, id: imageId })
		.del()
		.returning("*")
		.limit(1)
		.then(r => r[0])
		return product;
	}

	async editProduct(productParams, user) {
		try {
			const product = await knex('products').where({ id: productParams.id, user_id: user.id }).update({
				name: productParams.name,
				description: productParams.description,
				price: productParams.price,
			}).returning("*").limit(1).then(r => r[0])
			return product
		} catch (err) {
			console.error(err.message)
		}
	};

	async editProductImages(imageData, productId) {
		try {
			await Promise.all(imageData.deletedImageIds
				.map(
					imageId => this.deleteOneImage(imageId, productId, "product_images")
				)
			)
			return await Promise.all(imageData.addedImages
				.map(async (image) => {
					const newImg = new ProductImage(image, productId)
					return await knex('product_images').insert(newImg)
				})
			)
		} catch (err) {
			console.error(err.message)
		}
	};

	async getProducts(ids = null) {
		try {
			return ids ? 
			await Promise.all(ids
				.map(
					id => knex("products")
					.select()
					.where({ id })
					.returning("*")
					.limit(1)
					.then(r => r[0])
				)
			):
			await knex("products").limit(20)
		} catch (err) {
			console.error(err.message)
		}
	}

	async getProductImages(id) {
		try {
			return await knex("product_images").select().where({ product_id: id })
		} catch (err) {
			console.error(err.message)
		}
	}

	async getProductsWithImages(ids = null) {
		try {
			const products = await this.getProducts(ids)
			const images = await Promise.all(products.map((p) => this.getProductImages(p.id)))
			const productsWithImages = products.map((p, i) => ({
				...p,
				images: images[i] || null
			}))
			return productsWithImages
		} catch (err) {
			console.error(err.message)
		}
	}
}

module.exports = new Functions()