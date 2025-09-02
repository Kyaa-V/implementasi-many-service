export async function toResponseUser(statusCode: number, message: string,user: any, token: string) {
    return {
        payload:{
            message: message,
            status:statusCode || 500,
            token: token,
            data:{
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        },
    }
}