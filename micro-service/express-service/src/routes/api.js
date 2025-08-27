const express = require('express')
const router = express.Router()
const user = require('./user/user.js')

router.use('/user', user)

module.exports = router;