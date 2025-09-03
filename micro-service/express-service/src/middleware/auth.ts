import { NextFunction, Request, Response } from "express";
import { createToken } from "../utils/token";
import { toResponseUser } from "../app/resource/ResourceUser";

export const authentication = async function (req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    return createToken.verify(token, process.env.JWT_SECRET_TOKEN, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: "Invalid Token unauthorized" });
      }
      req.user = decoded;
      return next();
    });
  }

  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No Token provided" });
  }

  createToken.verify(refreshToken, process.env.JWT_SECRET_TOKEN, async (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
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

    req.user = decoded;

    return toResponseUser(200, "Token refreshed successfully", {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    }, newAccessToken);
  });
};
