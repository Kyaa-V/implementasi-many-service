<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SelectDatabaseConnections
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if($request->isMethod('GET')){
            $readConections = ['mysql_read1', 'mysql_read2'];
            $selectConnetcion = $readConections[array_rand($readConections)];
            DB::setDefaultConnection($selectConnetcion);
            Log::info('Database switch to: ' . DB::getDefaultConnection());
        }else{
            DB::setDefaultConnection('mysql_write');
            Log::info('Database switch to: ' . DB::getDefaultConnection());
        }
        return $next($request);
    }
}
