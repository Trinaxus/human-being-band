<?php
require_once __DIR__ . '/bootstrap.php';

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  json_error('Method Not Allowed', 405);
}

$url = isset($_GET['url']) ? trim((string)$_GET['url']) : '';
if ($url === '') json_error('Missing url', 400);

// Basic URL validation
if (!preg_match('~^https?://~i', $url)) {
  json_error('Invalid url', 400);
}

// Fetch HTML (server-side to avoid CORS)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 8);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
// Lightweight UA
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; HBB-LinkPreview/1.0)');
$html = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($html === false || !$html || $code >= 400) {
  json_ok(['ok' => false, 'thumbnail' => null, 'title' => null]);
}

// Extract OpenGraph/Twitter meta
$thumbnail = null;
$title = null;
$patterns = [
  '~<meta[^>]+property=["\"]og:image["\"][^>]+content=["\"]([^"\"]+)["\"][^>]*>~i',
  '~<meta[^>]+name=["\"]twitter:image["\"][^>]+content=["\"]([^"\"]+)["\"][^>]*>~i',
];
foreach ($patterns as $p) {
  if (preg_match($p, $html, $m)) { $thumbnail = $m[1]; break; }
}
if (preg_match('~<meta[^>]+property=["\"]og:title["\"][^>]+content=["\"]([^"\"]+)["\"][^>]*>~i', $html, $m)) {
  $title = $m[1];
} elseif (preg_match('~<title>(.*?)</title>~is', $html, $m)) {
  $title = trim(html_entity_decode(strip_tags($m[1])));
}

json_ok(['ok' => true, 'thumbnail' => $thumbnail, 'title' => $title]);
