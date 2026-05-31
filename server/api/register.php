<?php
require_once __DIR__ . '/bootstrap.php';

// Expect JSON or form data: name, email, password
$body = [];
$raw = file_get_contents('php://input') ?: '';
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
if (empty($body)) { $body = $_POST; }

$name = trim((string)($body['name'] ?? ''));
$email = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');

if ($name === '' || $email === '' || $password === '') {
  json_error('Missing fields: name, email, password', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_error('Invalid email', 400);
}

$usersFile = $DATA_DIR . '/users.json';
$users = json_read_file($usersFile);
if (!is_array($users)) $users = [];

// Unique email
foreach ($users as $u) {
  if (isset($u['email']) && strtolower($u['email']) === $email) {
    json_error('Email already registered', 409);
  }
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$user = [
  'id' => bin2hex(random_bytes(8)),
  'name' => $name,
  'email' => $email,
  'password_hash' => $hash,
  'role' => 'user',
  'created_at' => date('c')
];

$users[] = $user;
if (!json_write_file($usersFile, $users)) {
  json_error('Failed to write user store', 500);
}

// Optionally, auto-login new user
$_SESSION['auth'] = true;
$_SESSION['role'] = 'user';
$_SESSION['email'] = $email;
$_SESSION['name'] = $name;

json_ok(['ok' => true, 'user' => ['id' => $user['id'], 'name' => $name, 'email' => $email, 'role' => 'user']]);
