<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Models\ActivityLog;
use App\Models\User;
use Carbon\Carbon;

class CheckOverdueTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:check-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue tasks and log them to activity logs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for overdue tasks...');

        $systemUser = User::where('email', 'system@example.com')->first();
        if (!$systemUser) {
            $this->error('System user (system@example.com) not found. Please seed the database.');
            // Alternatif: coba ambil user admin pertama jika system user tidak ada
            $systemUser = User::where('role', 'admin')->first();
            if (!$systemUser) {
                $this->error('No suitable user (system or admin) found for logging overdue tasks.');
                return 1; // Kembalikan error code
            }
            $this->warn('System user not found, using first admin user for logging.');
        }

        $overdueTasks = Task::where('due_date', '<', Carbon::today()) // Hari ini juga dianggap overdue jika due_date adalah kemarin
            ->where('status', '!=', 'done')
            ->get();

        if ($overdueTasks->isEmpty()) {
            $this->info('No overdue tasks found.');
            return 0;
        }

        $this->info("Found {$overdueTasks->count()} overdue tasks. Logging them...");

        foreach ($overdueTasks as $task) {
            ActivityLog::create([
                'user_id' => $systemUser->id,
                'action' => 'task_overdue',
                'description' => "Task overdue: {$task->title} (ID: {$task->id}) fusible_created_by: {$task->created_by_id}, assigned_to: {$task->assigned_to_id}",
                // logged_at akan otomatis terisi oleh model ActivityLog jika menggunakan useCurrent()
            ]);
            $this->line("Logged overdue task: {$task->title} (ID: {$task->id})");
        }

        $this->info('Finished logging overdue tasks.');
        return 0; // Kembalikan success code
    }
}
