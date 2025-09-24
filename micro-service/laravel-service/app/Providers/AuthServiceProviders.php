<?php

namespace App\Providers;

use App\Models\ExternalUser;
use App\Models\Product;
use App\Policies\ProductPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class AuthServiceProviders extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Product::class => ProductPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define Gates untuk ExternalUser (karena bukan Eloquent User model standard)
        Gate::define('create-product', function (ExternalUser $user) {
            Log::info('Gate create-product called', [
                'user_role' => $user->role,
                'user_id' => $user->id
            ]);
            return $user->role === 'USER';
        });

        Gate::define('view-products', function (ExternalUser $user) {
            Log::info('Gate view-products called', ['user_role' => $user->role]);
            return in_array($user->role, ['USER', 'ADMIN']);
        });

        Gate::define('update-product', function (ExternalUser $user) {
            Log::info('Gate update-product called', ['user_role' => $user->role]);
            return in_array($user->role, ['USER', 'ADMIN']);
        });

        Gate::define('delete-product', function (ExternalUser $user) {
            Log::info('Gate delete-product called', ['user_role' => $user->role]);
            return $user->role === 'ADMIN';
        });

        // Alternative: Gate berdasarkan role string
        Gate::define('role', function (ExternalUser $user, string $role) {
            Log::info('Gate role called', [
                'user_role' => $user->role,
                'required_role' => $role
            ]);
            return $user->role === $role;
        });
    }
}