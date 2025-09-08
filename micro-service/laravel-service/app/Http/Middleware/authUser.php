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
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if(!$token){
            return response()->json([
                "payload"=>[
                    "message"=> "Not token provided"
                ]
            ]);
        }

        $decoded = $this->tokenService->verify($token);
        Log::info('decoded token:',(array)$decoded);
        return $next($request);
    
    }
}
