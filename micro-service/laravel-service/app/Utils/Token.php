<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class TokenService
{
    public function create($payload, $expiryMinutes = 60)
    {
        $issuedAt = time();
        $expire = $issuedAt + ($expiryMinutes * 60);
        
        $payload = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $expire
        ]);
        
        return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
    }
    
    public function verify($token)
    {
        try {
            return JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
        } catch (Exception $e) {
            throw new Exception('Invalid or expired token');
        }
    }
}
