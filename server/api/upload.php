<?php
require_once __DIR__ . '/bootstrap.php';

// File upload endpoint
// Accepts: multipart/form-data with field 'file'
// Returns: { ok: true, name, url, file_path, size, type }

$UPLOAD_DIR = rtrim($_ENV['UPLOAD_DIR'] ?? (dirname(__DIR__) . '/uploads'), '/');
@mkdir($UPLOAD_DIR, 0775, true);

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_error('Method Not Allowed', 405);
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
  json_error('No file uploaded', 400);
}

$f = $_FILES['file'];
if (($f['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
  json_error('Upload error', 400);
}

$name = $f['name'] ?? 'upload';
$ext = pathinfo($name, PATHINFO_EXTENSION);
$base = pathinfo($name, PATHINFO_FILENAME);
$slug = preg_replace('/[^a-z0-9-_]+/i', '-', $base);
$slug = trim($slug, '-');
$unique = $slug . '-' . bin2hex(random_bytes(4));
$filename = $unique . ($ext ? ('.' . $ext) : '');
$target = $UPLOAD_DIR . '/' . $filename;

if (!@move_uploaded_file($f['tmp_name'], $target)) {
  // try copy
  if (!@copy($f['tmp_name'], $target)) {
    json_error('Failed to save file', 500);
  }
}

$BASE_URL = rtrim($_ENV['BASE_URL'] ?? '', '/');
$url = $BASE_URL ? ($BASE_URL . '/uploads/' . $filename) : ('/server/uploads/' . $filename);

$type = mime_content_type($target) ?: ($f['type'] ?? 'application/octet-stream');
$size = filesize($target) ?: 0;

json_ok([
  'ok' => true,
  'name' => $filename,
  'url' => $url,
  'file_path' => $target,
  'size' => $size,
  'type' => $type,
]);
