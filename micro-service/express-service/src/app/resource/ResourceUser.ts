export async function toResponseUser(statusCode: number, message: string,user: any) {
    return {
        message: message,
        status:statusCode | 500,
        data:{
            id: user.id,
            email: user.email
        }
    }
}