export interface User{
    id: string,
    name:string,
    email?: string,
    created_at: Date | string,
    updated_at: Date | string,
    roles: Role[]
}

export interface Role{
    id: string,
    name:string
}

export interface SingleUserResponse{
    user: User,
    token: string
}
export interface MultiUserResponse{
    users: User[]
}