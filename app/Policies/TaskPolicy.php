<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaskPolicy
{
    /**
     * Determine whether the user can view any models.
     * (GET /tasks) - Semua role bisa, filtering di controller.
     */
    public function viewAny(User $user): bool
    {
        return true; // Semua pengguna yang terautentikasi bisa mencoba melihat daftar tugas, controller akan filter
    }

    /**
     * Determine whether the user can view the model.
     * (GET /tasks/{task})
     */
    public function view(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        if ($user->role === 'manager') {
            // Manager bisa lihat task yg dibuatnya, atau ditugaskan padanya, atau ditugaskan ke salah satu staff
            return $task->created_by_id === $user->id ||
                $task->assigned_to_id === $user->id ||
                ($task->assignedTo && $task->assignedTo->role === 'staff');
            // Untuk "own team" yang lebih spesifik, perlu relasi manager-staff
        }
        if ($user->role === 'staff') {
            // Staff hanya bisa lihat task yg dibuatnya atau ditugaskan padanya
            return $task->created_by_id === $user->id || $task->assigned_to_id === $user->id;
        }
        return false;
    }

    /**
     * Determine whether the user can create models.
     * (POST /tasks) - Semua role bisa.
     */
    public function create(User $user): bool
    {
        return true; // Semua pengguna yang terautentikasi bisa mencoba membuat task, validasi di controller
    }

    /**
     * Determine whether the user can update the model.
     * (PUT /tasks/{task})
     */
    public function update(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        if ($user->role === 'manager') {
            // Manager bisa update task yg dibuatnya, atau ditugaskan padanya, atau ditugaskan ke salah satu staff
            // Untuk "own team", bisa diperketat: $task->assignedTo->manager_id === $user->id (jika ada relasi)
            return $task->created_by_id === $user->id ||
                $task->assigned_to_id === $user->id ||
                ($task->assignedTo && $task->assignedTo->role === 'staff');
        }
        if ($user->role === 'staff') {
            // Staff hanya bisa update task yg dibuatnya atau ditugaskan padanya (manage self)
            return $task->created_by_id === $user->id || $task->assigned_to_id === $user->id;
        }
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     * (DELETE /tasks/{task}) - Admin atau pembuat task.
     */
    public function delete(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        // Pembuat task bisa menghapus tasknya
        return $task->created_by_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    // public function restore(User $user, Task $task): bool
    // {
    //     return $user->role === 'admin';
    // }

    /**
     * Determine whether the user can permanently delete the model.
     */
    // public function forceDelete(User $user, Task $task): bool
    // {
    //     return $user->role === 'admin';
    // }
}