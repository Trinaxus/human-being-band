<?php
require_once __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') { json_error('Method Not Allowed', 405); }

$raw = file_get_contents('php://input') ?: '';
$body = [];
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
if (!is_array($body)) $body = [];

$name = trim((string)($body['name'] ?? ''));
$email = trim((string)($body['email'] ?? ''));
$date = trim((string)($body['date'] ?? ''));
$event = trim((string)($body['event'] ?? ''));
$location = trim((string)($body['location'] ?? ''));
$message = trim((string)($body['message'] ?? ''));
$budget = trim((string)($body['budget'] ?? ''));

if ($name === '' || !preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
  json_error('Invalid name or email', 400);
}

// Build record
$id = bin2hex(random_bytes(8));
$record = [
  'id' => $id,
  'name' => $name,
  'email' => $email,
  'date' => $date,
  'event' => $event,
  'location' => $location,
  'budget' => $budget,
  'message' => $message,
  'created_at' => date('c'),
  'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
  'ua' => $_SERVER['HTTP_USER_AGENT'] ?? null,
  'status' => 'open',
];

// Persist requests to JSON file
$reqFile = $DATA_DIR . '/booking_requests.json';
$existing = json_read_file($reqFile);
if (!is_array($existing)) $existing = [];
$existing[] = $record;
if (!json_write_file($reqFile, $existing)) {
  json_error('Failed to write request', 500);
}

// Optional email notification (SMTP preferred; fallback to mail())
try {
  $content = json_read_file($DATA_DIR . '/content.json');
  $to = is_array($content) ? trim((string)($content['booking']['recipientEmail'] ?? '')) : '';
  if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $subject = 'Neue Booking-Anfrage: ' . ($event !== '' ? $event : $name);
    $lines = [
      'Neue Booking-Anfrage',
      'Name: ' . $name,
      'Email: ' . $email,
      $date !== '' ? ('Datum: ' . $date) : null,
      $event !== '' ? ('Event: ' . $event) : null,
      $location !== '' ? ('Ort: ' . $location) : null,
      $budget !== '' ? ('Budget: ' . $budget) : null,
      'Nachricht:',
      $message !== '' ? $message : '—',
    ];
    $bodyTxt = implode("\r\n", array_values(array_filter($lines, fn($x) => $x !== null)));

    // SMTP configuration via environment
    $SMTP_HOST   = trim((string)getenv('SMTP_HOST'));
    $SMTP_PORT   = (int)(getenv('SMTP_PORT') ?: 587);
    $SMTP_USER   = trim((string)getenv('SMTP_USER'));
    $SMTP_PASS   = (string)getenv('SMTP_PASS');
    $SMTP_SECURE = strtolower(trim((string)(getenv('SMTP_SECURE') ?: 'tls')));
    $FROM_EMAIL  = trim((string)(getenv('FROM_EMAIL') ?: $SMTP_USER ?: ('no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'))));
    $FROM_NAME   = trim((string)(getenv('FROM_NAME') ?: 'Website'));

    $headers = [];
    $headers[] = 'From: ' . ($FROM_NAME !== '' ? (mb_encode_mimeheader($FROM_NAME) . ' <' . $FROM_EMAIL . '>') : $FROM_EMAIL);
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $headers[] = 'Reply-To: ' . $email;
    }
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Date: ' . date('r');
    $headers[] = 'Message-ID: <' . uniqid('', true) . '@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '>';
    $headersStr = implode("\r\n", $headers);

    $sent = false;
    $debug = (string)getenv('SMTP_DEBUG') === '1';
    $debugLog = function($msg) use ($debug, $DATA_DIR) {
      if (!$debug) return;
      $file = $DATA_DIR . '/email_log.txt';
      @file_put_contents($file, '['.date('c')."] ".$msg."\n", FILE_APPEND);
    };

    // Minimal SMTP client (LOGIN auth, STARTTLS for tls, SSL wrapper for ssl)
    if ($SMTP_HOST !== '' && $SMTP_USER !== '' && $SMTP_PASS !== '') {
      $host = $SMTP_HOST;
      $port = $SMTP_PORT > 0 ? $SMTP_PORT : 587;
      $secure = in_array($SMTP_SECURE, ['ssl','tls'], true) ? $SMTP_SECURE : 'tls';
      $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
      $debugLog("SMTP connect to {$host}:{$port} (secure={$secure})");
      $fp = @stream_socket_client($remote, $errno, $errstr, 10, STREAM_CLIENT_CONNECT);
      if ($fp) {
        stream_set_timeout($fp, 10);
        $read = function() use ($fp) { return fgets($fp, 513) ?: ''; };
        $write = function($s) use ($fp) { fwrite($fp, $s."\r\n"); };
        $ok = function($line, $expected='2') { return strlen($line) > 0 && $line[0] === $expected; };

        $banner = $read();
        $debugLog('SMTP banner: '.trim($banner));
        $write('EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $resp = $read();
        $debugLog('EHLO resp: '.trim($resp));
        if (!$ok($resp)) {
          // Try HELO
          $write('HELO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
          $resp = $read();
          $debugLog('HELO resp: '.trim($resp));
        }
        if ($secure === 'tls') {
          $write('STARTTLS');
          $resp = $read();
          $debugLog('STARTTLS resp: '.trim($resp));
          if ($ok($resp)) {
            @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $write('EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
            $resp = $read();
            $debugLog('EHLO (post-TLS) resp: '.trim($resp));
          }
        }
        // AUTH LOGIN
        $write('AUTH LOGIN'); $resp = $read(); $debugLog('AUTH LOGIN resp: '.trim($resp));
        $write(base64_encode($SMTP_USER)); $resp = $read(); $debugLog('USER resp: '.trim($resp));
        $write(base64_encode($SMTP_PASS)); $resp = $read(); $debugLog('PASS resp: '.trim($resp));
        if ($ok($resp, '2')) {
          $write('MAIL FROM: <' . $FROM_EMAIL . '>'); $resp = $read(); $debugLog('MAIL FROM resp: '.trim($resp));
          $write('RCPT TO: <' . $to . '>'); $resp = $read(); $debugLog('RCPT TO resp: '.trim($resp));
          $write('DATA'); $resp = $read(); $debugLog('DATA resp: '.trim($resp));
          $msg  = 'Subject: ' . mb_encode_mimeheader($subject) . "\r\n";
          $msg .= $headersStr . "\r\n\r\n" . $bodyTxt . "\r\n";
          $msg .= ".\r\n"; // Proper SMTP DATA termination
          $write($msg); $resp = $read(); $debugLog('SEND resp: '.trim($resp));
          if ($ok($resp)) { $sent = true; }
          $write('QUIT');
        }
        fclose($fp);
      } else {
        $debugLog('SMTP connect failed: '.$errno.' '.$errstr);
      }
    }

    if (!$sent) {
      // Fallback to mail()
      $debugLog('Falling back to mail()');
      @mail($to, $subject, $bodyTxt, $headersStr);
    }
  }
} catch (Throwable $e) { /* ignore mail errors */ }

json_ok(['ok' => true, 'id' => $id]);
