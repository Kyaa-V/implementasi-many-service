import http from 'k6/http'

export default function getuserMe(token){
    const res = http.get('http://host.docker.internal:8080/api/auth/v1/user/get-user-me',{
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    return res
}