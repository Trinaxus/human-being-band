<?php
// server/api/bootstrap.php
// Minimal bootstrap: env loading, CORS, secure session, helpers

// --- Simple .env loader (no external deps) ---
function env_load(string $path): void {
  if (!file_exists($path)) return;
  $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($lines as $line) {
    if (str_starts_with(trim($line), '#')) continue;
    $pos = strpos($line, '=');
    if ($pos === false) continue;
    $key = trim(substr($line, 0, $pos));
    $val = trim(substr($line, $pos + 1));
    $val = trim($val, "\"' ");
    $_ENV[$key] = $val;
  }
}

// Load env from project root server/.env if present
$envPath = __DIR__ . '/../.env';
env_load($envPath);

// --- Config ---
$BASE_URL   = rtrim($_ENV['BASE_URL'] ?? '', '/');
$CORS_ALLOWED_ORIGINS = $_ENV['CORS_ALLOWED_ORIGINS'] ?? '*';
$SESSION_NAME = $_ENV['SESSION_NAME'] ?? 'ss_admin';
$COOKIE_SAMESITE = $_ENV['COOKIE_SAMESITE'] ?? 'Strict';
$COOKIE_SECURE = filter_var($_ENV['COOKIE_SECURE'] ?? false, FILTER_VALIDATE_BOOLEAN);
// Data directory (for users.json, etc.)
$DATA_DIR = rtrim($_ENV['DATA_DIR'] ?? (dirname(__DIR__) . '/data'), '/');
@mkdir($DATA_DIR, 0775, true);

// --- CORS ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowOrigin = '';
if ($CORS_ALLOWED_ORIGINS === '*') {
  $allowOrigin = '*';
} else {
  $allowed = array_map('trim', explode(',', $CORS_ALLOWED_ORIGINS));
  if ($origin !== '' && in_array($origin, $allowed, true)) {
    $allowOrigin = $origin;
  } else {
    if ($origin === 'null' && in_array('null', $allowed, true)) {
      $allowOrigin = 'null';
    }
    if (!$allowOrigin && $origin) {
      $host = parse_url($origin, PHP_URL_HOST) ?: '';
      if (preg_match('/^[a-z0-9-]+\.vercel\.app$/i', $host)) {
        $allowOrigin = $origin;
      }
    }
    if (!$allowOrigin && $origin === '' && !empty($BASE_URL)) {
      $allowOrigin = $BASE_URL;
    }
  }
}

if ($allowOrigin) header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// --- Session ---
if (session_status() === PHP_SESSION_NONE) {
  session_name($SESSION_NAME);
  session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 7, // 7 days
    'path' => '/',
    'domain' => '',
    'secure' => $COOKIE_SECURE,
    'httponly' => true,
    'samesite' => $COOKIE_SAMESITE,
  ]);
  session_start();
}

// --- JSON helpers ---
function json_ok($data = []) {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function json_error($message = 'Bad Request', $code = 400) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
  exit;
}

// --- Simple file helpers ---
function json_read_file(string $path) {
  if (!is_file($path)) return null;
  $txt = @file_get_contents($path);
  if ($txt === false || $txt === '') return null;
  $data = json_decode($txt, true);
  return is_array($data) ? $data : null;
}
function json_write_file(string $path, $data): bool {
  $tmp = $path . '.tmp';
  $ok = @file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  if ($ok === false) return false;
  return @rename($tmp, $path);
}
