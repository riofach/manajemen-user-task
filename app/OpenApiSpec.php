<?php

namespace App;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="Manajemen User & Task API",
 *     description="Dokumentasi API untuk aplikasi manajemen user dan tugas.",
 *     @OA\Contact(
 *         email="support@yourdomain.com",
 *         name="Support"
 *     )
 * )
 * @OA\Server(
 *     url="http://localhost:8000/api",
 *     description="Local API Server"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
class OpenApiSpec
{
    // Kosong, hanya untuk menampung anotasi global
}