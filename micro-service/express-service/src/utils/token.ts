const jwt = require('jsonwebtoken')

export class createToken{
    static async token(payload:any, secret:any, expiresIn: string){
        return await jwt.sign(payload, secret, {expiresIn} )
    }
    static async verify(token:string, secret:any){
        return await jwt.verify(token, secret)
    }
}