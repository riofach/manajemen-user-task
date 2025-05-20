<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle an incoming authentication request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Illuminate\Validation\ValidationException
     */
    public function login(Request $request)
    {
        // Validasi input request
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422); // 422 Unprocessable Entity
        }

        // Coba autentikasi pengguna
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kredensial yang diberikan salah.'
            ], 401); // 401 Unauthorized
        }

        // Dapatkan instance user yang terautentikasi
        $user = User::where('email', $request->email)->first();

        // Periksa status pengguna
        if (!$user || !$user->status) {
            // Jika pengguna tidak ditemukan (seharusnya tidak terjadi jika Auth::attempt berhasil)
            // atau status pengguna tidak aktif, logout pengguna untuk menghapus sesi parsial jika ada
            Auth::logout(); // Logout pengguna yang tidak aktif
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda tidak aktif. Silakan hubungi administrator.'
            ], 403); // 403 Forbidden
        }

        // Buat token untuk pengguna
        $token = $user->createToken('auth_token')->plainTextToken;

        // Kembalikan respons sukses dengan token dan data pengguna
        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], 200);
    }

    /**
     * Log the user out of the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Hapus token pengguna saat ini
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil logout'
        ], 200);
    }
}