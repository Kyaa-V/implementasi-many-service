<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\ExternalUser;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json([
            'payload' => [
                'message' => 'products retrieved successfully',
                'success' => true,
            ]
        ], 200);
    }

    public function store(StoreProductRequest $request)
    {
        try {
            Log::info('Store method called');
            Log::info('Auth User from request:', ['user' => $request->auth_user]);

            // Uncomment dan perbaiki logic authorization jika diperlukan
            $user = new ExternalUser($request->auth_user);
            Log::info('ExternalUser created:', [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role
            ]);

            if(Gate::forUser(($user))->denies('create-product')){
                Log::warning('Authorization failed for user:', ['user_id' => $user->id]);
                return response()->json([
                    'payload' => [
                        'message' => 'unauthorized to create product',
                        'success' => false,
                        'debug' =>[
                            'user_id' => $user->id,
                            'user_role' => $user->role,
                            'required_permissions'=> 'create-product'
                        ]
                        ]
                ],403);
            }

            Log::info('Authorization passed, creating product');
            $validatedData = $request->validated();
            $product = Product::create([
                ...$validatedData,
                'author' => $user->id,
            ]);
            Log::info('Product created successfully');

            return response()->json([
                'payload' => [
                    'message' => 'product created successfully',
                    'success' => true,
                    'data' => $product
                ]
            ], 201);

        } catch (\Throwable $th) {
            Log::error('Error in store method:', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);
            
            return response()->json([
                'payload' => [
                    'message' => 'Internal server error',
                    'success' => false,
                    'error' => $th->getMessage()
                ]
            ], 500);
        }
    }

    public function show(Product $product)
    {
        //
    }

    public function edit(Product $product)
    {
        //
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        //
    }

    public function destroy(Product $product)
    {
        //
    }
}