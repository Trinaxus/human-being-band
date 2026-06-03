<?php
// Newsletter: campaigns CRUD (admin only)
require __DIR__ . '/bootstrap.php';

function isAdmin() {
  return !empty($_SESSION['role']) && $_SESSION['role'] === 'admin';
}
if (!isAdmin()) {
  json_error('Forbidden', 403);
}

$dataDir = $DATA_DIR;
$camFile = $dataDir . '/newsletter_campaigns.json';
$campaigns = json_read_file($camFile) ?: [];

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
  usort($campaigns, function($a, $b) {
    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
  });
  json_ok(['campaigns' => $campaigns]);
}

if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?: [];
  $id = $body['id'] ?? '';
  if (!$id) {
    json_error('ID fehlt.', 400);
  }
  $next = [
    'id' => $id,
    'subject_de' => $body['subject_de'] ?? '',
    'subject_en' => $body['subject_en'] ?? '',
    'html_de' => $body['html_de'] ?? '',
    'html_en' => $body['html_en'] ?? '',
    'created_at' => $body['created_at'] ?? date('c'),
    'sent_at' => $body['sent_at'] ?? null,
    'recipients_count' => $body['recipients_count'] ?? 0,
  ];

  $found = false;
  $campaigns = array_map(function($c) use ($id, $next, &$found) {
    if (($c['id'] ?? '') === $id) {
      $found = true;
      return $next;
    }
    return $c;
  }, $campaigns);
  if (!$found) {
    $campaigns[] = $next;
  }

  json_write_file($camFile, $campaigns);
  json_ok(['campaign' => $next]);
}

if ($method === 'DELETE') {
  $body = json_decode(file_get_contents('php://input'), true) ?: [];
  $id = $body['id'] ?? '';
  $campaigns = array_values(array_filter($campaigns, function($c) use ($id) {
    return ($c['id'] ?? '') !== $id;
  }));
  json_write_file($camFile, $campaigns);
  json_ok(['deleted' => true]);
}

json_error('Method not allowed', 405);
