<?php
require_once __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') { http_response_code(204); exit; }

// Require admin auth
if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
  json_error('Forbidden', 403);
}

$reqFile = $DATA_DIR . '/booking_requests.json';
$existing = json_read_file($reqFile);
if (!is_array($existing)) $existing = [];

if ($method === 'GET') {
  // Sort by created_at desc if present
  usort($existing, function($a, $b) {
    $ta = strtotime($a['created_at'] ?? '');
    $tb = strtotime($b['created_at'] ?? '');
    return $tb <=> $ta;
  });
  json_ok(['ok' => true, 'requests' => $existing]);
}

// POST: update or delete
$raw = file_get_contents('php://input') ?: '';
$body = [];
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
// Fallback: accept form submissions (FormData / x-www-form-urlencoded)
if (!is_array($body) || empty($body)) {
  if (!empty($_POST) && is_array($_POST)) {
    $body = $_POST;
  } else {
    $body = [];
  }
}

$action = (string)($body['action'] ?? '');
if ($action === 'update') {
  $id = (string)($body['id'] ?? '');
  $status = (string)($body['status'] ?? '');
  if ($id === '' || $status === '') json_error('Missing id or status', 400);
  // Whitelist statuses
  $allowed = ['open','confirmed','done','archived'];
  if (!in_array($status, $allowed, true)) json_error('Invalid status', 400);
  $updated = false;
  foreach ($existing as &$r) {
    if (($r['id'] ?? '') === $id) {
      $r['status'] = $status;
      $r['updated_at'] = date('c');
      $updated = true;
      break;
    }
  }
  if (!$updated) json_error('Not found', 404);
  if (!json_write_file($reqFile, $existing)) json_error('Failed to write', 500);
  json_ok(['ok' => true]);
}

if ($action === 'delete') {
  $id = (string)($body['id'] ?? '');
  if ($id === '') json_error('Missing id', 400);
  $next = array_values(array_filter($existing, fn($r) => ($r['id'] ?? '') !== $id));
  if (count($next) === count($existing)) json_error('Not found', 404);
  if (!json_write_file($reqFile, $next)) json_error('Failed to write', 500);
  json_ok(['ok' => true]);
}

json_error('Bad Request', 400);
