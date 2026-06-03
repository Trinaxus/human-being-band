<?php
// Newsletter: send campaign to verified subscribers (admin only)
require __DIR__ . '/bootstrap.php';

function isAdmin() {
  return !empty($_SESSION['role']) && $_SESSION['role'] === 'admin';
}
if (!isAdmin()) {
  json_error('Forbidden', 403);
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$cid = $body['campaignId'] ?? '';
$lang = ($body['lang'] ?? 'de') === 'en' ? 'en' : 'de';
if (!$cid) {
  json_error('campaignId fehlt.', 400);
}

$dataDir = $DATA_DIR;
$subFile = $dataDir . '/newsletter_subscribers.json';
$camFile = $dataDir . '/newsletter_campaigns.json';

$subs = json_read_file($subFile) ?: [];
$campaigns = json_read_file($camFile) ?: [];

$verified = array_values(array_filter($subs, function($s) {
  return ($s['status'] ?? '') === 'verified';
}));

if (count($verified) === 0) {
  json_error('Keine verifizierten Abonnenten vorhanden.', 400);
}

$found = null;
foreach ($campaigns as $c) {
  if (($c['id'] ?? '') === $cid) {
    $found = $c;
    break;
  }
}
if (!$found) {
  json_error('Kampagne nicht gefunden.', 404);
}

$baseUrl = rtrim($_ENV['BASE_URL'] ?? '', '/');
$fromEmail = $_ENV['NEWSLETTER_FROM'] ?? '';
$subject = $found['subject_' . $lang] ?? '';
$htmlContent = $found['html_' . $lang] ?? '';

// Inline CSS conversion for email safety
function emailInlineCss(string $html): string {
  $html = preg_replace('/class="[^"]*"/i', '', $html);
  $html = str_replace(['<div>', '</div>'], ['<p>', '</p>'], $html);
  $html = preg_replace('/<p\s*>\s*<\/p>/i', '', $html);
  return $html;
}

$cleanHtml = emailInlineCss($htmlContent);

$recipients = 0;
$headersBase = "MIME-Version: 1.0\r\nContent-type: text/html; charset=utf-8\r\n";
if ($fromEmail) {
  $headersBase .= "From: HUMAN BEING <{$fromEmail}>\r\nReply-To: {$fromEmail}\r\n";
}

foreach ($verified as $sub) {
  $email = $sub['email'] ?? '';
  if (!$email) continue;

  $token = $sub['token'] ?? '';
  $unsubUrl = $baseUrl . '/?newsletter_unsubscribe=' . urlencode($token);

  $emailHtml = <<<HTML
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
          {$cleanHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888888;text-align:center;">
          <a href="{$unsubUrl}" style="color:#888888;">Newsletter abbestellen</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;

  $plain = strip_tags($cleanHtml) . "\n\nNewsletter abbestellen: {$unsubUrl}";

  if (function_exists('mail')) {
    mail($email, $subject, $plain, $headersBase);
  }
  $recipients++;
}

// Update campaign sent info
$campaigns = array_map(function($c) use ($cid, $recipients) {
  if (($c['id'] ?? '') === $cid) {
    $c['sent_at'] = date('c');
    $c['recipients_count'] = $recipients;
  }
  return $c;
}, $campaigns);
json_write_file($camFile, $campaigns);

json_ok(['sent' => true, 'recipients' => $recipients]);
