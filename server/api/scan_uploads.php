<?php
require_once __DIR__ . '/bootstrap.php';

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  json_error('Method Not Allowed', 405);
}

$UPLOAD_DIR = rtrim($_ENV['UPLOAD_DIR'] ?? (dirname(__DIR__) . '/uploads'), '/');
$BASE_URL = rtrim($_ENV['BASE_URL'] ?? '', '/');
$baseUrlPrefix = $BASE_URL ? ($BASE_URL . '/uploads') : '/server/uploads';

$galleries = [];

if (!is_dir($UPLOAD_DIR)) {
  json_ok([ 'ok' => true, 'galleries' => [] ]);
}

$yearDirs = @scandir($UPLOAD_DIR) ?: [];
foreach ($yearDirs as $yd) {
  if ($yd === '.' || $yd === '..') continue;
  // Year directories must be 4-digit numbers
  if (!preg_match('/^\d{4}$/', $yd)) continue;
  $year = intval($yd);
  $yearPath = $UPLOAD_DIR . '/' . $yd;
  if (!is_dir($yearPath)) continue;

  $galleryDirs = @scandir($yearPath) ?: [];
  foreach ($galleryDirs as $gd) {
    if ($gd === '.' || $gd === '..') continue;
    $galleryPath = $yearPath . '/' . $gd;
    if (!is_dir($galleryPath)) continue;

    // Use folder name as gallery name (slug)
    $galleryName = $gd;

    $files = @scandir($galleryPath) ?: [];
    $items = [];
    // 1) Collect items from metadata.json first (external links etc.)
    $metaPath = $galleryPath . '/metadata.json';
    $status = null;
    if (is_file($metaPath)) {
      $raw = @file_get_contents($metaPath);
      if ($raw !== false) {
        $json = json_decode($raw, true);
        if (is_array($json) && isset($json['items']) && is_array($json['items'])) {
          foreach ($json['items'] as $mi) {
            $t = strtolower((string)($mi['type'] ?? ''));
            $u = (string)($mi['url'] ?? '');
            if (!$u) continue;
            if (!in_array($t, ['image','video','youtube','instagram'])) continue;
            $items[] = [ 'type' => $t, 'url' => $u ];
          }
        }
        if (is_array($json) && isset($json['status'])) {
          $st = (string)$json['status'];
          if (in_array($st, ['public','internal','locked'], true)) {
            $status = $st;
          }
        }
      }
    }
    // 2) Add file-based items from the folder
    foreach ($files as $fn) {
      if ($fn === '.' || $fn === '..') continue;
      $full = $galleryPath . '/' . $fn;
      if (!is_file($full)) continue;
      $ext = strtolower(pathinfo($fn, PATHINFO_EXTENSION));
      // Basic filter by extension
      $isImage = in_array($ext, ['jpg','jpeg','png','gif','webp','bmp','svg']);
      $isVideo = in_array($ext, ['mp4','mov','webm','mkv','avi']);
      if (!$isImage && !$isVideo) continue;
      $url = $baseUrlPrefix . '/' . rawurlencode($yd) . '/' . rawurlencode($gd) . '/' . rawurlencode($fn);
      $candidate = [ 'type' => $isVideo ? 'video' : 'image', 'url' => $url ];
      // Avoid duplicates by URL
      $exists = false;
      foreach ($items as $it) { if (($it['url'] ?? '') === $candidate['url']) { $exists = true; break; } }
      if (!$exists) $items[] = $candidate;
    }

    // Only add galleries that have at least one item
    if (count($items) > 0) {
      $gal = [ 'year' => $year, 'name' => $galleryName, 'items' => $items ];
      if ($status !== null) $gal['status'] = $status;
      $galleries[] = $gal;
    }
  }
}

// Sort galleries: year desc, name asc
usort($galleries, function($a, $b) {
  if ($a['year'] === $b['year']) return strcasecmp($a['name'], $b['name']);
  return $b['year'] <=> $a['year'];
});

json_ok([ 'ok' => true, 'galleries' => $galleries ]);
