<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class ErrorHandler
{
    /**
     * Handle exception and return JSON response
     *
     * @param Throwable $exception
     * @param string $context
     * @param int $statusCode
     * @param string|null $customMessage
     * @return JsonResponse
     */
    public static function handle(
        Throwable $exception,
        string $context = 'Unknown context',
        int $statusCode = 500,
        ?string $customMessage = null
    ): JsonResponse {
        // Log the error
        self::logError($exception, $context);

        // Determine message based on environment
        $message = self::getErrorMessage($exception, $customMessage);

        return response()->json([
            'payload' => [
                'message' => $message,
                'success' => false,
                'error' => config('app.debug') ? $exception->getMessage() : 'Something went wrong'
            ]
        ], $statusCode);
    }

    /**
     * Handle exception with custom payload structure
     *
     * @param Throwable $exception
     * @param array $customPayload
     * @param string $context
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function handleWithCustomPayload(
        Throwable $exception,
        array $customPayload = [],
        string $context = 'Unknown context',
        int $statusCode = 500
    ): JsonResponse {
        // Log the error
        self::logError($exception, $context);

        $defaultPayload = [
            'message' => 'Internal server error',
            'success' => false,
            'error' => config('app.debug') ? $exception->getMessage() : 'Something went wrong'
        ];

        $payload = array_merge($defaultPayload, $customPayload);

        return response()->json(['payload' => $payload], $statusCode);
    }


    /**
     * Log error with context
     *
     * @param Throwable $exception
     * @param string $context
     * @return void
     */
    private static function logError(Throwable $exception, string $context): void
    {
        Log::error("Error in {$context}:", [
            'error' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'context' => $context,
            'timestamp' => now()->toDateTimeString()
        ]);
    }

    /**
     * Get appropriate error message based on environment
     *
     * @param Throwable $exception
     * @param string|null $customMessage
     * @return string
     */
    private static function getErrorMessage(Throwable $exception, ?string $customMessage): string
    {
        if ($customMessage) {
            return $customMessage;
        }

        if (config('app.debug')) {
            return $exception->getMessage();
        }

        return 'Internal server error';
    }

    /**
     * Handle validation errors
     *
     * @param array $errors
     * @param string $message
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function handleValidationError(
        array $errors,
        string $message = 'Validation failed',
        int $statusCode = 422
    ): JsonResponse {
        return response()->json([
            'payload' => [
                'message' => $message,
                'success' => false,
                'errors' => $errors
            ]
        ], $statusCode);
    }

    /**
     * Handle not found errors
     *
     * @param string $resource
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function handleNotFound(
        string $resource = 'Resource',
        int $statusCode = 404
    ): JsonResponse {
        return response()->json([
            'payload' => [
                'message' => "{$resource} not found",
                'success' => false,
                'error' => 'Not found'
            ]
        ], $statusCode);
    }

    /**
     * Handle unauthorized errors
     *
     * @param string $message
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function handleUnauthorized(
        string $message = 'Unauthorized access',
        int $statusCode = 401
    ): JsonResponse {
        return response()->json([
            'payload' => [
                'message' => $message,
                'success' => false,
                'error' => 'Unauthorized'
            ]
        ], $statusCode);
    }

    /**
     * Handle forbidden errors
     *
     * @param string $message
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function handleForbidden(
        string $message = 'Access forbidden',
        int $statusCode = 403
    ): JsonResponse {
        return response()->json([
            'payload' => [
                'message' => $message,
                'success' => false,
                'error' => 'Forbidden'
            ]
        ], $statusCode);
    }
}