import express from "express"
import { authentication } from "../../middleware/auth"
import { token } from "../../controller/token/tokenontroller"

const router = express.Router()

router.get('/refreshToken', authentication, token.refreshToken)

module.exports = router