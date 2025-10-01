<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'bookname' => 'sometimes|string|min:3|max:255', // OPSIONAL
            'price' => 'sometimes|numeric|min:0', // OPSIONAL
            'stock' => 'sometimes|integer|min:0', // OPSIONAL
            'category' => 'sometimes|array|min:1', // OPSIONAL
            'category.*' => 'integer|exists:categories,id',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048',
        ];
    }
}
