<?php
require_once __DIR__ . '/bootstrap.php';

$clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
$redirectUri = $_ENV['GOOGLE_REDIRECT_URI'] ?? '';

if ($clientId === '' || $redirectUri === '') {
  json_error('Google OAuth not configured', 500);
}

$state = bin2hex(random_bytes(16));
$_SESSION['oauth_google_state'] = $state;

$params = [
  'client_id' => $clientId,
  'redirect_uri' => $redirectUri,
  'response_type' => 'code',
  'scope' => 'openid email profile',
  'state' => $state,
  'prompt' => 'select_account',
  'access_type' => 'online',
];

$url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
header('Location: ' . $url);
http_response_code(302);
exit;
