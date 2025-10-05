import http from 'k6/http';
import { check, fail, sleep } from 'k6';

export default function postProduct(token, productId){
    const payload = {
      "bookname" : `sampledhdg${productId}`,
      "price" : 8.3,
      "stock" : 13,
      "category": [1,2],
      "description" : `Thisdkjddka${productId}`,
      "image" : null
    }
    const res = http.post('http://host.docker.internal:8080/api/product/api/v1/products', JSON.stringify(payload),{
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorizaton': `Bearer ${token}`
      }
    })
    return res
}