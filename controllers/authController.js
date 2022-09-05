const fn = require('../functions/functions')
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

class ShortUser {
	constructor(userParams) {
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
			const tokens = await fn.getTokensByRefresh(token, ip)
			res.json(tokens)
		} catch(err) {
			res.status(400).json({message: err.message});
		}
	}

	mainPage(req, res) {
		res.json("©Wolken Reiter")
	}
}


module.exports = new AuthController();