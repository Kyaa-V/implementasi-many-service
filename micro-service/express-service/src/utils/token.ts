import { DecodedUser } from "../app/model/DecodeUser";

const jwt = require('jsonwebtoken')
const fs = require("fs")
const path = require("path")


const secretKey = fs.readFileSync(
  path.join(__dirname, "../keys/private.pem"),
  "utf8"
);
const publicKey = fs.readFileSync(
  path.join(__dirname, "../keys/public.pem"),
  "utf8"
);
export class createToken{
    static async token(payload:any, expiresIn: string){
        return await jwt.sign(payload, secretKey, {expiresIn, algorithm: "RS256"} )
    }
    static verify(token: string): Promise<DecodedUser>{
        return new Promise((resolve, reject) => {
        jwt.verify(token, publicKey, (err: any, decoded: any) => {
            if (err) reject(err);
            else resolve(decoded as DecodedUser);
        });
        });
    }
}