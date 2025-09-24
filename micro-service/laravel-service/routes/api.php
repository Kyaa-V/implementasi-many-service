<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Log::info("message from api.php");

Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});

require __DIR__ . '/api/product/product.php';