<?php
// Newsletter: subscribe + send verification email
require __DIR__ . '/bootstrap.php';

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$email = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$lang = ($body['lang'] ?? 'de') === 'en' ? 'en' : 'de';

// Determine frontend URL: prefer FRONTEND_URL, then BASE_URL, then Referer
$baseUrl = rtrim($_ENV['FRONTEND_URL'] ?? '', '/');
if (!$baseUrl) {
  $baseUrl = rtrim($_ENV['BASE_URL'] ?? '', '/');
}
// If BASE_URL points to an api subdomain, try to derive main domain
if ($baseUrl && str_contains($baseUrl, '://api.')) {
  $baseUrl = preg_replace('#^(https?://)api\.#', '$1', $baseUrl);
}
// Last resort: use Referer header and strip path
if (!$baseUrl) {
  $ref = $_SERVER['HTTP_REFERER'] ?? '';
  if ($ref) {
    $parts = parse_url($ref);
    $baseUrl = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
  }
}
$fromEmail = $_ENV['NEWSLETTER_FROM'] ?? '';

if (!$email) {
  json_error('Bitte eine gültige E-Mail-Adresse eingeben.', 400);
}

$dataDir = $DATA_DIR;
$subFile = $dataDir . '/newsletter_subscribers.json';
$subs = json_read_file($subFile) ?: [];

// Check if already exists
$existing = null;
foreach ($subs as $s) {
  if (strtolower($s['email'] ?? '') === strtolower($email)) {
    $existing = $s;
    break;
  }
}

if ($existing && ($existing['status'] ?? '') === 'verified') {
  json_ok(['message' => 'Diese E-Mail ist bereits angemeldet.', 'already' => true]);
}

$token = bin2hex(random_bytes(16));
$newSub = [
  'email' => $email,
  'status' => 'pending',
  'token' => $token,
  'lang' => $lang,
  'subscribed_at' => date('c'),
  'verified_at' => null,
];

if ($existing) {
  // Update existing pending entry
  $subs = array_map(function($s) use ($email, $newSub) {
    if (strtolower($s['email'] ?? '') === strtolower($email)) return $newSub;
    return $s;
  }, $subs);
} else {
  $subs[] = $newSub;
}

json_write_file($subFile, $subs);

// Send verification email
$verifyUrl = $baseUrl . '/?newsletter_verify=' . urlencode($token);
$unsubUrl  = $baseUrl . '/?newsletter_unsubscribe=' . urlencode($token);

$subject = 'Bitte bestätige deine Newsletter-Anmeldung';
$html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
    <tr><td align="center" style="padding:20px 0;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#8C1423;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:20px;margin:0;">HUMAN BEING</h1>
        </td></tr>
        <tr><td style="padding:32px 24px;color:#333333;font-size:16px;line-height:1.5;">
          <p>Hallo,</p>
          <p>danke für dein Interesse an unserem Newsletter. Bitte bestätige deine Anmeldung mit einem Klick auf den folgenden Link:</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="{$verifyUrl}" style="display:inline-block;padding:12px 24px;background:#8C1423;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Newsletter bestätigen</a>
          </p>
          <p style="font-size:13px;color:#888888;">Falls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888888;text-align:center;">
          <a href="{$unsubUrl}" style="color:#888888;">Abbestellen</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=utf-8\r\n";
if ($fromEmail) {
  $headers .= "From: HUMAN BEING <{$fromEmail}>\r\n";
  $headers .= "Reply-To: {$fromEmail}\r\n";
}

$plain = "Danke für dein Interesse an unserem Newsletter.\n\nBitte bestätige deine Anmeldung:\n{$verifyUrl}\n\nFalls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.\n\nAbmelden: {$unsubUrl}";

if (function_exists('mail')) {
  mail($email, $subject, $plain, $headers);
}

json_ok(['message' => 'Bitte prüfe dein Postfach und bestätige die Anmeldung.', 'sent' => true]);
