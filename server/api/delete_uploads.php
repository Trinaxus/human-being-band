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
$files = $payload['files'] ?? [];
if ($year <= 0 || $gallery === '' || !is_array($files) || count($files) === 0) {
  json_error('Invalid parameters', 400);
}

$UPLOAD_DIR = rtrim($_ENV['UPLOAD_DIR'] ?? (dirname(__DIR__) . '/uploads'), '/');

// Sanitize gallery folder name similarly to write_metadata
$galleryName = str_replace(["\0", "\n", "\r", "\t"], '', $gallery);
$galleryName = str_replace(['/', '\\'], ' ', $galleryName);
$galleryName = trim($galleryName);
$galDir = $UPLOAD_DIR . '/' . $year . '/' . $galleryName;
if (!is_dir($galDir)) json_error('Gallery not found', 404);

// Normalize incoming file identifiers to absolute paths under $galDir
function normalize_to_path(string $input, string $galDir, int $year, string $galleryName): ?string {
  // Accept either full URL or plain filename
  // If URL: take basename
  $candidate = $input;
  if (preg_match('~^https?://~i', $candidate)) {
    $parts = parse_url($candidate);
    if (!$parts || !isset($parts['path'])) return null;
    $candidate = basename($parts['path']);
  }
  // Remove any path separators
  $candidate = str_replace(['/', '\\'], '', $candidate);
  $full = $galDir . '/' . $candidate;
  // Must be a file and inside gallery
  if (!is_file($full)) return null;
  // Only allow image/video extensions
  $ext = strtolower(pathinfo($full, PATHINFO_EXTENSION));
  $isImage = in_array($ext, ['jpg','jpeg','png','gif','webp','bmp','svg'], true);
  $isVideo = in_array($ext, ['mp4','mov','webm','mkv','avi'], true);
  if (!$isImage && !$isVideo) return null;
  return $full;
}

$deleted = [];
$errors = [];
foreach ($files as $f) {
  $path = normalize_to_path((string)$f, $galDir, $year, $galleryName);
  if ($path === null) { $errors[] = [ 'file' => $f, 'error' => 'Not found or not deletable' ]; continue; }
  if (@unlink($path)) { $deleted[] = basename($path); }
  else { $errors[] = [ 'file' => basename($path), 'error' => 'Delete failed' ]; }
}

json_ok([
  'ok' => true,
  'deleted' => $deleted,
  'errors' => $errors,
]);
