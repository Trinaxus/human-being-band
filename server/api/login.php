<?php
require_once __DIR__ . '/bootstrap.php';

// Read JSON or form body
$body = [];
$raw = file_get_contents('php://input') ?: '';
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
if (empty($body)) { $body = $_POST; }

$username = trim((string)($body['username'] ?? ''));
$email = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');

$adminUser = $_ENV['ADMIN_USERNAME'] ?? 'admin';
$adminHash = $_ENV['ADMIN_PASSWORD_HASH'] ?? '';

if (($username === '' && $email === '') || $password === '') {
  json_error('Missing credentials', 400);
}

// 1) Admin login by username matches env admin user
if ($username !== '' && $username === $adminUser && $adminHash !== '') {
  if (!password_verify($password, $adminHash)) {
    json_error('Unauthorized', 401);
  }
  $_SESSION['auth'] = true;
  $_SESSION['role'] = 'admin';
  $_SESSION['name'] = 'Admin';
  $_SESSION['email'] = $_ENV['ADMIN_EMAIL'] ?? '';
  json_ok(['ok' => true, 'role' => 'admin']);
}

// 2) User login by email from users.json
$usersFile = $DATA_DIR . '/users.json';
$users = json_read_file($usersFile);
if (!is_array($users)) $users = [];

if ($email === '' && $username !== '') {
  // treat provided username as email for convenience
  $email = strtolower($username);
}

$found = null;
foreach ($users as $u) {
  if (isset($u['email']) && strtolower($u['email']) === $email) {
    $found = $u; break;
  }
}

if (!$found || empty($found['password_hash']) || !password_verify($password, $found['password_hash'])) {
  json_error('Unauthorized', 401);
}

// If user has TOTP enabled, start pending 2FA instead of completing login
$twofa = $found['twofa'] ?? null;
if (is_array($twofa) && !empty($twofa['enabled']) && !empty($twofa['secret'])) {
  $_SESSION['pending_2fa_email'] = $found['email'];
  json_ok(['require_totp' => true]);
}

// Complete login
$_SESSION['auth'] = true;
$_SESSION['role'] = $found['role'] ?? 'user';
$_SESSION['name'] = $found['name'] ?? '';
$_SESSION['email'] = $found['email'] ?? '';

json_ok(['ok' => true, 'role' => $_SESSION['role']]);
