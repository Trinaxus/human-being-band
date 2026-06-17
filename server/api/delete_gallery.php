<?php
require_once __DIR__ . '/bootstrap.php';

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_error('Method Not Allowed', 405);
}
if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
  json_error('Forbidden', 403);
}

$payload = json_decode(file_get_contents('php://input') ?: '[]', true);
$year = intval($payload['year'] ?? 0);
$gallery = trim((string)($payload['gallery'] ?? ''));
if ($year <= 0 || $gallery === '') {
  json_error('Invalid parameters', 400);
}

$UPLOAD_DIR = rtrim($_ENV['UPLOAD_DIR'] ?? (dirname(__DIR__) . '/uploads'), '/');

// Sanitize gallery folder name
$galleryName = str_replace(["\0", "\n", "\r", "\t"], '', $gallery);
$galleryName = str_replace(['/', '\\'], ' ', $galleryName);
$galleryName = trim($galleryName);
$galDir = $UPLOAD_DIR . '/' . $year . '/' . $galleryName;

if (!is_dir($galDir)) {
  json_ok([ 'ok' => true, 'deleted' => false, 'note' => 'Gallery directory not found' ]);
}

// Delete all files in gallery directory
$files = @scandir($galDir) ?: [];
$deletedFiles = [];
foreach ($files as $f) {
  if ($f === '.' || $f === '..') continue;
  $full = $galDir . '/' . $f;
  if (is_file($full)) {
    if (@unlink($full)) $deletedFiles[] = $f;
  }
}

// Delete metadata.json
$metaPath = $galDir . '/metadata.json';
if (is_file($metaPath)) @unlink($metaPath);

// Delete empty gallery directory
@rmdir($galDir);

// Try to delete empty year directory
$yearDir = $UPLOAD_DIR . '/' . $year;
$yearFiles = @scandir($yearDir) ?: [];
if (count($yearFiles) <= 2) { // Only . and ..
  @rmdir($yearDir);
}

json_ok([
  'ok' => true,
  'deleted' => true,
  'files_deleted' => $deletedFiles,
  'gallery_path' => $galDir,
]);
