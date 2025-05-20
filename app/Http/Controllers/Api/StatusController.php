<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StatusController extends Controller
{
    /**
     * Menampilkan status API.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        // Cek koneksi database
        $dbStatus = true;
        $errorMessage = null;

        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $dbStatus = false;
            $errorMessage = $e->getMessage();
        }

        // Cek tabel-tabel penting
        $tablesStatus = [
            'users' => Schema::hasTable('users'),
            'tasks' => Schema::hasTable('tasks'),
            'personal_access_tokens' => Schema::hasTable('personal_access_tokens'),
            'activity_logs' => Schema::hasTable('activity_logs'),
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'API running',
            'version' => '1.0',
            'environment' => app()->environment(),
            'database' => [
                'connected' => $dbStatus,
                'error' => $errorMessage,
                'tables' => $tablesStatus
            ],
            'server_time' => now()->toDateTimeString(),
            'documentation' => 'https://github.com/riofach/manajemen-user-task'
        ]);
    }
}