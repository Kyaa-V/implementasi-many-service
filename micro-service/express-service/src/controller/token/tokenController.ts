import { Request, Response, NextFunction } from "express";
import { createToken } from "../../utils/token";
import { toResponseUser } from "../../app/resource/ResourceUser";
import { sessionTimeOut } from "../../app/resource/sessionTimeOut";
import { DecodedUser } from "../../app/model/DecodeUser";
import { logger } from "../../logging/Logging";

const RedisClient = require("../../config/RedisClient.js");

export class Token {
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const headers = req.headers["authorization"] as string;

      if (!headers || !headers.startsWith("Bearer ")) {
        return sessionTimeOut(res, false, 401, "No token provided or invalid format");
      }

      const tokenInHeaders = headers.split(" ")[1];
      if (!tokenInHeaders) {
        return sessionTimeOut(res, false, 401, "No access token provided");
      }

      // cek blacklist
      const isBlacklisted = await RedisClient.get(`blacklist:${tokenInHeaders}`);
      logger.info(`isBlacklisted: ${isBlacklisted}`);
      if (isBlacklisted) {
        return sessionTimeOut(res, false, 401, "Your token is blacklisted, please login again");
      }

      // coba decode access token
      let decodedAccess: DecodedUser | null = null;
      try {
        decodedAccess = (await createToken.verify(tokenInHeaders)) as DecodedUser;
      } catch (err) {
        // token invalid atau expired → lanjut ke proses refresh
        logger.warn("Access token expired or invalid, trying refresh...");
      }

      logger.info(`decoded access token: ${JSON.stringify(decodedAccess)}`);

      // kalau masih valid, lanjutkan request tanpa refresh
      if (decodedAccess) {
        req.user = decodedAccess;
        logger.info("Access token still valid, no need to refresh");
        return res.status(200).json({
          success: true,
          message: "Access token is still valid",
          data: {
            id: decodedAccess.id,
            name: decodedAccess.name,
            roles: decodedAccess.roles,
          },
          token: tokenInHeaders
        });
      }

      // kalau expired → refresh dengan refresh token
      return await doRefresh(req, res, tokenInHeaders);
    } catch (error) {
      next(error);
    }
  }
}

// helper function (private)
async function doRefresh(req: Request, res: Response, oldAccessToken: string) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decodedRefresh = (await createToken.verify(refreshToken)) as DecodedUser;
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

  // blacklist access token lama
  try {
    const decodedOld = (await createToken.verify(oldAccessToken)) as DecodedUser;
    const expInSeconds = decodedOld.exp - Math.floor(Date.now() / 1000);
  
    logger.info(`decodedOld.exp: ${decodedOld.exp}`);
    logger.info(`currentTime: ${Math.floor(Date.now() / 1000)}`);
    logger.info(`expInSeconds: ${expInSeconds}`);
    
    if (expInSeconds > 0) {
      await RedisClient.set(`blacklist:${oldAccessToken}`, "true", {
        EX: expInSeconds,
      });
    }
  } catch (err) {
    logger.warn("Failed to decode old access token for blacklist");
  }

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
}
