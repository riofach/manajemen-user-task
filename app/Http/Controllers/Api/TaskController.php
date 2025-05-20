<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use OpenApi\Annotations as OA;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /tasks
     * Filter berdasarkan role:
     * - Admin: semua task
     * - Manager: task yang dibuatnya, ditugaskan padanya, atau ditugaskan ke staff
     * - Staff: task yang dibuatnya atau ditugaskan padanya
     *
     * @OA\Get(
     *     path="/tasks",
     *     summary="Ambil daftar tugas",
     *     tags={"Task"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Berhasil mengambil daftar tugas"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     )
     * )
     */
    public function index(Request $request)
    {
        try {
            // Perubahan: membungkus authorization dalam try-catch
            try {
                $this->authorize('viewAny', Task::class);
            } catch (\Exception $authError) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki hak akses untuk melihat daftar tugas: ' . $authError->getMessage()
                ], 403);
            }

            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $query = Task::with(['assignedTo:id,name,email', 'createdBy:id,name,email']);

            if ($user->role === 'admin') {
                // Admin bisa melihat semua task
            } elseif ($user->role === 'manager') {
                // Manager: task yang dibuatnya, atau ditugaskan padanya, atau (ditugaskan ke user lain DAN user lain itu adalah staff)
                // Perlu penyesuaian jika ingin lebih detail "own team" berdasarkan relasi manager-staff
                $query->where(function ($q) use ($user) {
                    $q->where('created_by_id', $user->id)
                        ->orWhere('assigned_to_id', $user->id)
                        ->orWhereHas('assignedTo', function ($assignedUserQuery) {
                            $assignedUserQuery->where('role', 'staff');
                        });
                });
            } elseif ($user->role === 'staff') {
                // Staff: task yang dibuatnya atau ditugaskan padanya
                $query->where(function ($q) use ($user) {
                    $q->where('created_by_id', $user->id)
                        ->orWhere('assigned_to_id', $user->id);
                });
            }

            $tasks = $query->latest()->paginate(15);

            // Konversi ke array untuk mencegah masalah serialisasi
            $tasksArray = $tasks->toArray();

            // Bersihkan deskripsi (jika ada) dan pastikan semua field valid untuk JSON
            if (isset($tasksArray['data']) && is_array($tasksArray['data'])) {
                foreach ($tasksArray['data'] as $key => $task) {
                    // Bersihkan deskripsi jika ada
                    if (isset($task['description'])) {
                        $tasksArray['data'][$key]['description'] = $this->sanitizeString($task['description']);
                    }

                    // Bersihkan judul
                    if (isset($task['title'])) {
                        $tasksArray['data'][$key]['title'] = $this->sanitizeString($task['title']);
                    }

                    // Pastikan JSON-safe untuk data assigned_to
                    if (isset($task['assigned_to']) && is_array($task['assigned_to'])) {
                        foreach ($task['assigned_to'] as $field => $value) {
                            if (is_string($value)) {
                                $tasksArray['data'][$key]['assigned_to'][$field] = $this->sanitizeString($value);
                            }
                        }
                    }

                    // Pastikan JSON-safe untuk data created_by
                    if (isset($task['created_by']) && is_array($task['created_by'])) {
                        foreach ($task['created_by'] as $field => $value) {
                            if (is_string($value)) {
                                $tasksArray['data'][$key]['created_by'][$field] = $this->sanitizeString($value);
                            }
                        }
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Daftar tugas berhasil diambil.',
                'data' => $tasksArray
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil daftar tugas: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTrace() : null
            ], 500);
        }
    }

    /**
     * Sanitasi string untuk memastikannya aman digunakan dalam JSON
     *
     * @param string|null $string
     * @return string|null
     */
    private function sanitizeString($string)
    {
        if ($string === null) {
            return null;
        }

        // Hapus karakter kontrol dan pastikan UTF-8 valid
        $string = preg_replace('/[\x00-\x1F\x7F]/u', '', $string);

        // Pastikan UTF-8 valid, ganti karakter tidak valid dengan spasi
        $string = mb_convert_encoding($string, 'UTF-8', 'UTF-8');

        return $string;
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

    /**
     * Store a newly created resource in storage.
     * POST /tasks
     * Akses: Semua role bisa membuat. Manager hanya bisa assign ke staff.
     *
     * @OA\Post(
     *     path="/tasks",
     *     summary="Tambah tugas baru",
     *     tags={"Task"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title"},
     *             @OA\Property(property="title", type="string", example="Tugas Baru"),
     *             @OA\Property(property="description", type="string", example="Deskripsi tugas"),
     *             @OA\Property(property="assigned_to_id", type="string", format="uuid", example="uuid-user"),
     *             @OA\Property(property="status", type="string", enum={"pending","in_progress","done"}, example="pending"),
     *             @OA\Property(property="due_date", type="string", format="date", example="2024-06-30")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Tugas berhasil dibuat"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
     */
    public function store(Request $request)
    {
        $this->authorize('create', Task::class);

        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to_id' => ['nullable', 'uuid', Rule::exists(User::class, 'id')],
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'done'])],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        // Validasi Business Logic: Manager hanya bisa assign task ke staff
        if ($user->role === 'manager' && $request->filled('assigned_to_id')) {
            $assignedUser = User::find($request->assigned_to_id);
            if (!$assignedUser || $assignedUser->role !== 'staff') {
                return response()->json(['status' => 'error', 'message' => 'Manager hanya bisa menugaskan task kepada staff.'], 422);
            }
        }
        // Staff tidak bisa assign task ke orang lain, hanya bisa untuk diri sendiri atau tidak diassign
        if ($user->role === 'staff' && $request->filled('assigned_to_id') && $request->assigned_to_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Staff hanya bisa menugaskan task kepada diri sendiri atau tidak menugaskan sama sekali.'], 422);
        }


        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'assigned_to_id' => ($user->role === 'staff' && !$request->filled('assigned_to_id')) ? $user->id : $request->assigned_to_id, // Jika staff & tidak assign, assign ke diri sendiri
            'status' => $request->input('status', 'pending'),
            'due_date' => $request->due_date,
            'created_by_id' => $user->id,
        ]);
        // Catat log aktivitas
        $this->logActivity($user->id, 'create_task', 'Membuat tugas baru: ' . $task->title);

        return response()->json(['status' => 'success', 'message' => 'Tugas berhasil dibuat.', 'data' => $task->load(['assignedTo:id,name,email', 'createdBy:id,name,email'])], 201);
    }

    /**
     * Display the specified resource.
     * GET /tasks/{task}
     *
     * @OA\Get(
     *     path="/tasks/{task}",
     *     summary="Ambil detail tugas",
     *     tags={"Task"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="task", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Detail tugas berhasil diambil"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Tugas tidak ditemukan")
     * )
     */
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        return response()->json(['status' => 'success', 'message' => 'Detail tugas berhasil diambil.', 'data' => $task->load(['assignedTo:id,name,email', 'createdBy:id,name,email'])], 200);
    }

    /**
     * Update the specified resource in storage.
     * PUT /tasks/{task}
     *
     * @OA\Put(
     *     path="/tasks/{task}",
     *     summary="Update tugas",
     *     tags={"Task"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="task", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="title", type="string", example="Tugas Update"),
     *             @OA\Property(property="description", type="string", example="Deskripsi update"),
     *             @OA\Property(property="assigned_to_id", type="string", format="uuid", example="uuid-user"),
     *             @OA\Property(property="status", type="string", enum={"pending","in_progress","done"}, example="in_progress"),
     *             @OA\Property(property="due_date", type="string", format="date", example="2024-07-01")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Tugas berhasil diperbarui"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Tugas tidak ditemukan"),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
     */
    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task);
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to_id' => ['nullable', 'uuid', Rule::exists(User::class, 'id')],
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'done'])],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        // Validasi Business Logic: Manager hanya bisa assign task ke staff
        if ($user->role === 'manager' && $request->filled('assigned_to_id')) {
            $assignedUser = User::find($request->assigned_to_id);
            if (!$assignedUser || $assignedUser->role !== 'staff') {
                return response()->json(['status' => 'error', 'message' => 'Manager hanya bisa menugaskan task kepada staff.'], 422);
            }
        }
        // Staff tidak bisa assign task ke orang lain (jika mencoba mengubah assignment)
        if ($user->role === 'staff' && $request->filled('assigned_to_id') && $request->assigned_to_id !== $user->id && $request->assigned_to_id !== $task->assigned_to_id) {
            return response()->json(['status' => 'error', 'message' => 'Staff hanya bisa mengubah tugas yang ditugaskan kepada diri sendiri.'], 422);
        }

        $task->update($request->all());
        // Catat log aktivitas
        $this->logActivity(Auth::id(), 'update_task', 'Memperbarui tugas: ' . $task->title);

        return response()->json(['status' => 'success', 'message' => 'Tugas berhasil diperbarui.', 'data' => $task->load(['assignedTo:id,name,email', 'createdBy:id,name,email'])], 200);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /tasks/{task}
     *
     * @OA\Delete(
     *     path="/tasks/{task}",
     *     summary="Hapus tugas",
     *     tags={"Task"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="task", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Tugas berhasil dihapus"),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Tugas tidak ditemukan")
     * )
     */
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        $deletedTitle = $task->title;
        $task->delete();
        // Catat log aktivitas
        $this->logActivity(Auth::id(), 'delete_task', 'Menghapus tugas: ' . $deletedTitle);
        return response()->json(['status' => 'success', 'message' => 'Tugas berhasil dihapus.'], 200);
    }

    /**
     * Export daftar tugas ke CSV (Bonus)
     * GET /tasks/export/csv
     * Akses: semua role (admin, manager, staff)
     *
     * @OA\Get(
     *     path="/tasks/export/csv",
     *     summary="Export daftar tugas ke CSV",
     *     tags={"Task"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="File CSV berhasil diunduh",
     *         @OA\MediaType(mediaType="text/csv")
     *     ),
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=403, description="Forbidden")
     * )
     */
    public function exportCsv(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak. Silakan login.'], 403);
        }

        // Query/filter sama seperti index()
        $query = Task::with(['assignedTo:id,name,email', 'createdBy:id,name,email']);
        if ($user->role === 'manager') {
            $query->where(function ($q) use ($user) {
                $q->where('created_by_id', $user->id)
                    ->orWhere('assigned_to_id', $user->id)
                    ->orWhereHas('assignedTo', function ($assignedUserQuery) {
                        $assignedUserQuery->where('role', 'staff');
                    });
            });
        } elseif ($user->role === 'staff') {
            $query->where(function ($q) use ($user) {
                $q->where('created_by_id', $user->id)
                    ->orWhere('assigned_to_id', $user->id);
            });
        }
        $tasks = $query->latest()->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="tasks_export_' . now()->format('Ymd_His') . '.csv"',
        ];

        $callback = function () use ($tasks) {
            $handle = fopen('php://output', 'w');
            // Header CSV
            fputcsv($handle, ['No', 'Judul', 'Deskripsi', 'Status', 'Tenggat Waktu', 'Dibuat Oleh', 'Ditugaskan Kepada']);
            $no = 1;
            foreach ($tasks as $task) {
                fputcsv($handle, [
                    $no++,
                    $task->title,
                    $task->description,
                    $task->status,
                    $task->due_date ? $task->due_date->format('Y-m-d') : '',
                    $task->createdBy ? $task->createdBy->name : '',
                    $task->assignedTo ? $task->assignedTo->name : '',
                ]);
            }
            fclose($handle);
        };
        return response()->stream($callback, 200, $headers);
    }
}