<?php

namespace App\Http\Requests;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bookname' => 'required|string|min:3|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'category' => 'required|array|min:1',
            'category.*' => 'integer|exists:categories,id',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048',
        ];
    }

    // public function messages(): array
    // {
    //     return [
    //         'bookname.required' => 'Nama buku harus diisi',
    //         'bookname.min' => 'Nama buku minimal 3 karakter',
    //         'price.required' => 'Harga harus diisi',
    //         'price.numeric' => 'Harga harus berupa angka',
    //         'stock.required' => 'Stok harus diisi',
    //         'stock.integer' => 'Stok harus berupa angka bulat',
    //         'category.required' => 'Category harus diisi',
    //         'category.array' => 'Category harus berupa array',
    //         'category.min' => 'Minimal pilih 1 category',
    //         'category.*.integer' => 'ID category harus berupa angka',
    //         'category.*.exists' => 'Category tidak ditemukan',
    //         'image.image' => 'File harus berupa gambar',
    //         'image.max' => 'Ukuran gambar maksimal 2MB',
    //     ];
    // }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        // Force return JSON response dengan format konsisten
        throw new HttpResponseException(
            response()->json([
                'payload' => [
                    'message' => 'Validation failed',
                    'success' => false,
                    'errors' => $validator->errors()
                ]
            ], 422)
        );
    }

    /**
     * Prepare for validation - force JSON response
     */
    protected function prepareForValidation()
    {
        $this->headers->set('Accept', 'application/json');
    }

    protected function failedAuthorization()
    {
        // Laravel otomatis panggil ini kalau authorize() return false
        throw new AuthorizationException('Unauthorized');
    }
}