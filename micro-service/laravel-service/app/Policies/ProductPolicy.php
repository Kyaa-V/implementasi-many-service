<?php

namespace App\Policies;

use App\Models\ExternalUser;
use Illuminate\Auth\Access\Response;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ProductPolicy
{

    public function __construct()
    {
        Log::info('ProductPolicy initialized');
    }
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(ExternalUser $user): bool
    {
        Log::info('ProductPolicy create called', [
            'user_role' => $user->role,
            'user_id' => $user->id
        ]);
        return $user->role === 'USER';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Product $product): bool
    {
        return false;
    }
}
