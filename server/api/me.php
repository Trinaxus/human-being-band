<?php
require_once __DIR__ . '/bootstrap.php';

$authenticated = isset($_SESSION['auth']) && $_SESSION['auth'] === true;
$role = $authenticated ? ($_SESSION['role'] ?? 'admin') : null;
$name = $authenticated ? ($_SESSION['name'] ?? '') : null;
$email = $authenticated ? ($_SESSION['email'] ?? '') : null;

$twofaEnabled = false;
if ($authenticated && $email) {
  $usersFile = $DATA_DIR . '/users.json';
  $users = json_read_file($usersFile);
  if (is_array($users)) {
    foreach ($users as $u) {
      if (isset($u['email']) && strtolower($u['email']) === strtolower($email)) {
        $two = $u['twofa'] ?? null;
        if (is_array($two) && !empty($two['enabled']) && !empty($two['secret'])) {
          $twofaEnabled = true;
        }
        break;
      }
    }
  }
}

json_ok([
  'authenticated' => $authenticated,
  'role' => $role,
  'name' => $name,
  'email' => $email,
  'twofaEnabled' => $twofaEnabled,
]);
