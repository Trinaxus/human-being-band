<?php
// Newsletter: verify subscription via token
require __DIR__ . '/bootstrap.php';

$token = trim($_GET['token'] ?? '');
if (!$token || !ctype_alnum($token)) {
  json_error('Ungültiger Link.', 400);
}

$dataDir = $DATA_DIR;
$subFile = $dataDir . '/newsletter_subscribers.json';
$subs = json_read_file($subFile) ?: [];

$found = false;
foreach ($subs as &$s) {
  if (($s['token'] ?? '') === $token) {
    $s['status'] = 'verified';
    $s['verified_at'] = date('c');
    $found = true;
    break;
  }
}
unset($s);

if (!$found) {
  json_error('Link ungültig oder bereits verwendet.', 400);
}

json_write_file($subFile, $subs);
json_ok(['message' => 'Deine Anmeldung wurde bestätigt. Vielen Dank!', 'verified' => true]);
