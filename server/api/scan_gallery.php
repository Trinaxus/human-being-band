<?php
require_once __DIR__ . '/bootstrap.php';

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  json_error('Method Not Allowed', 405);
}

header('Content-Type: application/json; charset=utf-8');

$year = isset($_GET['year']) ? intval($_GET['year']) : 0;
$gallery = trim((string)($_GET['gallery'] ?? ''));
if ($year <= 0 || $gallery === '') {
  json_error('Missing year or gallery', 400);
}

$BASE_URL = rtrim($_ENV['BASE_URL'] ?? '', '/');
$baseUrlPrefix = $BASE_URL ? ($BASE_URL . '/uploads') : '/server/uploads';

// Sanitize gallery folder name similarly to write_metadata
$galleryRaw = $gallery;
$galleryName = str_replace(["\0", "\n", "\r", "\t"], '', $galleryRaw);
$galleryName = str_replace(['/', '\\'], ' ', $galleryName);
$galleryName = trim($galleryName);

// Try multiple upload roots
$candidates = [];
$UPLOAD_DIR_ENV = rtrim($_ENV['UPLOAD_DIR'] ?? '', '/');
if ($UPLOAD_DIR_ENV) $candidates[] = $UPLOAD_DIR_ENV;
$candidates[] = rtrim(dirname(__DIR__) . '/uploads', '/');           // server/uploads
$candidates[] = rtrim(dirname(__DIR__, 2) . '/uploads', '/');        // project_root/uploads

// Try gallery name variants
$nameVariants = [];
$nameVariants[] = $galleryName;
$nameVariants[] = urldecode($galleryName);
$nameVariants[] = str_replace('%20', ' ', $galleryName);
$nameVariants = array_values(array_unique($nameVariants));

$galDir = null;
foreach ($candidates as $base) {
  foreach ($nameVariants as $nm) {
    $try = $base . '/' . $year . '/' . $nm;
    if (is_dir($try)) { $galDir = $try; $galleryName = $nm; break 2; }
  }
}

if (!$galDir) {
  // Return empty but OK to keep JSON contract
  echo json_encode([
    'ok' => true,
    'year' => $year,
    'gallery' => $galleryName,
    'metaCount' => 0,
    'serverCount' => 0,
    'diff' => 0,
    'extraFiles' => [],
    'missingInServer' => [],
    'note' => 'Gallery directory not found in known locations'
  ]);
  exit;
}

$metaPath = $galDir . '/metadata.json';
$meta = json_read_file($metaPath) ?: [];
$metaItems = [];
$metaFileCount = 0; // image/video only
$metaLinkCount = 0; // youtube/instagram
if (isset($meta['items']) && is_array($meta['items'])) {
  foreach ($meta['items'] as $mi) {
    $t = strtolower((string)($mi['type'] ?? ''));
    $u = (string)($mi['url'] ?? '');
    if (!$u) continue;
    if (!in_array($t, ['image','video','youtube','instagram'], true)) continue;
    $metaItems[] = [ 'type' => $t, 'url' => $u ];
    if ($t === 'image' || $t === 'video') $metaFileCount++;
    else $metaLinkCount++;
  }
}

$files = @scandir($galDir) ?: [];
$serverFiles = [];
foreach ($files as $fn) {
  if ($fn === '.' || $fn === '..' || $fn === 'metadata.json') continue;
  $full = $galDir . '/' . $fn;
  if (!is_file($full)) continue;
  $ext = strtolower(pathinfo($fn, PATHINFO_EXTENSION));
  $isImage = in_array($ext, ['jpg','jpeg','png','gif','webp','bmp','svg'], true);
  $isVideo = in_array($ext, ['mp4','mov','webm','mkv','avi'], true);
  if (!$isImage && !$isVideo) continue;
  $url = $baseUrlPrefix . '/' . rawurlencode((string)$year) . '/' . rawurlencode($galleryName) . '/' . rawurlencode($fn);
  $serverFiles[] = [ 'type' => ($isVideo ? 'video' : 'image'), 'url' => $url, 'filename' => $fn ];
}

// Build sets for comparison (by URL)
$metaUrlSet = [];
foreach ($metaItems as $it) { $metaUrlSet[$it['url']] = true; }

$extraFiles = [];
foreach ($serverFiles as $sf) {
  if (!isset($metaUrlSet[$sf['url']])) {
    $extraFiles[] = $sf; // present on server, not listed in metadata
  }
}

$missingInServer = [];
$serverUrlSet = [];
foreach ($serverFiles as $sf) { $serverUrlSet[$sf['url']] = true; }
foreach ($metaItems as $mi) {
  if (($mi['type'] === 'image' || $mi['type'] === 'video') && !isset($serverUrlSet[$mi['url']])) {
    $missingInServer[] = $mi; // listed in metadata, but file missing
  }
}

echo json_encode([
  'ok' => true,
  'year' => $year,
  'gallery' => $galleryName,
  'metaCount' => count($metaItems),
  'metaFileCount' => $metaFileCount,
  'metaLinkCount' => $metaLinkCount,
  'metaUrlsOnly' => ($metaFileCount === 0 && $metaLinkCount > 0),
  'serverCount' => count($serverFiles),
  'diff' => count($serverFiles) - count($metaItems),
  'diffFiles' => count($serverFiles) - $metaFileCount,
  'extraFiles' => $extraFiles,
  'missingInServer' => $missingInServer,
]);
