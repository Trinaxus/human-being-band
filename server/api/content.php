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
  'backgroundUrl', // static page background image URL
  'backgroundPosX', // bg position X percent
  'backgroundPosY', // bg position Y percent
  'backgroundFilter', // filters and tint for background image
  'contact',       // { email, phone, address }
  'gallery',       // [urls]
  'buildUrl',      // string
  'mapAddress',    // string
  'map',           // { embedUrl?: string, lat?: number, lng?: number }
  'about',         // { title?: string, text?: string, members?: [] }
  'mediaEmbeds',   // [ { id, type: 'spotify', url, title?, enabled?, order? } ]
  'socials',       // [ { type, url } ]
  'tickets',       // [ { id, title, url } ]
  'galleries',     // structured galleries
  'galleriesIgnore', // [{ year, name }] to suppress re-importing specific folders
  'sectionsOrder', // custom order of sections on Home
  'newsEnabled',   // toggle for news/blog visibility
  'news',          // array of posts { id, title, html, date, published }
  'booking',       // booking config { enabled?, headline?, recipientEmail?, phone?, note? }
  'events'         // scheduler events [{ id, date, time?, title, location?, link?, description?, published? }]
];
// Start from existing content and overlay only provided keys
$existing = json_read_file($contentFile);
if (!is_array($existing)) $existing = [];
$save = $existing;
foreach ($allowed as $k) {
  if (!array_key_exists($k, $body)) continue;
  if ($k === 'about') {
    $prev = isset($existing['about']) && is_array($existing['about']) ? $existing['about'] : [];
    $next = is_array($body['about']) ? $body['about'] : [];
    // Deep-merge: if 'members' missing in payload, keep previous members
    if (!array_key_exists('members', $next) && array_key_exists('members', $prev)) {
      $next['members'] = $prev['members'];
    }
    $save['about'] = array_replace($prev, $next);
  } else {
    $save[$k] = $body[$k];
  }
}
$save['updated_at'] = date('c');

if (!json_write_file($contentFile, $save)) {
  json_error('Failed to save content', 500);
}

json_ok(['ok' => true, 'content' => $save]);
