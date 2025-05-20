<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Panggil UserSeeder
        $this->call([
            UserSeeder::class,
            // bisa menambahkan seeder lain di sini nanti, misalnya TaskSeeder, ActivityLogSeeder
        ]);

        // penggunaan factory jika diperlukan untuk data dummy yang lebih banyak
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}