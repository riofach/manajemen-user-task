<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str; // Untuk generate UUID jika tidak otomatis oleh model

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pengguna Admin
        User::firstOrCreate([
            'email' => 'admin@example.com',
        ], [
            'name' => 'Admin User',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => true, // Aktif
            'email_verified_at' => now(),
        ]);

        // Pengguna Manager
        User::firstOrCreate([
            'email' => 'manager@example.com',
        ], [
            'name' => 'Manager User',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'status' => true,
            'email_verified_at' => now(),
        ]);

        // Pengguna Staff 1
        User::firstOrCreate([
            'email' => 'staff1@example.com',
        ], [
            'name' => 'Staff User One',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'status' => true,
            'email_verified_at' => now(),
        ]);

        // Pengguna Staff 2 (Nonaktif)
        User::firstOrCreate([
            'email' => 'staff2@example.com',
        ], [
            'name' => 'Staff User Two',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'status' => false, // Tidak Aktif
            'email_verified_at' => now(),
        ]);

        // Pengguna Sistem (untuk logging oleh scheduler, dll.)
        // Role 'admin' digunakan agar bisa diasosiasikan dengan log jika perlu,
        // namun user ini idealnya tidak untuk login interaktif.
        User::firstOrCreate([
            'email' => 'system@example.com',
        ], [
            'name' => 'System User',
            'password' => Hash::make(Str::random(32)), // Password acak, tidak untuk login
            'role' => 'admin', // Atau role khusus jika ada, untuk saat ini admin
            'status' => true, // Harus aktif untuk bisa jadi user_id di activity_log
            'email_verified_at' => now(),
        ]);

        // bisa menambahkan lebih banyak pengguna di sini jika diperlukan
        // User::factory(10)->create(); // jika ingin menggunakan factory untuk data dummy tambahan
    }
}