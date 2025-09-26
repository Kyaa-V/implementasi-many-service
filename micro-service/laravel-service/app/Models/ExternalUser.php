<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalUser extends Model
{
    public $id, $name, $roles;

    public function __construct($data = [])
    {
        // Pastikan data tidak null
        if (empty($data)) {
            throw new \InvalidArgumentException('User data cannot be empty');
        }

        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->roles = $data['roles'] ?? null; // Ambil dari struktur yang sudah diproses middleware
        
    }
}