import express from "express"
const router = express.Router()
const user = require('./user/user.ts')
const token = require('./token/token.ts')
const auth = require('./auth/auth.ts')

router.use('/user', user)
router.use('/token', token)
router.use('/auth', auth)

module.exports = router;