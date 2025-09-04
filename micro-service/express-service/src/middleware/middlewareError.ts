import { Request, Response, NextFunction } from "express";
import { ResponseError } from "../error/respon-error"
import {ZodError } from "zod"
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const MiddlewareError = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ZodError) {
    res.status(400).json({ errors: error.message });
  }else if(error instanceof ResponseError){
    res.status(error.status).json({errors:error.message})
  }else if(error instanceof JsonWebTokenError){
    res.status(401).json({error: error.message})
  }else if(error instanceof TokenExpiredError){
    res.status(401).json({error: error.message})
  }else{
    res.status(500).json({errors:error.message})
  }
};
