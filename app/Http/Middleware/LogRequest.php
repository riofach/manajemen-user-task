<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class LogRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Persiapkan data log
        $logData = [
            'timestamp' => now()->toDateTimeString(),
            'method' => $request->getMethod(),
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'request_body' => $request->except(config('logging.sensitive_parameters', ['password', 'password_confirmation'])), // Hindari logging password
            'response_status' => $response->getStatusCode(),
            // 'response_body' => $response->getContent(), // Bisa sangat besar, aktifkan jika benar-benar perlu dan hati-hati
            'user_id' => Auth::check() ? Auth::id() : null,
            'role' => Auth::check() ? Auth::user()->role : null,
        ];

        // Tulis ke channel log kustom jika ada, atau default
        // Untuk kasus ini, kita akan menggunakan channel 'daily' atau 'single' yang dikonfigurasi untuk file 'api_activity.log'
        // Pastikan konfigurasi channel log di config/logging.php sudah ada atau sesuai.
        // Jika tidak ada channel spesifik, Log::info() akan menggunakan default stack.

        // Menggunakan channel log spesifik bernama 'api_activity'
        // Anda perlu mendefinisikan channel ini di config/logging.php
        // Contoh: 'api_activity' => [ 'driver' => 'single', 'path' => storage_path('logs/api_activity.log'), 'level' => 'info', ],
        try {
            Log::channel('api_activity')->info("API Request Activity", $logData);
        } catch (\InvalidArgumentException $e) {
            // Fallback ke default logger jika channel tidak ditemukan
            Log::info("API Request Activity (fallback): ", $logData);
        }

        return $response;
    }
}