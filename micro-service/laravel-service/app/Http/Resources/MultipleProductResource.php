<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MultipleProductResource extends JsonResource
{

    private $message, $success, $data, $token, $statusCode;

    public function __construct($message, $statusCode, $success, $data, $token = null)
    {
        $this->data = $data;
        $this->message = $message;
        $this->statusCode = $statusCode;
        $this->success = $success;
        $this->token = $token;
    }
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request)
    {
        return [
            'payload' => [
                'message' => $this->message,
                'success' => $this->success,
                'data' => [
                    'product' => ProductResources::collection($this->data->items())->toArray(request()),
                    'current_page' => $this->data->currentPage(),
                    'prev' => $this->data->previousPageUrl(),
                    'next' => $this->data->nextPageUrl(),
                    'total' => $this->data->total(),
                    'last_page' => $this->data->lastPage(),
                ],
                'token' => $this->token
            ]
        ];
    }

    /**
     * Menyesuaikan kode status respons.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Illuminate\Http\JsonResponse $response
     * @return void
     */
    public function withResponse($request, $response)
    {
        $response->setStatusCode($this->statusCode);
    }
}
