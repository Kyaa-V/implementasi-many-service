import { Request, Response, NextFunction } from "express";
import { ResponseError } from "../error/respon-error"

async function MiddlewareError(err: ResponseError, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ResponseError) {
        res.status(err.status).json({
            message: err.message
        })
    } else {
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


module.exports = {
    MiddlewareError
}