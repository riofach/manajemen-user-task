<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\StatusController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route untuk cek status API - Gunakan StatusController
Route::get('/', [StatusController::class, 'index']);
Route::get('/status', [StatusController::class, 'index']);

// Debugging endpoint untuk diagnosa middleware dan token
Route::get('/debug/token', function (Request $request) {
    $token = $request->bearerToken();
    $hasToken = !empty($token);

    return response()->json([
        'status' => 'success',
        'has_token' => $hasToken,
        'token_preview' => $hasToken ? substr($token, 0, 10) . '...' : null,
        'headers' => $request->headers->all(),
    ]);
})->middleware('auth:sanctum');

// Route publik untuk autentikasi
Route::post('/login', [AuthController::class, 'login']);

// Rute alternatif untuk login (debug saat development)
Route::post('/auth/login', [AuthController::class, 'login']);

// Route yang memerlukan autentikasi (dilindungi oleh Sanctum)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // User Management Routes
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.patch');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Task Management Routes
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    // Activity Log Route (Admin Only)
    Route::get('/logs', [ActivityLogController::class, 'index'])->name('logs.index');
});