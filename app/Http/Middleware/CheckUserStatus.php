<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Cek apakah pengguna terautentikasi dan statusnya aktif
        if (Auth::check() && !Auth::user()->status) {
            // Jika pengguna tidak aktif, logout untuk invalidasi token saat ini
            // Auth::user()->tokens()->delete(); // Menghapus semua token pengguna tersebut
            $request->user()->currentAccessToken()->delete(); // Hanya menghapus token yang sedang digunakan

            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda tidak aktif. Silakan hubungi administrator.'
            ], 403); // 403 Forbidden
        }

        return $next($request);
    }
}