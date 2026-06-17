<?php
require_once __DIR__ . '/bootstrap.php';

// Users management + public password reset
// Actions:
//   - GET (action=list) [admin]: returns list of users (id, name, email, role, created_at)
//   - POST (action=setRole) [admin]: body: { id, role }
//   - POST (action=request_reset) [public]: body: { email }
//   - POST (action=confirm_reset) [public]: body: { email, token, new_password }

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');

$usersFile = $DATA_DIR . '/users.json';
$users = json_read_file($usersFile);
if (!is_array($users)) $users = [];

function users_save($file, $users) {
  if (!json_write_file($file, $users)) {
    json_error('Failed to write user store', 500);
  }
}

// Helper to find user by email (case-insensitive)
function &find_user_by_email(&$users, $email) {
  $null = null;
  for ($i=0; $i<count($users); $i++) {
    if (isset($users[$i]['email']) && strtolower($users[$i]['email']) === strtolower($email)) {
      return $users[$i];
    }
  }
  return $null;
}

// Public: request password reset
if ($method === 'POST' && $action === 'request_reset') {
  $body = [];
  $raw = file_get_contents('php://input') ?: '';
  if ($raw !== '') { $json = json_decode($raw, true); if (is_array($json)) $body = $json; }
  if (empty($body)) { $body = $_POST; }
  $email = strtolower(trim((string)($body['email'] ?? '')));
  // Always return ok to avoid user enumeration
  if ($email !== '') {
    $u =& find_user_by_email($users, $email);
    if ($u !== null) {
      if (!is_array($u['reset_tokens'] ?? null)) $u['reset_tokens'] = [];
      $token = bin2hex(random_bytes(24));
      $hash = hash('sha256', $token);
      $ttlMinutes = 30;
      $expires = date('c', time() + $ttlMinutes*60);
      // Append token entry
      $u['reset_tokens'][] = [ 'token_hash' => $hash, 'expires_at' => $expires, 'used' => false ];
      // Persist
      foreach ($users as &$x) { if (($x['email'] ?? '') === $u['email']) { $x = $u; break; } }
      unset($x);
      users_save($usersFile, $users);
      // Build reset URL
      $frontend = $_ENV['FRONTEND_URL'] ?? '/';
      if ($frontend === '') $frontend = '/';
      $sep = (strpos($frontend, '?') !== false) ? '&' : (substr($frontend, -1) === '/' ? '' : '/') . '';
      // Use hash-based route so server doesn't need to resolve a file (works with static hosting)
      // Example: https://domain/app/#reset?email=...&token=...
      $url = rtrim($frontend, '/') . '/#reset?email=' . urlencode($email) . '&token=' . urlencode($token);
      // Send email (mail()) if configured, always log as fallback
      $fromEmail = $_ENV['MAIL_FROM_EMAIL'] ?? '';
      $fromName  = $_ENV['MAIL_FROM_NAME']  ?? 'SoundScheduler';
      $subject   = $_ENV['MAIL_SUBJECT_RESET'] ?? 'Passwort zurücksetzen';
      $body      = "Hallo,\n\nfür deine E-Mail ($email) wurde ein Zurücksetzen des Passworts angefordert.\n\nKlicke auf diesen Link, um ein neues Passwort zu setzen (30 Minuten gültig):\n$url\n\nFalls du das nicht warst, ignoriere diese E-Mail.\n\nGrüße\n$fromName";
      if ($fromEmail !== '') {
        $headers = [];
        $headers[] = 'From: '.($fromName ? (mb_encode_mimeheader($fromName).' <'.$fromEmail.'>') : $fromEmail);
        $headers[] = 'Reply-To: '.$fromEmail;
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        // Suppress errors to not leak details
        @mail($email, '=?UTF-8?B?'.base64_encode($subject).'?=', $body, implode("\r\n", $headers));
      }
      $log = "Password reset for $email: $url\n";
      @file_put_contents($DATA_DIR . '/mail.log', '['.date('c').'] '.$log, FILE_APPEND);
    }
  }
  json_ok(['ok' => true]);
}

// Public: confirm password reset
if ($method === 'POST' && $action === 'confirm_reset') {
  $body = [];
  $raw = file_get_contents('php://input') ?: '';
  if ($raw !== '') { $json = json_decode($raw, true); if (is_array($json)) $body = $json; }
  if (empty($body)) { $body = $_POST; }
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $token = (string)($body['token'] ?? '');
  $new = (string)($body['new_password'] ?? '');
  if ($email === '' || $token === '' || $new === '') { json_error('Invalid input', 400); }
  $u =& find_user_by_email($users, $email);
  if ($u === null) { json_error('Invalid token', 400); }
  $hash = hash('sha256', $token);
  $tokens = is_array($u['reset_tokens'] ?? null) ? $u['reset_tokens'] : [];
  $foundIdx = -1;
  for ($i=0; $i<count($tokens); $i++) {
    $t = $tokens[$i];
    if (($t['token_hash'] ?? '') === $hash && ($t['used'] ?? false) === false && strtotime($t['expires_at'] ?? '') > time()) {
      $foundIdx = $i; break;
    }
  }
  if ($foundIdx < 0) { json_error('Invalid or expired token', 400); }
  // Set new password
  $u['password_hash'] = password_hash($new, PASSWORD_ARGON2ID);
  $u['reset_tokens'][$foundIdx]['used'] = true;
  // Persist
  for ($i=0; $i<count($users); $i++) { if (($users[$i]['email'] ?? '') === $u['email']) { $users[$i] = $u; break; } }
  users_save($usersFile, $users);
  json_ok(['ok' => true]);
}

// AuthZ: only admin beyond this point
if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || ($_SESSION['role'] ?? 'user') !== 'admin') {
  json_error('Forbidden', 403);
}

if ($method === 'GET' && $action === 'list') {
  // Do not expose password hashes
  $public = array_map(function($u) {
    return [
      'id' => $u['id'] ?? '',
      'name' => $u['name'] ?? '',
      'email' => $u['email'] ?? '',
      'role' => $u['role'] ?? 'user',
      'created_at' => $u['created_at'] ?? null,
    ];
  }, $users);
  json_ok(['users' => $public]);
}

if ($method === 'POST' && $action === 'setRole') {
  // Read JSON or form
  $body = [];
  $raw = file_get_contents('php://input') ?: '';
  if ($raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) $body = $json;
  }
  if (empty($body)) { $body = $_POST; }

  $id = (string)($body['id'] ?? '');
  $role = (string)($body['role'] ?? '');
  $role = strtolower(trim($role));

  if ($id === '' || ($role !== 'user' && $role !== 'admin')) {
    json_error('Invalid id or role', 400);
  }

  $found = false;
  foreach ($users as &$u) {
    if (($u['id'] ?? '') === $id) {
      $u['role'] = $role;
      $found = true;
      break;
    }
  }
  unset($u);

  if (!$found) {
    json_error('User not found', 404);
  }

  users_save($usersFile, $users);
  json_ok(['ok' => true]);
}

json_error('Not Found', 404);
