<?php

namespace App\Http\Middleware;

use App\Utils\TokenService;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
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
        // try {
            $token = $request->bearerToken();

            if($token){
                try {
                    Log::info('Token found, attempting to verify');

                    $decoded = $this->tokenService->verify($token);
                    Log::info('Token verified successfully');

                    $authUser = [
                        'id'    => $decoded->id ?? null,
                        'name'  => $decoded->name ?? null,
                        'roles' => $decoded->roles[0]->name ?? null,
                    ];

                    $request->merge(['auth_user' => $authUser]);

                    Log::info('Auth user data:', $authUser);

                    return $next($request);
                } catch (\Throwable $th) {
                    Log::error('access token invalid/expired, trying refresh....');
                }
            }else{
                Log::info("no token to access, trying to refresh token...");
            }


            $refreshToken = $request->cookie('refreshToken');
            Log::info('refresh token from cookie:', ['refreshToken' => $refreshToken]);

            if(!$refreshToken){
                Log::warning('your session has expired, please login again');
                return response()->json([
                    "payload" =>[
                        "message" => "your session has expired, please login again",
                        "success" => false
                    ]
                ], 403);
            }

            $decodedRefreshToken = $this->tokenService->verify($refreshToken);
            Log::info('Refresh token verified successfully');
            Log::info('users', ['users' => $decodedRefreshToken]);
            Log::info('usersId', ['usersId' => $decodedRefreshToken->id]);

            $storedRefreshToken = Redis::get('user:refreshToken:' . $decodedRefreshToken->id);

            Log::info('refreshToken', ['refreshToken' => $refreshToken]);
            Log::info('stored refresh token', ['stored refresh token' => $storedRefreshToken]);

            if($refreshToken !== $storedRefreshToken){
                Log::warning('Refresh token does not match stored token');
                return response()->json([
                    "payload" => [
                        "message" => "Invalid refresh token, please login again",
                        "success" => false
                    ]
                ]);
            }
            $newToken = $this->tokenService->create([
                'id' => $decodedRefreshToken->id,
                'name' => $decodedRefreshToken->name,
                'roles' => $decodedRefreshToken->roles[0]->name ?? null
            ], 15);

            Log::info('token: ' . $newToken);

            $response = $next($request);

            $response->headers->set('Authorization', 'Bearer ' . $newToken);

            $authUser = [
                'id'    => $decodedRefreshToken->id ?? null,
                'name'  => $decodedRefreshToken->name ?? null,
                'roles' => $decodedRefreshToken->roles[0]->name ?? null,
            ];

            $request->merge(['auth_user' => $authUser]);

            Log::info('Auth user data:', $authUser);

            return $response;


        // } catch (\Throwable $th) {
        //     Log::error('Error in auth middleware:', [
        //         'error' => $th->getMessage(),
        //         'trace' => $th->getTraceAsString()
        //     ]);
        //     return response()->json([
        //         "payload" => [
        //             "message" => "Invalid or expired token",
        //             "error" => $th->getMessage() // Tambahkan untuk debugging
        //         ]
        //     ], 403);
        // }

        Log::info('Auth middleware passed, proceeding to next middleware/controller');
        return $next($request);
    }
}