<?php

use App\Http\Controllers\ProductController;
use App\Http\Middleware\authUser;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Log::info("message from product.php");
Route::middleware([authUser::class])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
});