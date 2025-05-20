<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\User; // Import User model
use App\Policies\UserPolicy; // Import UserPolicy
use App\Models\Task; // Import Task model
use App\Policies\TaskPolicy; // Import TaskPolicy
use App\Models\ActivityLog; // Import ActivityLog model
use App\Policies\ActivityLogPolicy; // Import ActivityLogPolicy

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class, // Daftarkan UserPolicy untuk User model
        Task::class => TaskPolicy::class, // Daftarkan TaskPolicy untuk Task model
        ActivityLog::class => ActivityLogPolicy::class, // Daftarkan ActivityLogPolicy
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        //
    }
}