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
    public function viewAny(ExternalUser $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(ExternalUser $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(ExternalUser $user): bool
    {
        Log::info('ProductPolicy create called', [
            'user_roles' => $user->roles,
            'user_id' => $user->id
        ]);
        return $user->roles === 'USER';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(ExternalUser $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(ExternalUser $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(ExternalUser $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(ExternalUser $user, Product $product): bool
    {
        return false;
    }
}
