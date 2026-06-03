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

$isAuto = $lang === 'auto';
$verified = array_values(array_filter($subs, function($s) use ($lang, $isAuto) {
  if (($s['status'] ?? '') !== 'verified') return false;
  if ($isAuto) return true;
  return ($s['lang'] ?? 'de') === $lang;
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

// Determine frontend URL: prefer FRONTEND_URL, then BASE_URL, then Referer
$baseUrl = rtrim($_ENV['FRONTEND_URL'] ?? '', '/');
if (!$baseUrl) {
  $baseUrl = rtrim($_ENV['BASE_URL'] ?? '', '/');
}
if ($baseUrl && str_contains($baseUrl, '://api.')) {
  $baseUrl = preg_replace('#^(https?://)api\.#', '$1', $baseUrl);
}
if (!$baseUrl) {
  $ref = $_SERVER['HTTP_REFERER'] ?? '';
  if ($ref) {
    $parts = parse_url($ref);
    $baseUrl = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
  }
}
$fromEmail = $_ENV['NEWSLETTER_FROM'] ?? '';
$subject = $found['subject_' . $lang] ?? '';
$htmlContent = $found['html_' . $lang] ?? '';

// Inline CSS conversion for email safety
// Dynamically parses Tailwind classes and converts to inline styles
function twColor(string $name, string $shade): string {
  $palette = [
    'slate' => ['50'=>'#f8fafc','100'=>'#f1f5f9','200'=>'#e2e8f0','300'=>'#cbd5e1','400'=>'#94a3b8','500'=>'#64748b','600'=>'#475569','700'=>'#334155','800'=>'#1e293b','900'=>'#0f172a','950'=>'#020617'],
    'gray' => ['50'=>'#f9fafb','100'=>'#f3f4f6','200'=>'#e5e7eb','300'=>'#d1d5db','400'=>'#9ca3af','500'=>'#6b7280','600'=>'#4b5563','700'=>'#374151','800'=>'#1f2937','900'=>'#111827','950'=>'#030712'],
    'zinc' => ['50'=>'#fafafa','100'=>'#f4f4f5','200'=>'#e4e4e7','300'=>'#d4d4d8','400'=>'#a1a1aa','500'=>'#71717a','600'=>'#52525b','700'=>'#3f3f46','800'=>'#27272a','900'=>'#18181b','950'=>'#09090b'],
    'neutral' => ['50'=>'#fafafa','100'=>'#f5f5f5','200'=>'#e5e5e5','300'=>'#d4d4d4','400'=>'#a3a3a3','500'=>'#737373','600'=>'#525252','700'=>'#404040','800'=>'#262626','900'=>'#171717','950'=>'#0a0a0a'],
    'stone' => ['50'=>'#fafaf9','100'=>'#f5f5f4','200'=>'#e7e5e4','300'=>'#d6d3d1','400'=>'#a8a29e','500'=>'#78716c','600'=>'#57534e','700'=>'#44403c','800'=>'#292524','900'=>'#1c1917','950'=>'#0c0a09'],
    'red' => ['50'=>'#fef2f2','100'=>'#fee2e2','200'=>'#fecaca','300'=>'#fca5a5','400'=>'#f87171','500'=>'#ef4444','600'=>'#dc2626','700'=>'#b91c1c','800'=>'#991b1b','900'=>'#7f1d1d','950'=>'#450a0a'],
    'orange' => ['50'=>'#fff7ed','100'=>'#ffedd5','200'=>'#fed7aa','300'=>'#fdba74','400'=>'#fb923c','500'=>'#f97316','600'=>'#ea580c','700'=>'#c2410c','800'=>'#9a3412','900'=>'#7c2d12','950'=>'#431407'],
    'amber' => ['50'=>'#fffbeb','100'=>'#fef3c7','200'=>'#fde68a','300'=>'#fcd34d','400'=>'#fbbf24','500'=>'#f59e0b','600'=>'#d97706','700'=>'#b45309','800'=>'#92400e','900'=>'#78350f','950'=>'#451a03'],
    'yellow' => ['50'=>'#fefce8','100'=>'#fef9c3','200'=>'#fef08a','300'=>'#fde047','400'=>'#facc15','500'=>'#eab308','600'=>'#ca8a04','700'=>'#a16207','800'=>'#854d0e','900'=>'#713f12','950'=>'#422006'],
    'lime' => ['50'=>'#f7fee7','100'=>'#ecfccb','200'=>'#d9f99d','300'=>'#bef264','400'=>'#a3e635','500'=>'#84cc16','600'=>'#65a30d','700'=>'#4d7c0f','800'=>'#3f6212','900'=>'#365314','950'=>'#1a2e05'],
    'green' => ['50'=>'#f0fdf4','100'=>'#dcfce7','200'=>'#bbf7d0','300'=>'#86efac','400'=>'#4ade80','500'=>'#22c55e','600'=>'#16a34a','700'=>'#15803d','800'=>'#166534','900'=>'#14532d','950'=>'#052e16'],
    'emerald' => ['50'=>'#ecfdf5','100'=>'#d1fae5','200'=>'#a7f3d0','300'=>'#6ee7b7','400'=>'#34d399','500'=>'#10b981','600'=>'#059669','700'=>'#047857','800'=>'#065f46','900'=>'#064e3b','950'=>'#022c22'],
    'teal' => ['50'=>'#f0fdfa','100'=>'#ccfbf1','200'=>'#99f6e4','300'=>'#5eead4','400'=>'#2dd4bf','500'=>'#14b8a6','600'=>'#0d9488','700'=>'#0f766e','800'=>'#115e59','900'=>'#134e4a','950'=>'#042f2e'],
    'cyan' => ['50'=>'#ecfeff','100'=>'#cffafe','200'=>'#a5f3fc','300'=>'#67e8f9','400'=>'#22d3ee','500'=>'#06b6d4','600'=>'#0891b2','700'=>'#0e7490','800'=>'#155e75','900'=>'#164e63','950'=>'#083344'],
    'sky' => ['50'=>'#f0f9ff','100'=>'#e0f2fe','200'=>'#bae6fd','300'=>'#7dd3fc','400'=>'#38bdf8','500'=>'#0ea5e9','600'=>'#0284c7','700'=>'#0369a1','800'=>'#075985','900'=>'#0c4a6e','950'=>'#082f49'],
    'blue' => ['50'=>'#eff6ff','100'=>'#dbeafe','200'=>'#bfdbfe','300'=>'#93c5fd','400'=>'#60a5fa','500'=>'#3b82f6','600'=>'#2563eb','700'=>'#1d4ed8','800'=>'#1e40af','900'=>'#1e3a8a','950'=>'#172554'],
    'indigo' => ['50'=>'#eef2ff','100'=>'#e0e7ff','200'=>'#c7d2fe','300'=>'#a5b4fc','400'=>'#818cf8','500'=>'#6366f1','600'=>'#4f46e5','700'=>'#4338ca','800'=>'#3730a3','900'=>'#312e81','950'=>'#1e1b4b'],
    'violet' => ['50'=>'#f5f3ff','100'=>'#ede9fe','200'=>'#ddd6fe','300'=>'#c4b5fd','400'=>'#a78bfa','500'=>'#8b5cf6','600'=>'#7c3aed','700'=>'#6d28d9','800'=>'#5b21b6','900'=>'#4c1d95','950'=>'#2e1065'],
    'purple' => ['50'=>'#faf5ff','100'=>'#f3e8ff','200'=>'#e9d5ff','300'=>'#d8b4fe','400'=>'#c084fc','500'=>'#a855f7','600'=>'#9333ea','700'=>'#7e22ce','800'=>'#6b21a8','900'=>'#581c87','950'=>'#3b0764'],
    'fuchsia' => ['50'=>'#fdf4ff','100'=>'#fae8ff','200'=>'#f5d0fe','300'=>'#f0abfc','400'=>'#e879f9','500'=>'#d946ef','600'=>'#c026d3','700'=>'#a21caf','800'=>'#86198f','900'=>'#701a75','950'=>'#4a044e'],
    'pink' => ['50'=>'#fdf2f8','100'=>'#fce7f3','200'=>'#fbcfe8','300'=>'#f9a8d4','400'=>'#f472b6','500'=>'#ec4899','600'=>'#db2777','700'=>'#be185d','800'=>'#9d174d','900'=>'#831843','950'=>'#500724'],
    'rose' => ['50'=>'#fff1f2','100'=>'#ffe4e6','200'=>'#fecdd3','300'=>'#fda4af','400'=>'#fb7185','500'=>'#f43f5e','600'=>'#e11d48','700'=>'#be123c','800'=>'#9f1239','900'=>'#881337','950'=>'#4c0519'],
    'black' => ['DEFAULT'=>'#000000'],
    'white' => ['DEFAULT'=>'#ffffff'],
    'transparent' => ['DEFAULT'=>'transparent'],
    'current' => ['DEFAULT'=>'currentColor'],
  ];
  return $palette[$name][$shade] ?? '';
}

function twSpacing(string $val): string {
  $map = ['0'=>'0px','px'=>'1px','0.5'=>'2px','1'=>'4px','1.5'=>'6px','2'=>'8px','2.5'=>'10px','3'=>'12px','3.5'=>'14px','4'=>'16px','5'=>'20px','6'=>'24px','7'=>'28px','8'=>'32px','9'=>'36px','10'=>'40px','11'=>'44px','12'=>'48px','14'=>'56px','16'=>'64px','20'=>'80px','24'=>'96px','28'=>'112px','32'=>'128px','36'=>'144px','40'=>'160px','44'=>'176px','48'=>'192px','52'=>'208px','56'=>'224px','60'=>'240px','64'=>'256px','72'=>'288px','80'=>'320px','96'=>'384px'];
  return $map[$val] ?? (is_numeric($val) ? ($val * 4) . 'px' : $val);
}

function twFontSize(string $val): string {
  $map = ['xs'=>'12px','sm'=>'14px','base'=>'16px','lg'=>'18px','xl'=>'20px','2xl'=>'24px','3xl'=>'30px','4xl'=>'36px','5xl'=>'48px','6xl'=>'60px','7xl'=>'72px','8xl'=>'96px','9xl'=>'128px'];
  return $map[$val] ?? $val;
}

function twBorderRadius(string $val): string {
  $map = ['none'=>'0px','sm'=>'2px','DEFAULT'=>'4px','md'=>'6px','lg'=>'8px','xl'=>'12px','2xl'=>'16px','3xl'=>'24px','full'=>'9999px'];
  return $map[$val] ?? twSpacing($val);
}

function parseTailwindClass(string $c): string {
  $styles = [];

  // text color: text-{color}-{shade} or text-{color}
  if (preg_match('/^text-([a-z]+)-(\d+)$/', $c, $m)) {
    $v = twColor($m[1], $m[2]); if ($v) $styles[] = "color:$v";
  } elseif (preg_match('/^text-(black|white|transparent|current)$/', $c, $m)) {
    $map = ['black'=>'#000000','white'=>'#ffffff','transparent'=>'transparent','current'=>'currentColor'];
    $styles[] = 'color:' . $map[$m[1]];
  }

  // bg color
  if (preg_match('/^bg-([a-z]+)-(\d+)$/', $c, $m)) {
    $v = twColor($m[1], $m[2]); if ($v) $styles[] = "background-color:$v";
  } elseif (preg_match('/^bg-(black|white|transparent|current)$/', $c, $m)) {
    $map = ['black'=>'#000000','white'=>'#ffffff','transparent'=>'transparent','current'=>'currentColor'];
    $styles[] = 'background-color:' . $map[$m[1]];
  }

  // border color
  if (preg_match('/^border-([a-z]+)-(\d+)$/', $c, $m)) {
    $v = twColor($m[1], $m[2]); if ($v) $styles[] = "border-color:$v";
  }

  // text size
  if (preg_match('/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/', $c, $m)) {
    $styles[] = 'font-size:' . twFontSize($m[1]);
  }

  // font weight
  if (preg_match('/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/', $c, $m)) {
    $map = ['thin'=>'100','extralight'=>'200','light'=>'300','normal'=>'400','medium'=>'500','semibold'=>'600','bold'=>'700','extrabold'=>'800','black'=>'900'];
    $styles[] = 'font-weight:' . $map[$m[1]];
  }

  // text alignment
  if (preg_match('/^text-(left|center|right|justify|start|end)$/', $c, $m)) {
    $styles[] = 'text-align:' . $m[1];
  }

  // padding
  if (preg_match('/^p-(.+)$/', $c, $m)) {
    $styles[] = 'padding:' . twSpacing($m[1]);
  } elseif (preg_match('/^px-(.+)$/', $c, $m)) {
    $styles[] = 'padding-left:' . twSpacing($m[1]) . ';padding-right:' . twSpacing($m[1]);
  } elseif (preg_match('/^py-(.+)$/', $c, $m)) {
    $styles[] = 'padding-top:' . twSpacing($m[1]) . ';padding-bottom:' . twSpacing($m[1]);
  } elseif (preg_match('/^pt-(.+)$/', $c, $m)) {
    $styles[] = 'padding-top:' . twSpacing($m[1]);
  } elseif (preg_match('/^pb-(.+)$/', $c, $m)) {
    $styles[] = 'padding-bottom:' . twSpacing($m[1]);
  } elseif (preg_match('/^pl-(.+)$/', $c, $m)) {
    $styles[] = 'padding-left:' . twSpacing($m[1]);
  } elseif (preg_match('/^pr-(.+)$/', $c, $m)) {
    $styles[] = 'padding-right:' . twSpacing($m[1]);
  }

  // margin
  if (preg_match('/^m-(.+)$/', $c, $m)) {
    $styles[] = 'margin:' . twSpacing($m[1]);
  } elseif (preg_match('/^mx-(.+)$/', $c, $m)) {
    $styles[] = 'margin-left:' . twSpacing($m[1]) . ';margin-right:' . twSpacing($m[1]);
  } elseif (preg_match('/^my-(.+)$/', $c, $m)) {
    $styles[] = 'margin-top:' . twSpacing($m[1]) . ';margin-bottom:' . twSpacing($m[1]);
  } elseif (preg_match('/^mt-(.+)$/', $c, $m)) {
    $styles[] = 'margin-top:' . twSpacing($m[1]);
  } elseif (preg_match('/^mb-(.+)$/', $c, $m)) {
    $styles[] = 'margin-bottom:' . twSpacing($m[1]);
  } elseif (preg_match('/^ml-(.+)$/', $c, $m)) {
    $styles[] = 'margin-left:' . twSpacing($m[1]);
  } elseif (preg_match('/^mr-(.+)$/', $c, $m)) {
    $styles[] = 'margin-right:' . twSpacing($m[1]);
  }

  // border radius
  if (preg_match('/^rounded-(.+)$/', $c, $m)) {
    $styles[] = 'border-radius:' . twBorderRadius($m[1]);
  } elseif ($c === 'rounded') {
    $styles[] = 'border-radius:4px';
  }

  // border width
  if (preg_match('/^border-(\d+)$/', $c, $m)) {
    $styles[] = 'border-width:' . $m[1] . 'px';
  } elseif ($c === 'border') {
    $styles[] = 'border-width:1px';
  }

  // border style
  if (preg_match('/^border-(solid|dashed|dotted|double|none)$/', $c, $m)) {
    $styles[] = 'border-style:' . $m[1];
  }

  // display
  if (preg_match('/^(block|inline|inline-block|flex|inline-flex|grid|table|table-cell|table-row|contents|list-item)$/', $c, $m)) {
    $styles[] = 'display:' . $m[1];
  } elseif ($c === 'hidden') {
    $styles[] = 'display:none';
  }

  // width / height
  if (preg_match('/^w-(.+)$/', $c, $m)) {
    $v = $m[1]; if ($v === 'full') $v = '100%'; elseif ($v === 'screen') $v = '100vw'; elseif ($v === 'auto') $v = 'auto'; elseif ($v === 'min') $v = 'min-content'; elseif ($v === 'max') $v = 'max-content'; elseif ($v === 'fit') $v = 'fit-content'; elseif (is_numeric($v)) $v = ($v * 4) . 'px'; elseif (preg_match('/^\d+\/\d+$/', $v)) $v = (eval('return ' . str_replace('/', '/', $v) . ';') * 100) . '%'; else $v = twSpacing($v);
    $styles[] = 'width:' . $v;
  }
  if (preg_match('/^h-(.+)$/', $c, $m)) {
    $v = $m[1]; if ($v === 'full') $v = '100%'; elseif ($v === 'screen') $v = '100vh'; elseif ($v === 'auto') $v = 'auto'; elseif ($v === 'min') $v = 'min-content'; elseif ($v === 'max') $v = 'max-content'; elseif ($v === 'fit') $v = 'fit-content'; elseif (is_numeric($v)) $v = ($v * 4) . 'px'; else $v = twSpacing($v);
    $styles[] = 'height:' . $v;
  }

  // min/max width/height
  if (preg_match('/^min-w-(.+)$/', $c, $m)) {
    $v = $m[1]; if ($v === 'full') $v = '100%'; elseif ($v === 'min') $v = 'min-content'; elseif ($v === 'max') $v = 'max-content'; elseif ($v === 'fit') $v = 'fit-content'; elseif (is_numeric($v)) $v = ($v * 4) . 'px'; else $v = twSpacing($v);
    $styles[] = 'min-width:' . $v;
  }
  if (preg_match('/^max-w-(.+)$/', $c, $m)) {
    $v = $m[1]; if ($v === 'full') $v = '100%'; elseif ($v === 'screen') $v = '100vw'; elseif ($v === 'min') $v = 'min-content'; elseif ($v === 'max') $v = 'max-content'; elseif ($v === 'fit') $v = 'fit-content'; elseif ($v === 'none') $v = 'none'; elseif (is_numeric($v)) $v = ($v * 4) . 'px'; else $v = twSpacing($v);
    $styles[] = 'max-width:' . $v;
  }

  // text decoration
  if ($c === 'underline') $styles[] = 'text-decoration:underline';
  if ($c === 'line-through') $styles[] = 'text-decoration:line-through';
  if ($c === 'no-underline') $styles[] = 'text-decoration:none';

  // text transform
  if ($c === 'uppercase') $styles[] = 'text-transform:uppercase';
  if ($c === 'lowercase') $styles[] = 'text-transform:lowercase';
  if ($c === 'capitalize') $styles[] = 'text-transform:capitalize';
  if ($c === 'normal-case') $styles[] = 'text-transform:none';

  // font style
  if ($c === 'italic') $styles[] = 'font-style:italic';
  if ($c === 'not-italic') $styles[] = 'font-style:normal';

  // list style
  if ($c === 'list-disc') $styles[] = 'list-style-type:disc';
  if ($c === 'list-decimal') $styles[] = 'list-style-type:decimal';
  if ($c === 'list-none') $styles[] = 'list-style-type:none';

  // overflow
  if (preg_match('/^overflow-(hidden|visible|scroll|auto|clip)$/', $c, $m)) {
    $styles[] = 'overflow:' . $m[1];
  }

  // opacity
  if (preg_match('/^opacity-(\d+)$/', $c, $m)) {
    $styles[] = 'opacity:' . ($m[1] / 100);
  }

  // gap
  if (preg_match('/^gap-(.+)$/', $c, $m)) {
    $styles[] = 'gap:' . twSpacing($m[1]);
  }

  // whitespace
  if (preg_match('/^whitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)$/', $c, $m)) {
    $map = ['normal'=>'normal','nowrap'=>'nowrap','pre'=>'pre','pre-line'=>'pre-line','pre-wrap'=>'pre-wrap','break-spaces'=>'break-spaces'];
    $styles[] = 'white-space:' . $map[$m[1]];
  }

  // word break
  if ($c === 'break-words') $styles[] = 'overflow-wrap:break-word';
  if ($c === 'break-all') $styles[] = 'word-break:break-all';

  // cursor
  if (preg_match('/^cursor-(auto|default|pointer|wait|text|move|help|not-allowed)$/', $c, $m)) {
    $styles[] = 'cursor:' . $m[1];
  }

  // pointer events
  if ($c === 'pointer-events-none') $styles[] = 'pointer-events:none';
  if ($c === 'pointer-events-auto') $styles[] = 'pointer-events:auto';

  // position
  if (preg_match('/^(static|relative|absolute|fixed|sticky)$/', $c, $m)) {
    $styles[] = 'position:' . $m[1];
  }

  // inset
  if (preg_match('/^inset-(.+)$/', $c, $m)) {
    $v = twSpacing($m[1]); $styles[] = "top:$v;right:$v;bottom:$v;left:$v";
  }

  // z-index
  if (preg_match('/^z-(\d+|auto)$/', $c, $m)) {
    $styles[] = 'z-index:' . $m[1];
  }

  // object fit
  if (preg_match('/^object-(contain|cover|fill|none|scale-down)$/', $c, $m)) {
    $styles[] = 'object-fit:' . $m[1];
  }

  // flex shorthand
  if (preg_match('/^flex-(.+)$/', $c, $m)) {
    if ($m[1] === '1') $styles[] = 'flex:1 1 0%';
    elseif ($m[1] === 'auto') $styles[] = 'flex:1 1 auto';
    elseif ($m[1] === 'initial') $styles[] = 'flex:0 1 auto';
    elseif ($m[1] === 'none') $styles[] = 'flex:none';
  }

  return implode(';', $styles);
}

function tailwindToInline(string $html): string {
  $html = preg_replace_callback('/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/', function($m) {
    $tag = $m[1];
    $attrs = $m[2];
    if (!preg_match('/\bclass=["\']([^"\']*)["\']/', $attrs, $cm)) {
      return $m[0];
    }
    $classes = preg_split('/\s+/', trim($cm[1]));
    $styles = [];
    $keptClasses = [];
    foreach ($classes as $c) {
      $s = parseTailwindClass($c);
      if ($s) {
        $styles[] = $s;
      } else {
        $keptClasses[] = $c;
      }
    }
    $existingStyle = '';
    if (preg_match('/\bstyle=["\']([^"\']*)["\']/', $attrs, $sm)) {
      $existingStyle = rtrim($sm[1], ';') . ';';
    }
    $newStyle = $existingStyle . implode(';', $styles);
    if ($newStyle) $newStyle = rtrim($newStyle, ';') . ';';
    $newAttrs = preg_replace('/\bclass=["\'][^"\']*["\']\s*/', '', $attrs);
    $newAttrs = preg_replace('/\bstyle=["\'][^"\']*["\']\s*/', '', $newAttrs);
    $newAttrs = trim($newAttrs);
    $result = '<' . $tag;
    if ($newAttrs) $result .= ' ' . $newAttrs;
    if ($keptClasses) $result .= ' class="' . implode(' ', $keptClasses) . '"';
    if ($newStyle) $result .= ' style="' . $newStyle . '"';
    $result .= '>';
    return $result;
  }, $html);
  return $html;
}

$cleanHtml = tailwindToInline($htmlContent);

$recipients = 0;
$headersBase = "MIME-Version: 1.0\r\nContent-type: text/html; charset=utf-8\r\n";
if ($fromEmail) {
  $headersBase .= "From: HUMAN BEING <{$fromEmail}>\r\nReply-To: {$fromEmail}\r\n";
}

foreach ($verified as $sub) {
  $email = $sub['email'] ?? '';
  if (!$email) continue;

  // Per-subscriber language selection in auto mode
  $subLang = $isAuto ? ($sub['lang'] ?? 'de') : $lang;
  $subSubject = $found['subject_' . $subLang] ?? $found['subject_de'] ?? $found['subject_en'] ?? '';
  $subHtmlRaw = $found['html_' . $subLang] ?? $found['html_de'] ?? $found['html_en'] ?? '';
  $subHtml = tailwindToInline($subHtmlRaw);

  $token = $sub['token'] ?? '';
  $unsubUrl = $baseUrl . '/?newsletter_unsubscribe=' . urlencode($token);

  $emailHtml = <<<HTML
<!DOCTYPE html>
<html lang="{$subLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$subSubject}</title>
<style>
  body { margin:0; padding:0; background-color:#0a0a0a; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  .wrapper { width:100%; background-color:#0a0a0a; padding:40px 0; }
  .container { width:600px; max-width:100%; margin:0 auto; background-color:#111111; border-radius:12px; overflow:hidden; border:1px solid #262626; }
  .header { background:linear-gradient(135deg,#8C1423 0%,#a0182a 100%); padding:40px 32px; text-align:center; }
  .header h1 { color:#ffffff; font-size:24px; font-weight:800; letter-spacing:3px; text-transform:uppercase; margin:0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .header .tagline { color:rgba(255,255,255,0.7); font-size:13px; margin-top:8px; letter-spacing:1px; }
  .content { padding:40px 32px; color:#e5e5e5; font-size:16px; line-height:1.7; }
  .content p { margin:0 0 16px 0; }
  .content h1, .content h2, .content h3 { color:#ffffff; margin:24px 0 12px 0; line-height:1.3; }
  .content h1 { font-size:28px; font-weight:800; }
  .content h2 { font-size:22px; font-weight:700; }
  .content h3 { font-size:18px; font-weight:600; }
  .content a { color:#f43f5e; text-decoration:none; }
  .content a:hover { text-decoration:underline; }
  .content img { max-width:100%; height:auto; border-radius:8px; display:block; }
  .content blockquote { border-left:3px solid #8C1423; padding-left:16px; margin:16px 0; color:#a3a3a3; font-style:italic; }
  .content ul, .content ol { margin:0 0 16px 0; padding-left:24px; }
  .content li { margin-bottom:8px; }
  .footer { background-color:#0f0f0f; padding:32px; text-align:center; border-top:1px solid #262626; }
  .footer .divider { width:40px; height:2px; background-color:#8C1423; margin:0 auto 20px auto; border-radius:1px; }
  .footer p { color:#737373; font-size:13px; margin:0 0 12px 0; line-height:1.5; }
  .footer a { color:#a3a3a3; text-decoration:underline; font-size:12px; }
  .footer a:hover { color:#ffffff; }
  .footer .social { margin-top:16px; }
  .footer .social a { display:inline-block; margin:0 8px; color:#737373; text-decoration:none; font-size:12px; }
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
        {$subHtml}
      </div>
      <div class="footer">
        <div class="divider"></div>
        <p>Du erhältst diesen Newsletter, weil du dich auf human-being-band.de angemeldet hast.</p>
        <p><a href="{$unsubUrl}">Newsletter abbestellen</a></p>
      </div>
    </div>
  </div>
</body>
</html>
HTML;

  if (function_exists('mail')) {
    mail($email, $subSubject, $emailHtml, $headersBase);
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
