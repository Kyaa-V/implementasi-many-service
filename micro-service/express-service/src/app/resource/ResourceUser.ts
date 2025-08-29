async function toResponseUser(user: any) {
    return {
        message: user.message,
        status: user.status || 500,
        data:{
            id: user.id,
            email: user.email
        }
    }
}