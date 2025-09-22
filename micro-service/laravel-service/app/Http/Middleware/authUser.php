<?php

namespace App\Http\Middleware;

use App\Utils\TokenService;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class authUser
{
    protected $tokenService;

    public function __construct(TokenService $tokenService)
    {
        $this->tokenService = $tokenService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $token = $request->bearerToken();
            if (!$token) {
                Log::warning('No token provided in request');
                return response()->json([
                    "payload" => [
                        "message" => "No token provided"
                    ]
                ], 401);
            }

            Log::info('Token found, attempting to verify');
            $decoded = $this->tokenService->verify($token);
            Log::info('Token verified successfully');

            // Fix: Pastikan struktur data konsisten

            $authUser = [
                'id'    => $decoded->id ?? null,
                'name'  => $decoded->name ?? null,
                'role' => $decoded->roles[0]->name ?? null, // Ambil role pertama
            ];

            $request->merge(['auth_user' => $authUser]);
            
            Log::info('Auth user data:', $authUser);

        } catch (\Throwable $th) {
            Log::error('Error in auth middleware:', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);
            return response()->json([
                "payload" => [
                    "message" => "Invalid or expired token",
                    "error" => $th->getMessage() // Tambahkan untuk debugging
                ]
            ], 403);
        }

        Log::info('Auth middleware passed, proceeding to next middleware/controller');
        return $next($request);
    }
}