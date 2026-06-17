<?php
require_once __DIR__ . '/bootstrap.php';

// Comments endpoint
// Public:
//   POST?action=submit { author?: string, text: string, rating?: number(1-5) }
//   GET?action=public -> { approved: [] }
// Admin-only:
//   GET?action=list -> { pending: [], approved: [] }
//   POST?action=approve { id }
//   POST?action=delete { id }

$commentsFile = $DATA_DIR . '/comments.json';
$comments = json_read_file($commentsFile);
if (!is_array($comments)) {
  $comments = [ 'pending' => [], 'approved' => [] ];
}
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');

function comments_save($file, $data) {
  if (!json_write_file($file, $data)) json_error('Failed to save comments', 500);
}

// Public submit
if ($method === 'POST' && $action === 'submit') {
  $body = [];
  $raw = file_get_contents('php://input') ?: '';
  if ($raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) $body = $json;
  }
  if (empty($body)) { $body = $_POST; }

  $text = trim((string)($body['text'] ?? ''));
  $author = trim((string)($body['author'] ?? ''));
  $rating = isset($body['rating']) ? (int)$body['rating'] : null;
  if ($rating !== null) {
    if ($rating < 1) $rating = 1; if ($rating > 5) $rating = 5;
  }
  if ($text === '') json_error('Missing text', 400);

  $entry = [
    'id' => bin2hex(random_bytes(8)),
    'author' => $author !== '' ? $author : null,
    'text' => $text,
    'rating' => $rating,
    'created_at' => date('c'),
  ];
  $pending = $comments['pending'] ?? [];
  array_unshift($pending, $entry);
  $comments['pending'] = $pending;
  comments_save($commentsFile, $comments);
  json_ok(['ok' => true]);
}

// Public read (approved only)
if ($method === 'GET' && $action === 'public') {
  $approved = $comments['approved'] ?? [];
  json_ok(['ok' => true, 'approved' => $approved]);
}

// Admin-only actions below
if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true || ($_SESSION['role'] ?? 'user') !== 'admin') {
  json_error('Forbidden', 403);
}

if ($method === 'GET' && $action === 'list') {
  json_ok(['ok' => true, 'pending' => $comments['pending'] ?? [], 'approved' => $comments['approved'] ?? []]);
}

// Read body
$body = [];
$raw = file_get_contents('php://input') ?: '';
if ($raw !== '') {
  $json = json_decode($raw, true);
  if (is_array($json)) $body = $json;
}
if (empty($body)) { $body = $_POST; }

if ($method === 'POST' && $action === 'approve') {
  $id = (string)($body['id'] ?? '');
  if ($id === '') json_error('Missing id', 400);
  $moved = null;
  $pending = array_values(array_filter($comments['pending'] ?? [], function($c) use ($id, &$moved) {
    if (($c['id'] ?? '') === $id) { $moved = $c; return false; }
    return true;
  }));
  if (!$moved) json_error('Not found', 404);
  $moved['approved_at'] = date('c');
  $comments['pending'] = $pending;
  $comments['approved'] = array_values(array_merge([ $moved ], $comments['approved'] ?? []));
  comments_save($commentsFile, $comments);
  json_ok(['ok' => true]);
}

if ($method === 'POST' && $action === 'delete') {
  $id = (string)($body['id'] ?? '');
  if ($id === '') json_error('Missing id', 400);
  $beforeP = count($comments['pending'] ?? []);
  $beforeA = count($comments['approved'] ?? []);
  $comments['pending'] = array_values(array_filter($comments['pending'] ?? [], fn($c) => ($c['id'] ?? '') !== $id));
  $comments['approved'] = array_values(array_filter($comments['approved'] ?? [], fn($c) => ($c['id'] ?? '') !== $id));
  if ($beforeP === count($comments['pending']) && $beforeA === count($comments['approved'])) json_error('Not found', 404);
  comments_save($commentsFile, $comments);
  json_ok(['ok' => true]);
}

json_error('Not Found', 404);
