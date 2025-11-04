<?php
require_once __DIR__ . '/bootstrap.php';

// File upload endpoint
// Accepts: multipart/form-data with field 'file'
// Returns: { ok: true, name, url, file_path, size, type }

// Try to raise limits for large uploads (may be ignored depending on SAPI)
@ini_set('upload_max_filesize', '2048M');
@ini_set('post_max_size', '2048M');
@ini_set('memory_limit', '2048M');
@ini_set('max_file_uploads', '500');
@ini_set('max_input_time', '300');
@ini_set('max_execution_time', '1200');

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

// Subfolders: year and gallery (with sensible defaults)
$year = isset($_POST['year']) ? intval($_POST['year']) : 0;
$gallery = isset($_POST['gallery']) ? trim((string)$_POST['gallery']) : '';
if ($year <= 0) { $year = intval(date('Y')); }
if ($gallery === '') { $gallery = 'misc'; }
// Keep original gallery name; disallow directory separators and traversal
$galleryName = $gallery;
$galleryName = str_replace(["\0", "\n", "\r", "\t"], '', $galleryName);
$galleryName = str_replace(['/', '\\'], ' ', $galleryName);
$galleryName = trim($galleryName);

$targetDir = $UPLOAD_DIR;
$urlBase = '/server/uploads';
$BASE_URL = rtrim($_ENV['BASE_URL'] ?? '', '/');
if ($BASE_URL) {
  $urlBase = rtrim($BASE_URL, '/') . '/uploads';
}

// Always nest by year and gallery (as given)
$targetDir .= '/' . $year;
$targetDir .= '/' . $galleryName;
@mkdir($targetDir, 0775, true);

$target = $targetDir . '/' . $filename;

if (!@move_uploaded_file($f['tmp_name'], $target)) {
  // try copy
  if (!@copy($f['tmp_name'], $target)) {
    json_error('Failed to save file', 500);
  }
}

// Build URL safely with rawurlencode per segment
$url = $urlBase . '/' . rawurlencode((string)$year) . '/' . rawurlencode($galleryName) . '/' . rawurlencode($filename);

$type = mime_content_type($target) ?: ($f['type'] ?? 'application/octet-stream');
$size = filesize($target) ?: 0;

// Update gallery metadata.json in the same folder
$metaPath = $targetDir . '/metadata.json';
$meta = [];
if (is_file($metaPath)) {
  $raw = @file_get_contents($metaPath);
  if ($raw !== false) {
    $json = json_decode($raw, true);
    if (is_array($json)) { $meta = $json; }
  }
}
if (!isset($meta['items']) || !is_array($meta['items'])) { $meta['items'] = []; }
$meta['items'][] = [
  'filename' => $filename,
  'url' => $url,
  'type' => (strpos($type, 'video') === 0 ? 'video' : 'image'),
  'size' => $size,
  'uploaded_at' => date('c')
];
@file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));

json_ok([
  'ok' => true,
  'name' => $filename,
  'url' => $url,
  'file_path' => $target,
  'size' => $size,
  'type' => $type,
]);
