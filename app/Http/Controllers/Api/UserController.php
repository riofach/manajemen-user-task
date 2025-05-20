<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule; // Untuk validasi unique dan enum

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /users
     * Akses: admin, manager
     */
    public function index(Request $request)
    {
        // Otorisasi menggunakan Policy
        $this->authorize('viewAny', User::class);

        // Ambil semua pengguna dengan paginasi
        // Anda bisa menambahkan filter atau sorting di sini jika diperlukan
        $users = User::paginate(15); // Ambil 15 user per halaman

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar pengguna berhasil diambil.',
            'data' => $users
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     * POST /users
     * Akses: admin
     */
    public function store(Request $request)
    {
        // Otorisasi menggunakan Policy
        $this->authorize('create', User::class);

        // Validasi input
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => ['required', 'string', 'min:8', 'confirmed'], // 'confirmed' memerlukan field password_confirmation
            'role' => ['required', 'string', Rule::in(['admin', 'manager', 'staff'])],
            'status' => ['sometimes', 'boolean'], // Opsional, default true di migrasi
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Buat pengguna baru
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->input('status', true), // Default status true jika tidak disediakan
            'email_verified_at' => now(), // Asumsikan email terverifikasi saat dibuat oleh admin
        ]);

        // Kembalikan respons sukses dengan data pengguna yang baru dibuat (tanpa password)
        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna berhasil dibuat.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'created_at' => $user->created_at,
            ]
        ], 201); // 201 Created
    }

    /**
     * Display the specified resource.
     * GET /users/{user}
     * Akses: admin, manager
     */
    public function show(User $user) // Menggunakan Route Model Binding
    {
        // Otorisasi menggunakan Policy
        $this->authorize('view', $user);

        // Kembalikan data pengguna (tanpa password)
        return response()->json([
            'status' => 'success',
            'message' => 'Detail pengguna berhasil diambil.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'email_verified_at' => $user->email_verified_at,
            ]
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     * PUT/PATCH /users/{user}
     * Akses: admin, atau pengguna itu sendiri
     */
    public function update(Request $request, User $user)
    {
        // Otorisasi menggunakan Policy
        $this->authorize('update', $user);

        // Validasi input
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'string', Rule::in(['admin', 'manager', 'staff'])],
            'status' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update data pengguna
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password') && $request->password) {
            $user->password = Hash::make($request->password);
        }

        if ($request->has('role')) {
            $user->role = $request->role;
        }

        if ($request->has('status')) {
            $user->status = $request->status;
        }

        $user->save();

        // Kembalikan respons sukses dengan data pengguna yang diperbarui
        return response()->json([
            'status' => 'success',
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'updated_at' => $user->updated_at,
            ]
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /users/{user}
     * Akses: admin
     */
    public function destroy(User $user)
    {
        // Otorisasi menggunakan Policy
        $this->authorize('delete', $user);

        // Cek apakah pengguna mencoba menghapus dirinya sendiri
        if (request()->user()->id === $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.'
            ], 403);
        }

        // Hapus pengguna
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna berhasil dihapus.'
        ], 200);
    }
}