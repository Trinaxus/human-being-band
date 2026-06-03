<?php
// Newsletter: unsubscribe via token
require __DIR__ . '/bootstrap.php';

$token = trim($_GET['token'] ?? '');
if (!$token || !ctype_alnum($token)) {
  json_error('Ungültiger Link.', 400);
}

$dataDir = $DATA_DIR;
$subFile = $dataDir . '/newsletter_subscribers.json';
$subs = json_read_file($subFile) ?: [];

$found = false;
$subs = array_values(array_filter($subs, function($s) use ($token, &$found) {
  if (($s['token'] ?? '') === $token) {
    $found = true;
    return false;
  }
  return true;
}));

if (!$found) {
  json_error('Link ungültig.', 400);
}

json_write_file($subFile, $subs);
json_ok(['message' => 'Du wurdest erfolgreich abgemeldet.', 'unsubscribed' => true]);
