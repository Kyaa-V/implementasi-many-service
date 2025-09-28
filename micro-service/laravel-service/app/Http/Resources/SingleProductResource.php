<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class SingleProductResource extends JsonResource
{
    private $message, $success, $data, $token, $statusCode;

    /**
     * Create a new resource instance.
     *
     * @param string $message
     * @param number $statusCode
     * @param bool $success
     * @param mixed $data
     * @param string|null $token
     */
    public function __construct($message, $statusCode, $success, $data, $token = null)
    {
        $this->message = $message;
        $this->statusCode = $statusCode;
        $this->success = $success;
        $this->data = $data;
        $this->token = $token;
    }

    /**
     * Transform the resource into a JSON response.
     *
     * @return JsonResponse
     */
    public function toResponse($request = null)
    {
        return response()->json([
            'payload' => [
                'message' => $this->message,
                'success' => $this->success,
                'data' => [
                    'product' => new ProductResources($this->data),
                    'token' => $this->token
                ]
            ]
        ], $this->statusCode);
    }
}