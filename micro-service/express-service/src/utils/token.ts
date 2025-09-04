import { DecodedUser } from "../app/model/DecodeUser";

const jwt = require('jsonwebtoken')

export class createToken{
    static async token(payload:any, secret:any, expiresIn: string){
        return await jwt.sign(payload, secret, {expiresIn} )
    }
    static verify(token: string, secret: string): Promise<DecodedUser>{
        return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err: any, decoded: any) => {
            if (err) reject(err);
            else resolve(decoded as DecodedUser);
        });
        });
    }
}