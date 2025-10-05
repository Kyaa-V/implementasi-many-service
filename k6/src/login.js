import http from 'k6/http';
import { check, sleep } from 'k6';

export default function loginUser(userId) {
  const res = http.post('http://host.docker.internal:8080/api/auth/v1/auth/login',
    JSON.stringify({
      email: `karina${userId}@gmail.com`,
      password: 'rahasia'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

  const checkStatus = check(res, {
    'is status 200': (r) => r.status === 200,
  });

  if (checkStatus && res.status === 200) {
    try {
      const token = res.json().payload.data.token;
      return { token }; // Mengembalikan objek dengan properti `token`
    } catch (error) {
      console.error(`VU ${userId}: Failed to parse response - ${error}`);
      console.error(`Response body: ${res.body}`);
    }
  } else {
    console.error(`VU ${userId}: Login failed - Status: ${res.status}`);
    console.error(`Response: ${res.body}`);
  }

  sleep(1);
  return null; // Mengembalikan null jika login gagal
}
