<?php
require_once __DIR__ . '/bootstrap.php';

// Two-Factor Authentication (TOTP) endpoints (admin or user)
// Actions:
//   GET  action=setup    -> returns { secret, otpauth }
//   POST action=enable   -> body: { code, secret } verifies and stores on user
//   POST action=verify   -> body: { code } verifies pending login and completes session
//   POST action=disable  -> body: { email? } disables for current user (or by admin for a user)
//
// Storage: users.json keeps per-user: twofa: { enabled: bool, secret: string }

function base32_encode_custom($data) {
  $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  $binary = '';
  foreach (str_split($data) as $char) {
    $binary .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
  }
  $chunks = str_split($binary, 5);
  $out = '';
  foreach ($chunks as $chunk) {
    if (strlen($chunk) < 5) {
      $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
    }
    $out .= $alphabet[bindec($chunk)];
  }
  $pad = (8 - (strlen($out) % 8)) % 8; // base32 padding to 8 chars
  return $out . str_repeat('=', $pad);
}

function base32_decode_custom($b32) {
  $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  $b32 = strtoupper($b32);
  $b32 = rtrim($b32, '=');
  $binary = '';
  for ($i=0; $i<strlen($b32); $i++) {
    $val = strpos($alphabet, $b32[$i]);
    if ($val === false) continue;
    $binary .= str_pad(decbin($val), 5, '0', STR_PAD_LEFT);
  }
  $bytes = str_split($binary, 8);
  $out = '';
  foreach ($bytes as $byte) {
    if (strlen($byte) === 8) $out .= chr(bindec($byte));
  }
  return $out;
}

function totp_now_verify($secret_b32, $code, $timestep = 30, $digits = 6, $window = 1) {
  $secret = base32_decode_custom($secret_b32);
  $time = floor(time() / $timestep);
  for ($i = -$window; $i <= $window; $i++) {
    $c = pack('N*', 0) . pack('N*', $time + $i); // 8-byte counter
    $hash = hash_hmac('sha1', $c, $secret, true);
    $offset = ord(substr($hash, -1)) & 0x0F;
    $truncated = (ord($hash[$offset]) & 0x7F) << 24
      | (ord($hash[$offset + 1]) & 0xFF) << 16
      | (ord($hash[$offset + 2]) & 0xFF) << 8
      | (ord($hash[$offset + 3]) & 0xFF);
    $token = $truncated % pow(10, $digits);
    $tokenStr = str_pad((string)$token, $digits, '0', STR_PAD_LEFT);
    if (hash_equals($tokenStr, trim((string)$code))) return true;
  }
  return false;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = $_GET['action'] ?? ($_POST['action'] ?? 'setup');

$usersFile = $DATA_DIR . '/users.json';
$users = json_read_file($usersFile);
if (!is_array($users)) $users = [];

function find_user_by_email(&$users, $email) {
  for ($i=0; $i<count($users); $i++) {
    if (isset($users[$i]['email']) && strtolower($users[$i]['email']) === strtolower($email)) return $i;
  }
  return -1;
}

if ($method === 'GET' && $action === 'setup') {
  // Must be authenticated to setup for own account OR admin to setup for someone else
  if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) json_error('Unauthorized', 401);
  $email = $_SESSION['email'] ?? '';
  $name = $_SESSION['name'] ?? 'User';
  $secret_raw = random_bytes(20);
  $secret = base32_encode_custom($secret_raw);
  $issuer = urlencode('Booking.tonband');
  $label = urlencode($email ?: $name);
  $otpauth = "otpauth://totp/{$issuer}:{$label}?secret={$secret}&issuer={$issuer}&period=30&digits=6";
  json_ok(['ok' => true, 'secret' => $secret, 'otpauth' => $otpauth]);
}

// Read JSON body for POSTs
$body = [];
if ($method === 'POST') {
  $raw = file_get_contents('php://input') ?: '';
  if ($raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) $body = $json;
  }
  if (empty($body)) $body = $_POST;
}

if ($method === 'POST' && $action === 'enable') {
  if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) json_error('Unauthorized', 401);
  $email = $_SESSION['email'] ?? '';
  $secret = (string)($body['secret'] ?? '');
  $code = (string)($body['code'] ?? '');
  if ($secret === '' || $code === '') json_error('Missing secret/code', 400);
  if (!totp_now_verify($secret, $code)) json_error('Invalid code', 400);
  $idx = find_user_by_email($users, $email);
  if ($idx < 0) json_error('User not found', 404);
  $users[$idx]['twofa'] = [ 'enabled' => true, 'secret' => $secret, 'enabled_at' => date('c') ];
  if (!json_write_file($usersFile, $users)) json_error('Failed to save', 500);
  json_ok(['ok' => true]);
}

if ($method === 'POST' && $action === 'verify') {
  // Used during pending login after password step
  $code = (string)($body['code'] ?? '');
  $email = $_SESSION['pending_2fa_email'] ?? '';
  if ($email === '' || $code === '') json_error('Missing code', 400);
  $idx = find_user_by_email($users, $email);
  if ($idx < 0) json_error('User not found', 404);
  $twofa = $users[$idx]['twofa'] ?? null;
  if (!is_array($twofa) || empty($twofa['enabled']) || empty($twofa['secret'])) json_error('2FA not enabled', 400);
  if (!totp_now_verify((string)$twofa['secret'], $code)) json_error('Invalid code', 400);
  // Success: complete login
  unset($_SESSION['pending_2fa_email']);
  $_SESSION['auth'] = true;
  $_SESSION['role'] = $users[$idx]['role'] ?? 'user';
  $_SESSION['name'] = $users[$idx]['name'] ?? '';
  $_SESSION['email'] = $users[$idx]['email'] ?? '';
  json_ok(['ok' => true, 'role' => $_SESSION['role']]);
}

if ($method === 'POST' && $action === 'disable') {
  if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) json_error('Unauthorized', 401);
  // Users can disable their own 2FA; admins can disable for others by providing email
  $email = (string)($body['email'] ?? '');
  if ($email === '' || (($_SESSION['role'] ?? 'user') !== 'admin')) {
    $email = $_SESSION['email'] ?? '';
  }
  $idx = find_user_by_email($users, $email);
  if ($idx < 0) json_error('User not found', 404);
  unset($users[$idx]['twofa']);
  if (!json_write_file($usersFile, $users)) json_error('Failed to save', 500);
  json_ok(['ok' => true]);
}

json_error('Not Found', 404);
