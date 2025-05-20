<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule; // Untuk validasi unique dan enum
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Ambil daftar pengguna.
     *
     * @OA\Get(
     *     path="/users",
     *     summary="Ambil daftar pengguna",
     *     tags={"User"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Daftar pengguna berhasil diambil"),
     *     @OA\Response(response=401, description="Unauthorized")
     * )
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
     * Tambah pengguna baru.
     *
     * @OA\Post(
     *     path="/users",
     *     summary="Tambah pengguna baru",
     *     tags={"User"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password","role"},
     *             @OA\Property(property="name", type="string", example="Nama Pengguna"),
     *             @OA\Property(property="email", type="string", format="email", example="user@email.com"),
     *             @OA\Property(property="password", type="string", example="password123"),
     *             @OA\Property(property="password_confirmation", type="string", example="password123"),
     *             @OA\Property(property="role", type="string", enum={"admin","manager","staff"}, example="staff"),
     *             @OA\Property(property="status", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Pengguna berhasil dibuat"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
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

        // Catat log aktivitas
        $this->logActivity(Auth::id(), 'create_user', 'Membuat pengguna baru: ' . $user->name . ' (' . $user->email . ')');

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
     * Ambil detail pengguna.
     *
     * @OA\Get(
     *     path="/users/{user}",
     *     summary="Ambil detail pengguna",
     *     tags={"User"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Detail pengguna berhasil diambil"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Pengguna tidak ditemukan")
     * )
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
     * Update pengguna.
     *
     * @OA\Put(
     *     path="/users/{user}",
     *     summary="Update pengguna",
     *     tags={"User"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Nama Update"),
     *             @OA\Property(property="email", type="string", format="email", example="update@email.com"),
     *             @OA\Property(property="password", type="string", example="passwordBaru123"),
     *             @OA\Property(property="password_confirmation", type="string", example="passwordBaru123"),
     *             @OA\Property(property="role", type="string", enum={"admin","manager","staff"}, example="manager"),
     *             @OA\Property(property="status", type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Data pengguna berhasil diperbarui"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Pengguna tidak ditemukan"),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
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

        // Catat log aktivitas
        $this->logActivity(Auth::id(), 'update_user', 'Memperbarui pengguna: ' . $user->name . ' (' . $user->email . ')');

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
     * Hapus pengguna.
     *
     * @OA\Delete(
     *     path="/users/{user}",
     *     summary="Hapus pengguna",
     *     tags={"User"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Pengguna berhasil dihapus"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=403, description="Tidak dapat menghapus akun sendiri"),
     *     @OA\Response(response=404, description="Pengguna tidak ditemukan")
     * )
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

        $deletedName = $user->name;
        $deletedEmail = $user->email;
        // Hapus pengguna
        $user->delete();

        // Catat log aktivitas
        $this->logActivity(Auth::id(), 'delete_user', 'Menghapus pengguna: ' . $deletedName . ' (' . $deletedEmail . ')');

        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna berhasil dihapus.'
        ], 200);
    }

    /**
     * Helper untuk mencatat log aktivitas ke tabel activity_logs
     */
    private function logActivity($userId, $action, $description)
    {
        \App\Models\ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'logged_at' => now(),
        ]);
    }
}