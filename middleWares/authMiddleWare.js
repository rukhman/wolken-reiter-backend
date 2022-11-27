require("dotenv").config()
const jwt = require('jsonwebtoken');

module.exports = async function(req, res, next) {
	if(req.method === "OPTIONS") {
		next()
	}
	try {
		let token = req?.headers?.authorization?.split(" ")[1]
		if(!token) {
			return res.status(401).json({ message: "not authorized" })
		}
		const decodedData = await jwt.verify(token, process.env.SECRET)
		req.user = decodedData
		next()
	}catch(e) {
		return res.status(403).json({ message: e.message })
	}
}