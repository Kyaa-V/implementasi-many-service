import getuserMe from './src/get-user-me.js';
import loginUser from './src/login.js';
import http from 'k6/http';
import postProduct from './src/product.js';

export const options = {
  scenarios: {
    user: {
      exec: 'user',
      executor: 'constant-vus',
      vus: 10,
      duration: '10s'
    },
    products: {
      exec: 'product',
      executor: 'constant-vus',
      vus: 10,
      duration: '10s'
    }
  }
};

export function user(){
  const userId = __VU;

  const login = loginUser((userId % 9) + 1)

  if(login && login.token){
    console.log('login passed')
  }else{
    console.error(`VUId${userId}`)
  }

  const getUser = getuserMe(login.token)

  console.log(getUser.json())
}

export function product(){

  const productId = __VU

  const login = loginUser(( productId % 9 ) + 1)

  if(login && login.token){
    console.log('login passed in product')
  }else{
    console.error(`VUId${userId}`)
  }

  const dataProduct = postProduct(login.token, productId)
  console.log(dataProduct.json())
}

