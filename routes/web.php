<?php

use Illuminate\Support\Facades\Route;

// Route default akan mengarahkan ke frontend/index.html
Route::get('/', function () {
    return redirect('/frontend/index.html');
});

// Redirect untuk '/dashboard' jika ada yang mengakses URL ini secara langsung
// Route::get('/dashboard', function () {
//     return redirect('/frontend/dashboard.html');
// });