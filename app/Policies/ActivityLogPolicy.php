<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ActivityLogPolicy
{
    /**
     * Determine whether the user can view any models.
     * (GET /logs)
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can view the model.
     * (Tidak digunakan saat ini, karena kita hanya menampilkan daftar log)
     */
    // public function view(User $user, ActivityLog $activityLog): bool
    // {
    //     return $user->role === 'admin';
    // }

    /**
     * Determine whether the user can create models.
     * (Log dibuat oleh sistem atau secara otomatis, bukan oleh user secara langsung via API)
     */
    // public function create(User $user): bool
    // {
    //     return false;
    // }

    /**
     * Determine whether the user can update the model.
     * (Log tidak seharusnya diupdate)
     */
    // public function update(User $user, ActivityLog $activityLog): bool
    // {
    //     return false;
    // }

    /**
     * Determine whether the user can delete the model.
     * (Log tidak seharusnya didelete oleh user via API)
     */
    // public function delete(User $user, ActivityLog $activityLog): bool
    // {
    //     return false;
    // }

    /**
     * Determine whether the user can restore the model.
     */
    // public function restore(User $user, ActivityLog $activityLog): bool
    // {
    //     return false;
    // }

    /**
     * Determine whether the user can permanently delete the model.
     */
    // public function forceDelete(User $user, ActivityLog $activityLog): bool
    // {
    //     return false;
    // }
}