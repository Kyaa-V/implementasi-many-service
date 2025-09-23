import { authController } from "../../controller/auth/authController"
import { AuthRequest } from "../../middleware/auth"


const express = require('express')
const router = express.Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', AuthRequest.authentication, authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)


module.exports = router