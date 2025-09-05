import express from "express"
const router = express.Router()
const user = require('./user/user.ts')
const token = require('./token/token.ts')

router.use('/user', user)
router.use('/token', token)

module.exports = router;