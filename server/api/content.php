<?php
require_once __DIR__ . '/bootstrap.php';

// Content management endpoint
// GET: returns current content json (public)
// POST: save content (expects JSON body, admin-only)

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$contentFile = $DATA_DIR . '/content.json';

if ($method === 'GET') {
  $content = json_read_file($contentFile);
  if (!is_array($content)) $content = [];
  json_ok(['ok' => true, 'content' => $content]);
}

// POST requires admin auth
if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || ($_SESSION['role'] ?? 'user') !== 'admin') {
  json_error('Forbidden', 403);
}

// Save
$raw = file_get_contents('php://input') ?: '';
$body = [];
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
if (!is_array($body)) $body = [];

// Allow a defined schema but keep it flexible
$allowed = [
  'heroUrl', 'heroTitle', 'heroText',
  'heroHeight', 'heroFocusX', 'heroFocusY',
  'heroZoom',
  'orbUrl',      // background orb image URL
  'contact',     // { email, phone, address }
  'gallery',     // [urls]
  'buildUrl',    // string
  'mapAddress',  // string
  'map',         // { embedUrl?: string, lat?: number, lng?: number }
  'reviews',     // optional preset reviews content
  'about',       // { title?: string, text?: string }
  'socials',     // [ { type, url } ]
  'tickets'      // [ { id, title, url } ]
];
// Start from existing content and overlay only provided keys
$existing = json_read_file($contentFile);
if (!is_array($existing)) $existing = [];
$save = $existing;
foreach ($allowed as $k) {
  if (array_key_exists($k, $body)) {
    $save[$k] = $body[$k];
  }
}
$save['updated_at'] = date('c');

if (!json_write_file($contentFile, $save)) {
  json_error('Failed to save content', 500);
}

json_ok(['ok' => true, 'content' => $save]);
