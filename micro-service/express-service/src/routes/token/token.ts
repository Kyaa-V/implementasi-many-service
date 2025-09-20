import express from "express"
import { Token } from "../../controller/token/tokenController"

const router = express.Router()

router.get('/refresh-token', Token.refreshToken)

module.exports = router