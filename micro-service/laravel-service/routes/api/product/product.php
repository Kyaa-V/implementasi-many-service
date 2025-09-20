// <?php

// use App\Http\Controllers\Product\ProductController;
// use App\Http\Middleware\authUser;
// use Illuminate\Support\Facades\Route;


// Route::middleware([authUser::class])->group(function () {
//     Route::get('/products', [ProductController::class, 'index']);
//     Route::get('/products/{id}', [ProductController::class, 'show']);
//     Route::post('/products', [ProductController::class, 'store']);
//     Route::delete('/products/{id}', [ProductController::class, 'destroy']);
// });