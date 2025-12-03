<?php
// server/api/admin-password.php
// Simple HTML form to generate a bcrypt hash for ADMIN_PASSWORD_HASH
// IMPORTANT: Remove or rename this file after use to avoid exposing a hash tool publicly.

$generated = null;
$error = null;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  $pwd = (string)($_POST['password'] ?? '');
  $pwd2 = (string)($_POST['password_confirm'] ?? '');
  if ($pwd === '' || $pwd2 === '') {
    $error = 'Bitte beide Passwort-Felder ausfüllen.';
  } elseif ($pwd !== $pwd2) {
    $error = 'Die Passwörter stimmen nicht überein.';
  } else {
    // Default cost is fine; you can increase to 12 if server performance allows
    $generated = password_hash($pwd, PASSWORD_BCRYPT);
    if ($generated === false) {
      $error = 'Hash konnte nicht erzeugt werden.';
    }
  }
}

?><!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Passwort-Hash Generator</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background: #0b0b0b; color: #eaeaea; }
    .container { max-width: 640px; margin: 0 auto; }
    .card { background: #151515; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    h1 { font-size: 20px; margin: 0 0 16px; }
    p { line-height: 1.5; color: #cfcfcf; }
    .field { margin: 12px 0; }
    label { display: block; font-size: 13px; color: #b5b5b5; margin-bottom: 6px; }
    input[type="password"], input[type="text"], textarea { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #333; background: #0f0f0f; color: #fff; font-size: 14px; }
    textarea { min-height: 96px; resize: vertical; }
    .row { display: flex; gap: 10px; align-items: stretch; }
    .btn { appearance: none; border: 1px solid #444; background: #1f1f1f; color: #fff; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn.primary { background: #2563eb; border-color: #2563eb; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .muted { color: #9a9a9a; font-size: 12px; }
    .error { background: #3b0d0d; border: 1px solid #5a1a1a; color: #ffcdcd; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; }
    .success { background: #0d3b1f; border: 1px solid #1a5a34; color: #c8ffde; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; }
    code { background: #0f0f0f; border: 1px solid #2a2a2a; padding: 2px 6px; border-radius: 6px; }
    .copy-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Admin Passwort-Hash Generator</h1>
      <p>Gib dein neues Admin-Passwort ein. Diese Seite erzeugt daraus einen <strong>Bcrypt-Hash</strong>, den du in <code>server/.env</code> bei <code>ADMIN_PASSWORD_HASH</code> eintragen kannst.</p>

      <?php if ($error): ?>
        <div class="error"><?= htmlspecialchars($error, ENT_QUOTES) ?></div>
      <?php endif; ?>

      <?php if ($generated && !$error): ?>
        <div class="success">Hash erfolgreich erzeugt.</div>
        <div class="field">
          <label>Erzeugter Hash</label>
          <div class="copy-row">
            <input type="text" id="hash" value="<?= htmlspecialchars($generated, ENT_QUOTES) ?>" readonly />
            <button class="btn" type="button" onclick="copyHash()">Kopieren</button>
          </div>
        </div>
        <div class="field">
          <label>Eintrag für <code>server/.env</code></label>
          <textarea readonly>ADMIN_PASSWORD_HASH="<?= htmlspecialchars($generated, ENT_QUOTES) ?>"</textarea>
        </div>
        <p class="muted">Tipp: Danach ausloggen und mit dem neuen Passwort wieder einloggen. Entferne diese Seite anschließend vom Server.</p>
        <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 16px 0;" />
      <?php endif; ?>

      <form method="post" autocomplete="off">
        <div class="field">
          <label>Neues Passwort</label>
          <input type="password" name="password" required />
        </div>
        <div class="field">
          <label>Neues Passwort (Bestätigung)</label>
          <input type="password" name="password_confirm" required />
        </div>
        <div class="row" style="margin-top: 8px;">
          <button class="btn primary" type="submit">Hash erzeugen</button>
          <button class="btn" type="reset">Zurücksetzen</button>
        </div>
      </form>

      <p class="muted" style="margin-top: 14px;">
        Sicherheit: Diese Seite sollte nur temporär verfügbar sein. Entferne sie nach der Verwendung oder lege eine Schutzmaßnahme (z.B. IP-Restriktion) davor.
      </p>
    </div>
  </div>
  <script>
    function copyHash() {
      const el = document.getElementById('hash');
      el.select();
      el.setSelectionRange(0, 99999);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(el.value).then(()=>{}).catch(()=>{});
      } else {
        document.execCommand('copy');
      }
    }
  </script>
</body>
</html>
