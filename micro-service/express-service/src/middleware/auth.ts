import { NextFunction, Request, Response } from "express";
import { createToken } from "../utils/token";
import { toResponseUser } from "../app/resource/ResourceUser";
import { sessionTimeOut } from "../app/resource/sessionTimeOut";

interface DecodedUser {
  id: string;
  email: string;
  name: string;
}

export const authentication = async function (req: Request, res: Response, next: NextFunction) {
  const authHeader= req.headers["authorization"] as string;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    return createToken.verify(token, process.env.JWT_SECRET_TOKEN, (err: any, decoded: any) => {
      if (err) {
        return sessionTimeOut(res, false, 401, "Invalid Token unauthorized");
      }
      req.user = decoded as DecodedUser;
      return next();
    });
  }

  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return sessionTimeOut(res, false, 401, "No token Provided")
  }

  createToken.verify(refreshToken, process.env.JWT_SECRET_TOKEN, async (err: any, decoded: any) => {
    if (err) {
      return sessionTimeOut(res, false, 401, "Invalid Token Please LogIn again")
    }

    const newAccessToken = await createToken.token(
      { id: decoded.id, email: decoded.email, name: decoded.name },
      process.env.JWT_SECRET_TOKEN,
      "15m"
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    req.user = decoded as DecodedUser;

    return toResponseUser(res, true, 201, "Token refreshed successfully", {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    }, newAccessToken);
  });
};
