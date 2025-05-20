<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Untuk mendapatkan user saat ini jika diperlukan

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /logs
     * Akses: admin
     */
    public function index(Request $request)
    {
        // Otorisasi menggunakan Policy
        $this->authorize('viewAny', ActivityLog::class);

        // Ambil semua activity logs dengan paginasi, urutkan berdasarkan waktu terbaru
        // Eager load relasi user untuk menampilkan siapa yang melakukan aksi
        $logs = ActivityLog::with('user:id,name,email') // Hanya ambil id, name, email dari user
            ->latest('logged_at') // Urutkan berdasarkan logged_at terbaru
            ->paginate(20); // Ambil 20 log per halaman

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar activity log berhasil diambil.',
            'data' => $logs
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(ActivityLog $activityLog)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ActivityLog $activityLog)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ActivityLog $activityLog)
    {
        //
    }
}
