<?php
require_once __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') { json_error('Method Not Allowed', 405); }

$raw = file_get_contents('php://input') ?: '';
$body = [];
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
if (!is_array($body)) $body = [];

$name = trim((string)($body['name'] ?? ''));
$email = trim((string)($body['email'] ?? ''));
$date = trim((string)($body['date'] ?? ''));
$event = trim((string)($body['event'] ?? ''));
$location = trim((string)($body['location'] ?? ''));
$message = trim((string)($body['message'] ?? ''));
$budget = trim((string)($body['budget'] ?? ''));

if ($name === '' || !preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
  json_error('Invalid name or email', 400);
}

// Build record
$id = bin2hex(random_bytes(8));
$record = [
  'id' => $id,
  'name' => $name,
  'email' => $email,
  'date' => $date,
  'event' => $event,
  'location' => $location,
  'budget' => $budget,
  'message' => $message,
  'created_at' => date('c'),
  'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
  'ua' => $_SERVER['HTTP_USER_AGENT'] ?? null,
];

// Persist requests to JSON file
$reqFile = $DATA_DIR . '/booking_requests.json';
$existing = json_read_file($reqFile);
if (!is_array($existing)) $existing = [];
$existing[] = $record;
if (!json_write_file($reqFile, $existing)) {
  json_error('Failed to write request', 500);
}

// Optional email notification
try {
  $content = json_read_file($DATA_DIR . '/content.json');
  $to = is_array($content) ? trim((string)($content['booking']['recipientEmail'] ?? '')) : '';
  if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Neue Booking-Anfrage: ' . ($event !== '' ? $event : $name);
    $lines = [
      'Neue Booking-Anfrage',
      'Name: ' . $name,
      'Email: ' . $email,
      $date !== '' ? ('Datum: ' . $date) : null,
      $event !== '' ? ('Event: ' . $event) : null,
      $location !== '' ? ('Ort: ' . $location) : null,
      $budget !== '' ? ('Budget: ' . $budget) : null,
      'Nachricht:',
      $message !== '' ? $message : '—',
    ];
    $bodyTxt = implode("\n", array_values(array_filter($lines, fn($x) => $x !== null)));
    // @ suppress in environments without mail() configured; failure is non-fatal
    @mail($to, $subject, $bodyTxt, 'From: no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
  }
} catch (Throwable $e) { /* ignore mail errors */ }

json_ok(['ok' => true, 'id' => $id]);
