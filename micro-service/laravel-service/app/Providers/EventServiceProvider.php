<?php

namespace App\Providers;

use App\Events\SendMessageTestRabbitMq;
use Illuminate\Support\ServiceProvider;
use App\Listeners\SendMessageTestRabbitMqListener;

class EventServiceProvider extends ServiceProvider
{

    protected $listen = [
        SendMessageTestRabbitMq::class => [
       SendMessageTestRabbitMqListener::class,
    ],
];
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
