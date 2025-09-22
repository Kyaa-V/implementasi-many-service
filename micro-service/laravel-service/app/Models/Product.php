<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    public $incrementing = false;   // non auto increment
    protected $keyType = 'string';

    protected $fillable = [
        'bookname',
        'author',
        'price',
        'stock',
        'description',
        'image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function getImageUrlAttribute(){
        return $this->image ? asset('storage/' . $this->image) : null;
    }

    protected $appends = ['image_url'];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

}
