<?php

namespace App\Http\Controllers;

use App\Helpers\ErrorHandler;
use App\Models\Product;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\MultipleProductResource;
use App\Http\Resources\ProductResources;
use App\Http\Resources\SingleProductResource;
use App\Models\Category;
use App\Models\ExternalUser;
use App\Models\ProductCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{

    /**
    * @OA\Get(
    *      path="/api/product/api/v1/products",
    *      operationId="GetAllProduct",
    *      tags={"Product"},
    *      summary="Get all product with pagination",
    *      description="show product with pagination successfully",
    *      @OA\Parameter(
    *          name="page",
    *          in="query",
    *          description="Page number",
    *          required=false,
    *          @OA\Schema(type="integer", default=1)
    *      ),
    *      @OA\Parameter(
    *          name="per_page",
    *          in="query",
    *          description="Number of items per page",
    *          required=false,
    *         @OA\Schema(type="integer", default=5)
    *      ),
    *      @OA\Response(
    *          response=Response Code,
    *          description="Response Message",
    *           @OA\JsonContent(
    *               @OA\Property(property="payload", type="object",
    *                 @OA\Property(property="message",type="string",example="show product successfully")
    *                 @OA\Property(property="success",type="boolean",example="true")
    *                 @OA\Property(property="data",type="object",
    *                   @OA\Property(property="product, type="object",
    *                     @OA\Items(ref="#/components/schemas/Schema")
    *                       /**
    *                        @OA\Property( property="id", type="string", example="gfiuewhfjgwekg")
    *                        @OA\Property( property="bookname", type="string", example="sample book")
    *                        @OA\Property( property="author", type="string", example="147hsj-riw")
    *                        @OA\Property( property="price", type="integer", format="float", example=99.01)
    *                        @OA\Property( property="stock", type="integer", example=12)
    *                        @OA\Property( property="description", type="string", example="hfeisiris")
    *                        @OA\Property( property="image", type="string", example="https://storage/api/image/12")
    *                        @OA\Property( property="created_at", type="date", example="gfiuewhfjgwekg")
    *                        @OA\Property( property="created_at", type="date", example="gfiuewhfjgwekg")
    *                        @OA\Property( property="image_url", type="string", example="https://storage/api/image/12")
    *          `            )
    *                   )
    *                     @OA\Property( property="current_page", type="integer", example=1)
    *                     @OA\Property( property="prev", type="string", nullable=true, example="http://localhost:8080/api/product?page=1")
    *                     @OA\Property( property="next", type="string", nullable=true, example="http://localhost:8080/api/product?page=3")
    *                     @OA\Property( property="total", type="integer", example=100)
    *                     @OA\Property( property="last_page", type="integer", example=20)
    *               )
    *                  @OA\Property( property="token", type="string", example="example token")
    *          )
    *       ),
    *     )
    */
    public function index()
    {
        try {
        
        Log::info('starting process get all product in index function');
        
        $token = request()->attributes->get('token');

        $page = request()->query('page', 1);
        $perPage = request()->query('per_page', 5);
        $perPage = min(max((int) $perPage, 1), 100);

            Log::info('token:', ['token' => $token]);
            $data = Product::with('categories')->paginate($perPage, ['*'], 'page', $page);

            if(!$data){
                return ErrorHandler::handleNotFound('Product@index(data:Product)');
            }

            Log::info('data product paginate:', ['data' => $data]);

        return new MultipleProductResource('show product successfully',200, true, $data, $token);
        
        // return response()->json([
        //     'payload' => [
        //         'message' => 'products retrieved successfully',
        //         'success' => true,
        //         'data' => [
        //             'products' => $data->items(),
        //             'current_page' => $data->currentPage(),
        //             'prev' => $data->previousPageUrl(),
        //             'next' => $data->nextPageUrl(),
        //             'total' => $data->total(),
        //             'last_page' => $data->lastPage(),
        //         ],
        //         'token' => $token
        //     ]
        // ], 200);
        } catch (\Throwable $th) {
           return ErrorHandler::handle($th, 'Product@index',500, $th->getMessage());
        }
    }

    public function store(StoreProductRequest $request)
    {
        try {
            Log::info('Store method called');
            Log::info('Auth User from request:', ['user' => $request->attributes->get('auth_user')['id']]);

            $token = $request->attributes->get('token');
            $user = $request->attributes->get('auth_user') ?? null;

            Log::info('users:', ["users" => $user]);

            // Uncomment dan perbaiki logic authorization jika diperlukan
            $users = new ExternalUser($user);
            Log::info('ExternalUser created:', [
                'id' => $users->id,
                'name' => $users->name,
                'roles' => $users->roles
            ]);

            if(Gate::forUser(($users))->denies('create-product')){
                Log::warning('Authorization failed for user:', ['user_id' => $users->id]);
                return response()->json([
                    'payload' => [
                        'message' => 'unauthorized to create product',
                        'success' => false,
                        'debug' =>[
                            'user_id' => $users->id,
                            'user_roles' => $users->roles,
                            'required_permissions'=> 'create-product'
                        ]
                        ]
                ],403);
            }

            Log::info('Authorization passed, creating product');
            $validatedData = $request->validated();

            DB::beginTransaction();

            Log::info($validatedData);
            $product = Product::create([
                'bookname' => $validatedData['bookname'],
                'price' => $validatedData['price'],
                'stock' => $validatedData['stock'],
                'image' => $validatedData['image'],
                'description' => $validatedData['description'],
                'author' => $users->id,
            ]);

            Log::info('productId',['productId' => $product->id]);
            Log::info('categoriesId',['categoriesId' => $validatedData['category']]);

            $product->categories()->attach($validatedData['category']);
            $setCategories = $product->load('categories');

            Log::info('Product with categories', $setCategories->toArray());
            // $setCategories = ProductCategory::create([
            //     'product_id' => $product->id,
            //     'category_id' => $validatedData['category'],
            // ]);

            $productWithCategories = Product::with('categories')->find($product->id);

            DB::commit();
            Log::info($productWithCategories);

            Log::info('Categories',['Categories' => $setCategories]);
            Log::info('Product created successfully');

            return new SingleProductResource('product create successfully',200, true, $productWithCategories, $token);

            // return response()->json([
            //     'payload' => [
            //         'message' => 'product created successfully',
            //         'success' => true,
            //         'data' => [
            //             'product' => $product
            //         ],
            //         'token' => $token
            //     ]
            // ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();
            return ErrorHandler::handle($th, 'Product@store(create)',500, $th->getMessage());
        }
    }

    public function show($id)
    {
        try {

            $userId = request()->attributes->get('auth_user')['id'] ?? null;
            $token = request()->attributes->get('token');

            Log::info('token:', ['token:' => $token]);
            
            $productId = $id;

            Log::info('show method called', [
                'user_id' => $userId,
                'productId' => $productId
            ]);

            $dataProduct = Product::with('categories')->find($productId);

            if(!$dataProduct){
                return ErrorHandler::handleNotFound('Product@show($id)');
            }

            Log::info('Product retrivied succesfully',[
                'product' => $dataProduct
            ]);

            return new SingleProductResource('product show successfully',200, true, $dataProduct, $token);
        } catch (\Throwable $th) {
            return ErrorHandler::handle($th, 'Product@show',500, 'something wrong...');
        }
    }

    public function edit(Product $product)
    {
        try {
            
        } catch (\Throwable $th) {
            return ErrorHandler::handle($th, 'Product@edit',500, 'something wrong...');
        }
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        try {
            Log::info('memulai proccess');

            Log::info('product',['data' => $product]);

            Log::info('Route parameter:', ['product_param' => request()->route('product')]);
            Log::info('Product instance:', ['product' => $product]);

            $token = $request->attributes->get('token');
            $user = $request->attributes->get('auth_user') ?? null;

            $users = new ExternalUser($user);
            Log::info('ExternalUser created:', [
                'id' => $users->id,
                'name' => $users->name,
                'roles' => $users->roles
            ]);

            if(Gate::forUser(($users))->denies('update-product')){
                Log::warning('Authorization failed for user:', ['user_id' => $users->id]);
                return response()->json([
                    'payload' => [
                        'message' => 'unauthorized to update product',
                        'success' => false,
                        'debug' =>[
                            'user_id' => $users->id,
                            'user_roles' => $users->roles,
                            'required_permissions'=> 'create-product'
                        ]
                        ]
                ],403);
            }

           
            $validatedData = $request->validated();

            DB::beginTransaction();

            $product->update(array_filter([
                'bookname' => $validatedData['bookname'] ?? null,
                'price' => $validatedData['price'] ?? null,
                'stock' => $validatedData['stock'] ?? null,
                'description' => $validatedData['description'] ?? null,
                'image' => $validatedData['image'] ?? null,
            ]));


            if (!$product || !$product->id) {
                DB::rollBack();
                return ErrorHandler::handleNotFound('Product@store(update): gagal mengupdate produk');
            }
            if(isset($validatedData['category'])){
                $product->categories()->sync($validatedData['category']);
            }

            $product->load('categories');

            Log::info('product', ['data'=> $product]);

            DB::commit();

            return new SingleProductResource('product update successfully',200, true, $product, $token);

        } catch (\Throwable $th) {
            DB::rollBack();
            return ErrorHandler::handle($th, 'Product@update',500, 'something wrong...');
        }
    }

    public function destroy(Product $product)
    {
        //
    }
}