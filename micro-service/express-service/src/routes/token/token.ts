import express from "express"
import { AuthRequest } from "../../middleware/auth"
import { token } from "../../controller/token/tokenontroller"

const router = express.Router()

router.get('/refresh-token', AuthRequest.authentication, token.refreshToken)

module.exports = router