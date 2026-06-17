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
<html lang="{$lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
  body { margin:0; padding:0; background-color:#0a0a0a; font-family:'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  .wrapper { width:100%; background-color:#0a0a0a; padding:40px 0; }
  .container { width:600px; max-width:100%; margin:0 auto; background-color:#111111; border-radius:12px; overflow:hidden; border:1px solid #262626; }
  .header { background:linear-gradient(135deg,#8C1423 0%,#a0182a 100%); padding:40px 32px; text-align:center; }
  .header h1 { color:#ffffff; font-size:24px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin:0; font-family:'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .header .tagline { color:rgba(255,255,255,0.7); font-size:13px; margin-top:8px; letter-spacing:1px; }
  .content { padding:40px 32px; color:#e5e5e5; font-size:16px; line-height:1.7; }
  .content p { margin:0 0 16px 0; }
  .content a { color:#f43f5e; text-decoration:none; }
  .content a:hover { text-decoration:underline; }
  .btn { display:inline-block; padding:14px 28px; background:linear-gradient(135deg,#8C1423 0%,#a0182a 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px; }
  .footer { background-color:#0f0f0f; padding:32px; text-align:center; border-top:1px solid #262626; }
  .footer .divider { width:40px; height:2px; background-color:#8C1423; margin:0 auto 20px auto; border-radius:1px; }
  .footer p { color:#737373; font-size:13px; margin:0 0 12px 0; line-height:1.5; }
  .footer a { color:#a3a3a3; text-decoration:underline; font-size:12px; }
  .footer a:hover { color:#ffffff; }
  @media only screen and (max-width:600px) {
    .container { width:100% !important; border-radius:0 !important; border:none !important; }
    .header { padding:32px 20px !important; }
    .content { padding:28px 20px !important; }
    .footer { padding:24px 20px !important; }
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>HUMAN BEING</h1>
        <div class="tagline">LIVEBAND FOR EVENTS & KONZERTE</div>
      </div>
      <div class="content">
        <p style="color:#ffffff;font-size:20px;font-weight:700;margin-bottom:8px;">Willkommen!</p>
        <p>Danke für dein Interesse an unserem Newsletter. Bitte bestätige deine Anmeldung mit einem Klick auf den folgenden Link:</p>
        <p style="text-align:center;margin:32px 0;">
          <a href="{$verifyUrl}" class="btn">Newsletter bestätigen</a>
        </p>
        <p style="font-size:13px;color:#737373;">Falls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.</p>
      </div>
      <div class="footer">
        <div class="divider"></div>
        <p><a href="{$unsubUrl}">Newsletter abbestellen</a></p>
      </div>
    </div>
  </div>
</body>
</html>
HTML;

$plainText = "Danke für dein Interesse an unserem Newsletter.\n\nBitte bestätige deine Anmeldung:\n{$verifyUrl}\n\nFalls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.\n\nAbmelden: {$unsubUrl}";

// Encode subject for safe UTF-8 transmission
$subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';

// Build multipart/alternative email for both HTML and plain text
$boundary = md5(uniqid(time()));
$multipartHeaders = "MIME-Version: 1.0\r\n";
$multipartHeaders .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
if ($fromEmail) {
  $multipartHeaders .= "From: HUMAN BEING <{$fromEmail}>\r\n";
  $multipartHeaders .= "Reply-To: {$fromEmail}\r\n";
}

$multipartBody = "--{$boundary}\r\n";
$multipartBody .= "Content-Type: text/plain; charset=utf-8\r\n";
$multipartBody .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
$multipartBody .= quoted_printable_encode($plainText) . "\r\n\r\n";
$multipartBody .= "--{$boundary}\r\n";
$multipartBody .= "Content-Type: text/html; charset=utf-8\r\n";
$multipartBody .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
$multipartBody .= quoted_printable_encode($html) . "\r\n\r\n";
$multipartBody .= "--{$boundary}--\r\n";

if (function_exists('mail')) {
  mail($email, $subjectEncoded, $multipartBody, $multipartHeaders);
}

json_ok(['message' => 'Bitte prüfe dein Postfach und bestätige die Anmeldung.', 'sent' => true]);
