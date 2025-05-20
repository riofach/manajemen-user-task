<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Dapatkan admin
        $admin = User::where('email', 'admin@example.com')->first();
        if (!$admin) {
            $this->command->error('Admin user not found. Create it first with UserSeeder.');
            return;
        }

        // Buat beberapa tugas contoh
        $tasks = [
            [
                'title' => 'Membuat Dashboard UI',
                'description' => 'Membuat antarmuka dashboard yang responsif dengan Bootstrap 5',
                'status' => 'pending',
                'due_date' => now()->addDays(7),
                'created_by_id' => $admin->id,
                'assigned_to_id' => $admin->id,
            ],
            [
                'title' => 'Implementasi API Authentication',
                'description' => 'Mengimplementasikan autentikasi API menggunakan Laravel Sanctum',
                'status' => 'in_progress',
                'due_date' => now()->addDays(3),
                'created_by_id' => $admin->id,
                'assigned_to_id' => $admin->id,
            ],
            [
                'title' => 'Testing End-to-End',
                'description' => 'Melakukan pengujian end-to-end untuk memastikan semua fitur berfungsi dengan baik',
                'status' => 'pending',
                'due_date' => now()->addDays(14),
                'created_by_id' => $admin->id,
                'assigned_to_id' => $admin->id,
            ],
            [
                'title' => 'Optimasi Database',
                'description' => 'Mengoptimalkan query database untuk performa yang lebih baik',
                'status' => 'pending',
                'due_date' => now()->addDays(10),
                'created_by_id' => $admin->id,
                'assigned_to_id' => $admin->id,
            ],
            [
                'title' => 'Deployment ke Production',
                'description' => 'Menyiapkan lingkungan produksi dan melakukan deployment aplikasi',
                'status' => 'pending',
                'due_date' => now()->addDays(20),
                'created_by_id' => $admin->id,
                'assigned_to_id' => $admin->id,
            ],
        ];

        foreach ($tasks as $task) {
            Task::create($task);
        }

        $this->command->info('Created 5 sample tasks');
    }
}