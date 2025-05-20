<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     * (GET /users)
     */
    public function viewAny(User $user): bool
    {
        // Admin dan Manager bisa melihat daftar semua pengguna
        return $user->role === 'admin' || $user->role === 'manager';
    }

    /**
     * Determine whether the user can view the model.
     * (GET /users/{user})
     */
    public function view(User $user, User $model): bool // $model adalah user yang ingin dilihat
    {
        // Admin dan Manager bisa melihat detail pengguna manapun
        return $user->role === 'admin' || $user->role === 'manager';
        // Alternatif: jika manager hanya bisa melihat profil sendiri atau staff di bawahnya (memerlukan struktur tim)
        // if ($user->role === 'admin') return true;
        // if ($user->role === 'manager') {
        //     return $user->id === $model->id || ($model->role === 'staff' /* && $model->manager_id === $user->id */);
        // }
        // return false;
    }

    /**
     * Determine whether the user can create models.
     * (POST /users)
     */
    public function create(User $user): bool
    {
        // Hanya Admin yang bisa membuat pengguna baru
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can update the model.
     * (PUT /users/{user})
     */
    public function update(User $user, User $model): bool
    {
        // Admin bisa update siapa saja
        if ($user->role === 'admin')
            return true;

        // Manager bisa update staff atau diri sendiri
        if ($user->role === 'manager') {
            return ($model->role === 'staff') || $user->id === $model->id;
        }

        // Staff hanya bisa update diri sendiri
        return $user->id === $model->id;
    }

    /**
     * Determine whether the user can delete the model.
     * (DELETE /users/{user})
     */
    public function delete(User $user, User $model): bool
    {
        // Hanya Admin yang bisa menghapus pengguna
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    // public function restore(User $user, User $model): bool
    // {
    //     return $user->role === 'admin';
    // }

    /**
     * Determine whether the user can permanently delete the model.
     */
    // public function forceDelete(User $user, User $model): bool
    // {
    //     return $user->role === 'admin';
    // }
}