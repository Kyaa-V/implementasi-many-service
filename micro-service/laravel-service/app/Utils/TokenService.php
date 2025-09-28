<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class TokenService
{
    protected $privateKey;
    protected $publicKey;

    public function __construct()
    {
        // Private key untuk SIGN (encode)
        $this->privateKey = file_get_contents(storage_path('keys/private.pem'));
        
        // Public key untuk VERIFY (decode)  
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
        
        // ✅ Gunakan PRIVATE key untuk encode
        return JWT::encode($payload, $this->privateKey, 'RS256');
    }
    
    public function verify($token)
    {
        try {
            // ✅ Gunakan PUBLIC key untuk decode
            return JWT::decode($token, new Key($this->publicKey, 'RS256'));
        } catch (Exception $e) {
            throw new Exception('Invalid or expired token: ' . $e->getMessage());
        }
    }
}