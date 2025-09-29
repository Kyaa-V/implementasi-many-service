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
                'user_role' => $user->roles,
                'user_id' => $user->id
            ]);
            return $user->roles[0]->name === 'USER';
        });

        Gate::define('view-products', function (ExternalUser $user) {
            Log::info('Gate view-products called', ['user_role' => $user->roles]);
            return in_array($user->roles, ['USER', 'ADMIN']);
        });

        Gate::define('update-product', function (ExternalUser $user) {
            Log::info('Gate update-product called', ['user_role' => $user->roles]);
            return in_array($user->roles, ['USER', 'ADMIN']);
        });

        Gate::define('delete-product', function (ExternalUser $user) {
            Log::info('Gate delete-product called', ['user_role' => $user->roles]);
            return $user->roles === 'ADMIN';
        });

        // Alternative: Gate berdasarkan roles string
        Gate::define('roles', function (ExternalUser $user, string $roles) {
            Log::info('Gate roles called', [
                'user_role' => $user->roles,
                'required_role' => $roles
            ]);
            return $user->roles === $roles;
        });
    }
}