<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * @OA\Info(
 *      version="1.0.0",
 *      title="Laravel Swagger API",
 *      description="Dokumentasi API menggunakan Swagger di Laravel"
 * )
 */
class ProductController extends Controller
{
    /**
     * @OA\Get(
     *     path="/products",
     *     tags={"Products"},
     *     summary="Ambil semua produk",
     *     @OA\Response(response=200, description="Sukses")
     * )
     */
    public function index()
    {
        return response()->json(['Produk A', 'Produk B']);
    }

    /**
     * @OA\Get(
     *     path="/products/{id}",
     *     tags={"Products"},
     *     summary="Ambil produk berdasarkan ID",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID produk",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Sukses"),
     *     @OA\Response(response=404, description="Tidak ditemukan")
     * )
     */
    public function show($id)
    {
        return response()->json(['id' => $id, 'name' => 'Produk Contoh']);
    }

    /**
     * @OA\Post(
     *     path="/products",
     *     tags={"Products"},
     *     summary="Tambah produk baru",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name"},
     *             @OA\Property(property="name", type="string", example="Produk Baru")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Berhasil dibuat")
     * )
     */
    public function store(Request $request)
    {
        return response()->json(['name' => $request->name], 201);
    }

    /**
     * @OA\Delete(
     *     path="/products/{id}",
     *     tags={"Products"},
     *     summary="Hapus produk berdasarkan ID",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID produk",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Berhasil dihapus"),
     *     @OA\Response(response=404, description="Tidak ditemukan")
     * )
     */
    public function destroy($id)
    {
        return response()->json(['message' => "Produk {$id} dihapus"]);
    }
}
