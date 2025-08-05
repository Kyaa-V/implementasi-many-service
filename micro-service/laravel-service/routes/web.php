<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/hello', function () {
    return 'cek route get hello';
});
Route::get('/user/123', function () {
    return 'hallo testing cek';
});
