<?php
// Newsletter: list subscribers (admin only)
require __DIR__ . '/bootstrap.php';

function isAdmin() {
  return !empty($_SESSION['role']) && $_SESSION['role'] === 'admin';
}
if (!isAdmin()) {
  json_error('Forbidden', 403);
}

$dataDir = $DATA_DIR;
$subFile = $dataDir . '/newsletter_subscribers.json';
$subs = json_read_file($subFile) ?: [];

// Sort by date desc
usort($subs, function($a, $b) {
  return strcmp($b['subscribed_at'] ?? '', $a['subscribed_at'] ?? '');
});

json_ok(['subscribers' => $subs]);
