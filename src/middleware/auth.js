const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
  try {
    // Replace Bearer with nothing
    const token = req.header('Authorization').replace('Bearer', '').trim()
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

    if (!user) {
      throw new Error()
    }

    // Because the user is already fetched from the database, we can just add a property to
    // the request and other route handlers will be able to use it later on.
    req.user = user
    req.token = token
    next()
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate!' })
  }
}

module.exports = auth 