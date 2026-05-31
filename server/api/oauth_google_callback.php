<?php
require_once __DIR__ . '/bootstrap.php';

$clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
$clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
$redirectUri = $_ENV['GOOGLE_REDIRECT_URI'] ?? '';

if ($clientId === '' || $clientSecret === '' || $redirectUri === '') {
  json_error('Google OAuth not configured', 500);
}

$state = $_GET['state'] ?? '';
$code  = $_GET['code'] ?? '';

if ($state === '' || $code === '' || !isset($_SESSION['oauth_google_state']) || $state !== $_SESSION['oauth_google_state']) {
  json_error('Invalid state or code', 400);
}
unset($_SESSION['oauth_google_state']);

// Exchange code for tokens
$tokenRes = null;
$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
  'code' => $code,
  'client_id' => $clientId,
  'client_secret' => $clientSecret,
  'redirect_uri' => $redirectUri,
  'grant_type' => 'authorization_code',
]));
$resp = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
if ($resp === false || $http < 200 || $http >= 300) {
  json_error('Token exchange failed', 400);
}
$tokenRes = json_decode($resp, true);
$accessToken = $tokenRes['access_token'] ?? '';
if ($accessToken === '') {
  json_error('No access token', 400);
}

// Fetch user info
$ch = curl_init('https://www.googleapis.com/oauth2/v3/userinfo');
curl_setopt($ch, CURLOPT_HTTPHEADER, [ 'Authorization: Bearer ' . $accessToken ]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resp = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
if ($resp === false || $http < 200 || $http >= 300) {
  json_error('Failed to fetch user info', 400);
}
$info = json_decode($resp, true);
$email = strtolower(trim((string)($info['email'] ?? '')));
$name  = trim((string)($info['name'] ?? ''));
if ($email === '') {
  json_error('Email not provided by Google', 400);
}

// Load users.json
$usersFile = $DATA_DIR . '/users.json';
$users = json_read_file($usersFile);
if (!is_array($users)) $users = [];

$found = null;
for ($i=0; $i<count($users); $i++) {
  if (isset($users[$i]['email']) && strtolower($users[$i]['email']) === $email) { $found = &$users[$i]; break; }
}
if ($found === null) {
  $new = [
    'id' => bin2hex(random_bytes(8)),
    'name' => $name ?: $email,
    'email' => $email,
    'password_hash' => '',
    'role' => 'user',
    'created_at' => date('c'),
  ];
  $users[] = $new;
  $found = &$users[array_key_last($users)];
  if (!json_write_file($usersFile, $users)) {
    json_error('Failed to create user', 500);
  }
}

// Start session
$_SESSION['auth'] = true;
$_SESSION['role'] = $found['role'] ?? 'user';
$_SESSION['name'] = $found['name'] ?? '';
$_SESSION['email'] = $found['email'] ?? '';

// Redirect back to app root
$frontend = $_ENV['FRONTEND_URL'] ?? '/';
if ($frontend === '') $frontend = '/';
header('Location: ' . $frontend);
http_response_code(302);
exit;
