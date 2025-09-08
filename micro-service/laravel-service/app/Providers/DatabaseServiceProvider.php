<?php

namespace App\Providers;

use Illuminate\Container\Attributes\Singleton;
use Illuminate\Database\Connectors\ConnectionFactory;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\ServiceProvider;

class DatabaseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton('db.factory',function($app){
            return new ConnectionFactory($app);
        });
        $this->app->singleton('db', function($app){
            return new DatabaseManager($app, $app['db.factory']);
        });

        $this->ConfigureReadWriteConnection();
    }

    protected function ConfigureReadWriteConnection(){
        $this->app->bind('db.connection.mysql',function($app){
            $config = $app['config']['database.connections.mysql_write'];
            return $app['db.factory']->make($config, 'mysql_write');
        });
        $this->app->bind('db.connections.mysql_read',function($app){
            $readConfigs = [
                $app['config']['database.connections.mysql_read1'],
                $app['config']['database.connections.mysql_read2'],
            ];
            $selectConfigs = $readConfigs[array_rand($readConfigs)];

            return $app['db.factory']->make($selectConfigs, 'mysql_read');
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
