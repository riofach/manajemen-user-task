<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Menghapus kolom lama
            $table->dropMorphs('tokenable');

            // Membuat kolom baru dengan tipe string untuk mendukung UUID
            $table->string('tokenable_type');
            $table->string('tokenable_id', 36); // 36 karakter untuk UUID
            $table->index(['tokenable_type', 'tokenable_id'], 'personal_access_tokens_tokenable_type_tokenable_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Menghapus kolom custom
            $table->dropIndex('personal_access_tokens_tokenable_type_tokenable_id_index');
            $table->dropColumn(['tokenable_type', 'tokenable_id']);

            // Mengembalikan kolom asli
            $table->morphs('tokenable');
        });
    }
};