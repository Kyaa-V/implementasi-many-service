<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class TokenService
{
    protected $publicKey;

    public function __construct()
    {
        $this->publicKey = file_get_contents(storage_path('keys/public.pem'));
    }
    public function create($payload, $expiryMinutes = 60)
    {
        $issuedAt = time();
        $expire = $issuedAt + ($expiryMinutes * 60);
        
        $payload = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $expire
        ]);
        
        return JWT::encode($payload, $this->publicKey, 'RS256');
    }
    
    public function verify($token)
    {
        try {
            return $decoded = JWT::decode($token, new Key($this->publicKey, 'RS256'));
        } catch (Exception $e) {
            throw new Exception('Invalid or expired token');
        }
    }
}
