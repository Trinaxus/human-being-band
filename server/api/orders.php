<?php
require_once __DIR__ . '/bootstrap.php';

// Orders endpoint
// GET (admin): list all orders
// POST action=create (public): create a new order
// POST action=update (admin): update status of an order

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$dataFile = $DATA_DIR . '/orders.json';

function orders_read_all($file) {
  $arr = json_read_file($file);
  if (!is_array($arr)) $arr = [];
  if (!isset($arr['orders']) || !is_array($arr['orders'])) $arr['orders'] = [];
  return $arr;
}

function orders_write_all($file, $data) {
  return json_write_file($file, $data);
}

if ($method === 'GET') {
  $action = $_GET['action'] ?? '';
  if ($action === 'mine') {
    // authenticated users: list own orders (by session email if available, else by name)
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) json_error('Unauthorized', 401);
    $all = orders_read_all($dataFile);
    $email = strtolower((string)($_SESSION['email'] ?? ''));
    $name = (string)($_SESSION['name'] ?? '');
    $mine = array_values(array_filter($all['orders'], function($o) use ($email, $name) {
      if ($email && isset($o['email']) && strtolower((string)$o['email']) === $email) return true;
      if (!$email && $name && isset($o['name']) && (string)$o['name'] === $name) return true;
      return false;
    }));
    json_ok(['ok' => true, 'orders' => $mine]);
  }
  if ($action === 'find') {
    // admin only
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
      json_error('Forbidden', 403);
    }
    $code = trim((string)($_GET['code'] ?? ''));
    $token = trim((string)($_GET['token'] ?? ''));
    if ($code === '' && $token === '') json_error('code or token required', 400);
    $all = orders_read_all($dataFile);
    foreach ($all['orders'] as $o) {
      if ($code !== '' && isset($o['ticket_code']) && (string)$o['ticket_code'] === $code) {
        json_ok(['ok' => true, 'order' => $o]);
      }
      if ($token !== '' && isset($o['qr_token']) && (string)$o['qr_token'] === $token) {
        json_ok(['ok' => true, 'order' => $o]);
      }
    }
    json_error('Not found', 404);
  }

  if ($action === 'repair') {
    // admin only
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
      json_error('Forbidden', 403);
    }
    $all = orders_read_all($dataFile);
    $filled = 0;
    $sessName = (string)($_SESSION['name'] ?? 'Unbekannt');
    $sessEmail = (string)($_SESSION['email'] ?? '');
    foreach ($all['orders'] as &$o) {
      $changed = false;
      if (empty($o['name'])) { $o['name'] = $sessName ?: 'Unbekannt'; $changed = true; }
      if (empty($o['email'])) { $o['email'] = $sessEmail ?: ''; $changed = true; }
      if ($changed) { $o['updated_at'] = date('c'); $filled++; }
    }
    if (!orders_write_all($dataFile, $all)) json_error('Failed to repair orders', 500);
    json_ok(['ok' => true, 'repaired' => $filled]);
  }
  // admin list
  if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
    json_error('Forbidden', 403);
  }
  $all = orders_read_all($dataFile);
  json_ok(['ok' => true, 'orders' => $all['orders']]);
}

if ($method === 'POST') {
  $action = $_GET['action'] ?? ($_POST['action'] ?? '');
  if ($action === 'create') {
    // require login
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) {
      json_error('Unauthorized', 401);
    }
    // Public create: ticket_id, title, date, payment ('onsite'|'external'), href(optional), snapshot fields
    $raw = file_get_contents('php://input') ?: '';
    $body = [];
    if ($raw !== '') {
      $json = json_decode($raw, true);
      if (is_array($json)) $body = $json;
    }
    if (!is_array($body)) $body = [];

    $ticket_id = trim((string)($body['ticket_id'] ?? ''));
    $title = trim((string)($body['title'] ?? ''));
    $date = trim((string)($body['date'] ?? ''));
    $payment = trim((string)($body['payment'] ?? ''));
    $href = isset($body['href']) ? (string)$body['href'] : '';
    $buyer_name = trim((string)($body['name'] ?? ''));
    $buyer_email = strtolower(trim((string)($body['email'] ?? '')));
    // default from session if not provided
    if ($buyer_name === '' && isset($_SESSION['name'])) $buyer_name = (string)$_SESSION['name'];
    if ($buyer_email === '' && isset($_SESSION['email'])) $buyer_email = strtolower((string)$_SESSION['email']);

    if ($ticket_id === '' || $date === '') {
      json_error('ticket_id and date required', 400);
    }

    $all = orders_read_all($dataFile);

    $id = bin2hex(random_bytes(8));
    // Generate a human-friendly ticket code and a secret QR token
    $codeRaw = strtoupper(bin2hex(random_bytes(4))); // 8 hex chars
    $prefix = ($payment === 'onsite') ? 'BAR' : 'OL';
    $ticket_code = $prefix . '-' . substr($codeRaw, 0, 4) . '-' . substr($codeRaw, 4, 4);
    $qr_token = bin2hex(random_bytes(16));
    $order = [
      'id' => $id,
      'ticket_id' => $ticket_id,
      'title' => $title,
      'date' => $date,
      'payment' => ($payment === 'onsite' ? 'onsite' : 'external'),
      'href' => $href,
      'name' => $buyer_name,
      'email' => $buyer_email,
      'status' => ($payment === 'onsite' ? 'reserved' : 'redirected'), // reserved = vor Ort zahlen, redirected = zu extern geleitet
      'ticket_code' => $ticket_code,
      'qr_token' => $qr_token,
      'created_at' => date('c'),
      'updated_at' => date('c'),
    ];

    $all['orders'][] = $order;
    if (!orders_write_all($dataFile, $all)) {
      json_error('Failed to create order', 500);
    }

    json_ok(['ok' => true, 'order' => $order]);
  }

  if ($action === 'update') {
    // admin only
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || (($_SESSION['role'] ?? 'user') !== 'admin')) {
      json_error('Forbidden', 403);
    }

    $raw = file_get_contents('php://input') ?: '';
    $body = [];
    if ($raw !== '') {
      $json = json_decode($raw, true);
      if (is_array($json)) $body = $json;
    }
    if (!is_array($body)) $body = [];

    $id = trim((string)($body['id'] ?? ''));
    $status = trim((string)($body['status'] ?? ''));

    if ($id === '' || $status === '') {
      json_error('id and status required', 400);
    }

    $all = orders_read_all($dataFile);
    $found = false;
    foreach ($all['orders'] as &$o) {
      if (($o['id'] ?? '') === $id) {
        $o['status'] = $status; // e.g., reserved, confirmed, paid, cancelled
        $o['updated_at'] = date('c');
        $found = true;
        break;
      }
    }

    if (!$found) json_error('Order not found', 404);
    if (!orders_write_all($dataFile, $all)) json_error('Failed to update order', 500);

    json_ok(['ok' => true]);
  }

  json_error('Bad Request', 400);
}

json_error('Method Not Allowed', 405);
