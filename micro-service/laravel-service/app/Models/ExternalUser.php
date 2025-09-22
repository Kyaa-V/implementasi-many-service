<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalUser extends Model
{
    public $id, $name, $role;

    public function __construct($data = [])
    {
        // Pastikan data tidak null
        if (empty($data)) {
            throw new \InvalidArgumentException('User data cannot be empty');
        }

        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->role = $data['role'] ?? null; // Ambil dari struktur yang sudah diproses middleware
        
    }

    // Method untuk mengecek apakah user memiliki role tertentu
    public function hasRole($roleName): bool
    {
        return $this->role === $roleName;
    }
}