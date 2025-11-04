<?php
require_once __DIR__ . '/bootstrap.php';

// Admin-only endpoint to write gallery metadata.json
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_error('Method Not Allowed', 405);
}
if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
  json_error('Forbidden', 403);
}

$payload = json_decode(file_get_contents('php://input') ?: '[]', true);
$year = intval($payload['year'] ?? 0);
$gallery = trim((string)($payload['gallery'] ?? ''));
$items = $payload['items'] ?? [];
$status = isset($payload['status']) ? (string)$payload['status'] : null; // 'public'|'internal'|'locked'

if ($year <= 0 || $gallery === '' || !is_array($items)) {
  json_error('Invalid parameters', 400);
}

$UPLOAD_DIR = rtrim($_ENV['UPLOAD_DIR'] ?? (dirname(__DIR__) . '/uploads'), '/');
// Keep original gallery name, but sanitize to prevent path traversal and separators
$galleryName = str_replace(["\0", "\n", "\r", "\t"], '', $gallery);
$galleryName = str_replace(['/', '\\'], ' ', $galleryName);
$galleryName = trim($galleryName);
$targetDir = $UPLOAD_DIR . '/' . $year . '/' . $galleryName;
if (!is_dir($targetDir)) @mkdir($targetDir, 0775, true);
$metaPath = $targetDir . '/metadata.json';

$normItems = [];
foreach ($items as $it) {
  $t = strtolower((string)($it['type'] ?? ''));
  $u = (string)($it['url'] ?? '');
  $title = isset($it['title']) ? (string)$it['title'] : null;
  if (!$u) continue;
  if (!in_array($t, ['image','video','youtube','instagram'])) continue;
  $row = [ 'type' => $t, 'url' => $u ];
  if ($title !== null && $title !== '') $row['title'] = $title;
  $normItems[] = $row;
}

// Read existing meta to preserve fields we don't overwrite
$existing = [];
if (is_file($metaPath)) {
  $raw = @file_get_contents($metaPath);
  if ($raw !== false) {
    $json = json_decode($raw, true);
    if (is_array($json)) $existing = $json;
  }
}

$meta = $existing;
$meta['items'] = $normItems;
if ($status !== null && in_array($status, ['public','internal','locked'], true)) {
  $meta['status'] = $status;
}
$meta['updated_at'] = date('c');
if (@file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)) === false) {
  json_error('Failed to write metadata', 500);
}

json_ok([ 'ok' => true, 'written' => count($normItems) ]);
