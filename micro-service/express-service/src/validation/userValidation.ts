import { ZodType, z } from "zod";

export class userValidation{
    static REGISTER = z.object({
        name: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(6).max(20)
    })

    static LOGIN = z.object({
        email: z.string().email(),
        password: z.string().min(6).max(20)
    })
}