import { Request, Response, NextFunction } from "express";
import { createToken } from "../../utils/token";
import { toResponseUser } from "../../app/resource/ResourceUser";
import { sessionTimeOut } from "../../app/resource/sessionTimeOut";
import { DecodedUser } from "../../app/model/DecodeUser";
import { logger } from "../../logging/Logging";

const RedisClient = require("../../config/RedisClient.js");

export class Token {
  static async refreshToken(req: Request, res: Response, next: NextFunction) {

    const headers = req.headers["authorization"] as string;

    if (!headers || !headers.startsWith("Bearer ")) {
      return sessionTimeOut(res, false, 401, "No token provided or invalid format");
    }

    const tokenInHeaders = headers.split(" ")[1];
    try {
      if (!tokenInHeaders) {
        return sessionTimeOut(res, false, 401, "No access token provided");
      }

      // coba decode access token
      let decodedAccess: DecodedUser | null = null;
      try {
        decodedAccess = await createToken.verify(tokenInHeaders);
      } catch (err) {
        // token invalid atau expired → lanjut ke proses refresh
        logger.warn("Access token expired or invalid, trying refresh...");
        return await doRefresh(req, res, tokenInHeaders);
      }

      logger.info(`decoded access token: ${JSON.stringify(decodedAccess)}`);

      // kalau masih valid, lanjutkan request tanpa refresh
      if (decodedAccess) {
        req.user = decodedAccess;
        logger.info("Access token still valid, no need to refresh");
        return res.status(200).json({
          payload: {
            success: true,
            message: "Access token is still valid",
            data: {
              user: {
                id: decodedAccess.id,
                name: decodedAccess.name,
                roles: decodedAccess.roles,
              },
              token: tokenInHeaders
            },
          }
        });
      }
    } catch (error) {
      next(error)
    }
  }
}

// helper function (private)
async function doRefresh(req: Request, res: Response, oldAccessToken: string) {
  logger.info("starting refresh token process...")
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "your session has expired, please login again" });
  }

  try {
    logger.info(`refreshToken from cookie: ${refreshToken}`)
    
    logger.info("starting decode refresh token process...")
    const decodedRefresh = await createToken.verify(refreshToken);
    logger.info(`decoded refresh token: ${JSON.stringify(decodedRefresh)}`);

    // cek refresh token di Redis
    const storedRefreshToken = await RedisClient.get(`user:refreshToken:${decodedRefresh.id}`);
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return sessionTimeOut(res, false, 401, "Your session has expired, please login again");
    }

    // generate access token baru
    const newAccessToken = await createToken.token(
      { id: decodedRefresh.id, name: decodedRefresh.name, roles: decodedRefresh.roles },
      "15m"
    );

    // set user ke request
    req.user = decodedRefresh as DecodedUser;

    return toResponseUser(
      res,
      true,
      201,
      "Token refreshed successfully",
      {
        id: decodedRefresh.id,
        name: decodedRefresh.name,
        roles: decodedRefresh.roles,
      },
      newAccessToken
    );
  } catch (error) {
    logger.error(`Error during refresh token process: ${error}`)
    return sessionTimeOut(res, false, 401, "Your session has expired, please login again");
  }
}
