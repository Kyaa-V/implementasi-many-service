export interface ResponseApi<T>{
    payload:{
        success: boolean,
        message: string,
        data: T
    }
}

