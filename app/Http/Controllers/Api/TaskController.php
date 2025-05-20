<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /tasks
     * Filter berdasarkan role:
     * - Admin: semua task
     * - Manager: task yang dibuatnya, ditugaskan padanya, atau ditugaskan ke staff
     * - Staff: task yang dibuatnya atau ditugaskan padanya
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
     * Store a newly created resource in storage.
     * POST /tasks
     * Akses: Semua role bisa membuat. Manager hanya bisa assign ke staff.
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

        return response()->json(['status' => 'success', 'message' => 'Tugas berhasil dibuat.', 'data' => $task->load(['assignedTo:id,name,email', 'createdBy:id,name,email'])], 201);
    }

    /**
     * Display the specified resource.
     * GET /tasks/{task}
     */
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        return response()->json(['status' => 'success', 'message' => 'Detail tugas berhasil diambil.', 'data' => $task->load(['assignedTo:id,name,email', 'createdBy:id,name,email'])], 200);
    }

    /**
     * Update the specified resource in storage.
     * PUT /tasks/{task}
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

        return response()->json(['status' => 'success', 'message' => 'Tugas berhasil diperbarui.', 'data' => $task->load(['assignedTo:id,name,email', 'createdBy:id,name,email'])], 200);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /tasks/{task}
     */
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        $task->delete();
        return response()->json(['status' => 'success', 'message' => 'Tugas berhasil dihapus.'], 200);
    }
}