// Simple API helper for PHP backend
// Uses VITE_API_BASE or defaults to '/server/api'

export const API_BASE = import.meta.env.VITE_API_BASE || '/server/api';

async function parseResponse<T>(res: Response, method: string, path: string): Promise<T> {
  // No content
  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  if (isJson) {
    try {
      return (await res.json()) as T;
    } catch (e) {
      const text = await res.text().catch(() => '');
      if (!res.ok) throw new Error(text || `${method} ${path} failed with ${res.status}`);
      throw new Error(`Invalid JSON response from ${path}`);
    }
  } else {
    const text = await res.text().catch(() => '');
    if (!res.ok) throw new Error(text || `${method} ${path} failed with ${res.status}`);
    // Successful non-JSON; return as any string
    return text as unknown as T;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });
  return parseResponse<T>(res, 'GET', path);
}

export async function apiPost<T>(path: string, body: any, headers: Record<string, string> = {}): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: isForm ? headers : { 'Content-Type': 'application/json', ...headers },
    body: isForm ? body : JSON.stringify(body),
  });
  return parseResponse<T>(res, 'POST', path);
}

export async function login(username: string, password: string) {
  return apiPost<{ ok?: boolean; require_totp?: boolean; role?: string }>(`/login.php`, { username, password });
}

export async function logout(): Promise<{ ok: boolean }> {
  try {
    const res = await apiPost<{ ok: boolean }>(`/logout.php`, {});
    if (res && typeof res.ok === 'boolean') return res;
  } catch (_) {
    // ignore and try GET
  }
  // Fallback: some hosts block POST; attempt GET
  try {
    const res = await apiGet<{ ok: boolean }>(`/logout.php`);
    if (res && typeof res.ok === 'boolean') return res;
  } catch (_) {}
  return { ok: false };
}

export async function register(name: string, email: string, password: string) {
  return apiPost<{ ok: boolean; user?: { id: string; name: string; email: string; role: string } }>(`/register.php`, { name, email, password });
}

export async function me() {
  return apiGet<{ authenticated: boolean }>(`/me.php`);
}

// Manifest and CRUD helpers
export type Manifest = {
  version: number;
  sounds: Array<any>;
  schedules: Array<any>;
  categories?: Array<any>;
};

export async function getManifest(): Promise<Manifest> {
  return apiGet<Manifest>(`/manifest.php`);
}

export async function uploadSound(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiPost<{ name: string; url: string; file_path: string; size: number; type: string }>(`/upload.php`, form);
}

export async function soundsInsert(body: any, version?: number) {
  const form = new FormData();
  Object.entries(body || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  return apiPost<{ version: number; sound: any }>(`/sounds.php?action=insert`, form);
}

export async function soundsUpdate(body: any, version?: number) {
  const form = new FormData();
  Object.entries(body || {}).forEach(([k, v]) => {
    if (v !== undefined) {
      form.append(k, v === null ? '' : String(v));
    }
  });
  return apiPost<{ version: number; sound: any }>(`/sounds.php?action=update`, form);
}

export async function soundsDelete(id: string, version?: number) {
  const form = new FormData();
  form.append('id', id);
  return apiPost<{ version: number; ok: true }>(`/sounds.php?action=delete`, form);
}

export async function soundsReorder(orders: Array<{ id: string; display_order: number }>, version?: number) {
  const form = new FormData();
  // Send as JSON string inside form to keep payload simple
  form.append('orders', JSON.stringify(orders));
  return apiPost<{ version: number; ok: true }>(`/sounds.php?action=reorder`, form);
}

export async function schedulesInsert(body: any, version?: number) {
  const form = new FormData();
  Object.entries(body || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  return apiPost<{ version: number; schedule: any }>(`/schedules.php?action=insert`, form);
}

export async function schedulesUpdate(body: any, version?: number) {
  const form = new FormData();
  Object.entries(body || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  return apiPost<{ version: number; schedule: any }>(`/schedules.php?action=update`, form);
}

export async function schedulesDelete(id: string, version?: number) {
  const form = new FormData();
  form.append('id', id);
  return apiPost<{ version: number; ok: true }>(`/schedules.php?action=delete`, form);
}

export async function soundsResync() {
  return apiPost<{ version: number; added: any[]; ok: boolean }>(`/resync.php`, {});
}

// Categories CRUD
export async function categoriesInsert(body: { name: string; display_order?: number; color?: string | null }, version?: number) {
  const form = new FormData();
  form.append('name', body.name);
  if (typeof body.display_order === 'number') form.append('display_order', String(body.display_order));
  if (body.color !== undefined) {
    const v = body.color === null ? '' : String(body.color);
    form.append('color', v);
    form.append('hex', v);
    // Also send RGB numeric components to bypass possible WAF filters
    if (v) {
      const m = v.replace('#','');
      if (m.length === 6) {
        const r = parseInt(m.slice(0,2), 16);
        const g = parseInt(m.slice(2,4), 16);
        const b = parseInt(m.slice(4,6), 16);
        form.append('r', String(r));
        form.append('g', String(g));
        form.append('b', String(b));
      }
    }
  }
  return apiPost<{ version: number; category: any }>(`/categories.php?action=insert`, form);
}

export async function categoriesUpdate(body: { id: string; name?: string; display_order?: number; color?: string | null }, version?: number) {
  const form = new FormData();
  form.append('id', body.id);
  if (typeof body.name === 'string') form.append('name', body.name);
  if (typeof body.display_order === 'number') form.append('display_order', String(body.display_order));
  if (body.color !== undefined) {
    const v = body.color === null ? '' : String(body.color);
    form.append('color', v);
    form.append('hex', v);
  }
  return apiPost<{ version: number; category: any }>(`/categories.php?action=update`, form);
}

export async function categoriesDelete(id: string, version?: number) {
  const form = new FormData();
  form.append('id', id);
  return apiPost<{ version: number; ok: true }>(`/categories.php?action=delete`, form);
}

export async function categoriesGet() {
  return apiGet<{ version: number; categories: Array<any> }>(`/categories.php`);
}

// --- Timeline Presets ---
export type TimelinePreset = {
  id: string;
  name: string;
  segments: Array<{ id: string; title: string; startTime: string; endTime: string }>;
};

export async function presetsList() {
  return apiGet<{ presets: TimelinePreset[] }>(`/presets.php?action=list`);
}

export async function presetsUpsert(preset: TimelinePreset & { soundsBySegment?: Record<string, Array<string | { id: string; time?: string }>> }) {
  const form = new FormData();
  form.append('id', preset.id);
  form.append('name', preset.name);
  form.append('segments', JSON.stringify(preset.segments));
  if (preset.soundsBySegment) {
    form.append('soundsBySegment', JSON.stringify(preset.soundsBySegment));
  }
  return apiPost<{ ok: true; preset: any }>(`/presets.php?action=upsert`, form);
}

export async function presetsDelete(id: string) {
  const form = new FormData();
  form.append('id', id);
  return apiPost<{ ok: true }>(`/presets.php?action=delete`, form);
}

// Timeline state (e.g., mutedSchedules)
export async function timelineGet() {
  return apiGet<{ mutedSchedules: string[]; mutedSegments: string[]; segments?: Array<{ id: string; title: string; startTime: string; endTime: string }>; activePresetId?: string | null; activePresetName?: string | null; soundsBySegment?: Record<string, Array<string | { id: string; time?: string }>> }>(`/timeline.php?action=get`);
}

export async function timelineSave(
  mutedSchedules: string[],
  mutedSegments: string[],
  segments?: Array<{ id: string; title: string; startTime: string; endTime: string }>,
  opts?: { activePresetId?: string; activePresetName?: string; soundsBySegment?: Record<string, Array<string | { id: string; time?: string }>> }
) {
  const form = new FormData();
  form.append('mutedSchedules', JSON.stringify(mutedSchedules));
  form.append('mutedSegments', JSON.stringify(mutedSegments));
  if (segments) {
    form.append('segments', JSON.stringify(segments));
  }
  if (opts?.activePresetId !== undefined) form.append('activePresetId', opts.activePresetId ?? '');
  if (opts?.activePresetName !== undefined) form.append('activePresetName', opts.activePresetName ?? '');
  if (opts?.soundsBySegment) form.append('soundsBySegment', JSON.stringify(opts.soundsBySegment));
  return apiPost<{ ok: true; mutedSchedules: string[]; mutedSegments: string[]; segments?: any; activePresetId?: string | null; activePresetName?: string | null; soundsBySegment?: Record<string, string[]> }>(`/timeline.php?action=save`, form);
}

// --- Remote control (no supabase) ---
export type RemoteCommand = { action: string; soundId?: string | null; ts: number } | null;

export async function remoteGet() {
  return apiGet<{ ok: boolean; command: RemoteCommand }>(`/remote.php?action=get`);
}

export async function remoteSend(action: 'play' | 'pause', soundId?: string) {
  return apiPost<{ ok: boolean; command: RemoteCommand }>(`/remote.php?action=send`, { action, soundId });
}

// --- Users (admin only) ---
export type UserPublic = { id: string; name: string; email: string; role: 'user' | 'admin'; created_at?: string | null };

export async function usersList() {
  return apiGet<{ users: UserPublic[] }>(`/users.php?action=list`);
}

export async function usersSetRole(id: string, role: 'user' | 'admin') {
  return apiPost<{ ok: true }>(`/users.php?action=setRole`, { id, role });
}

// --- Content management (admin only) ---
export type SiteContent = {
  heroUrl?: string;
  heroTitle?: string;
  heroText?: string;
  heroHeight?: number; // in px
  heroFocusX?: number; // 0..100 (%), horizontal focus
  heroFocusY?: number; // 0..100 (%), vertical focus
  heroZoom?: number;   // 100..150 (%)
  // Global background orb image URL
  backgroundUrl?: string;
  // Background image position (percentages)
  backgroundPosX?: number; // 0..100 (%), default 50
  backgroundPosY?: number; // 0..100 (%), default 50
  // Background filter and tint configuration
  backgroundFilter?: {
    brightness?: number; // 0 - 200 (%), default 100
    contrast?: number;   // 0 - 200 (%), default 100
    saturate?: number;   // 0 - 200 (%), default 100
    grayscale?: number;  // 0 - 100 (%)
    sepia?: number;      // 0 - 100 (%)
    blur?: number;       // 0 - 20 (px)
    hue?: number;        // 0 - 360 (deg)
    tintColor?: string;  // hex or rgb(a)
    tintOpacity?: number;// 0 - 1
  };
  contact?: { email?: string; phone?: string; address?: string };
  gallery?: string[];
  // New: direct build URL to display on Home
  buildUrl?: string;
  // New: address string for maps; prefer this over lat/lng
  mapAddress?: string;
  // Keep embedUrl for direct iframe usage (preferred if present)
  map?: { embedUrl?: string; lat?: number; lng?: number };
  // Structured galleries (admin-managed): grouped by year and gallery name
  galleries?: Array<{
    year: number;
    name: string;
    status?: 'public' | 'internal' | 'locked';
    items: Array<{ type: 'image' | 'video' | 'youtube' | 'instagram'; url: string; title?: string }>;
  }>;
  sectionsOrder?: string[];
  newsEnabled?: boolean;
  news?: Array<{
    id: string;
    title: string;
    html: string;
    date?: string;
    published?: boolean;
  }>;
  about?: { title?: string; text?: string; members?: Array<{ id: string; name: string; role?: string; bio?: string; image?: string; order?: number }> };
  // Admin-managed media embeds (starting with Spotify)
  mediaEmbeds?: Array<{
    id: string;
    type: 'spotify';
    url: string;
    coverUrl?: string;
    title?: string;
    enabled?: boolean;
    order?: number;
  }>;
  // Social links for display across the site
  socials?: Array<{ type: 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'spotify' | 'soundcloud' | 'bandcamp' | 'website' | 'whatsapp'; url: string }>;
  // Tickets: list of external ticket links (no payment processing here)
  tickets?: Array<{ id: string; title: string; url: string; image?: string; description?: string; active?: boolean; paymentType?: 'online' | 'onsite' }>;
  // Booking (Band anfragen)
  booking?: {
    enabled?: boolean;
    headline?: string;
    recipientEmail?: string; // where booking requests are sent
    phone?: string;          // optional phone shown
    note?: string;           // helper text shown under form
  };
  // Events / Scheduler (Admin-managed)
  events?: Array<{
    id: string;
    date: string;        // YYYY-MM-DD
    time?: string;       // HH:MM (optional)
    title: string;
    location?: string;
    link?: string;
    description?: string;
    published?: boolean; // default true
  }>;
  updated_at?: string;
};

export async function contentGet() {
  return apiGet<{ ok: boolean; content: SiteContent }>(`/content.php`);
}

export async function contentSave(content: SiteContent) {
  return apiPost<{ ok: boolean; content: SiteContent }>(`/content.php`, content);
}

// --- Booking requests ---
export async function bookingRequest(payload: {
  name: string;
  email: string;
  date?: string;
  event?: string;
  location?: string;
  message?: string;
  budget?: string;
}) {
  return apiPost<{ ok: boolean; id: string }>(`/booking_request.php`, payload);
}

// Admin: list booking requests
export async function bookingRequestsList() {
  return apiGet<{ ok: boolean; requests: Array<{ id: string; name: string; email: string; date?: string; event?: string; location?: string; budget?: string; message?: string; created_at?: string }> }>(`/booking_requests.php`);
}

export async function bookingRequestsUpdate(id: string, status: 'open'|'confirmed'|'done'|'archived') {
  return apiPost<{ ok: boolean }>(`/booking_requests.php`, { action: 'update', id, status });
}

export async function bookingRequestsDelete(id: string) {
  return apiPost<{ ok: boolean }>(`/booking_requests.php`, { action: 'delete', id });
}

// --- Uploads scanner ---
export async function scanUploads() {
  return apiGet<{ ok: boolean; galleries: Array<{ year: number; name: string; items: Array<{ type: 'image' | 'video'; url: string }> }> }>(`/scan_uploads.php`);
}

// --- Generic file upload ---
export async function uploadFile(file: File, opts?: { year?: number; gallery?: string }) {
  const form = new FormData();
  form.append('file', file);
  if (opts?.year) form.append('year', String(opts.year));
  if (opts?.gallery) form.append('gallery', opts.gallery);
  return apiPost<{ ok: boolean; name: string; url: string; file_path: string; size: number; type: string }>(`/upload.php`, form);
}

// Persist gallery items to metadata.json in the uploads folder for given year/gallery
export async function writeMetadata(
  year: number,
  gallery: string,
  items: Array<{ type: 'image'|'video'|'youtube'|'instagram'; url: string; title?: string }>,
  status?: 'public'|'internal'|'locked'
) {
  const payload: any = { year, gallery, items };
  if (status) payload.status = status;
  return apiPost<{ ok: boolean; written: number }>(`/write_metadata.php`, payload);
}

// --- Two-Factor (TOTP) ---
export async function twofaSetup() {
  return apiGet<{ ok: boolean; secret: string; otpauth: string }>(`/twofa.php?action=setup`);
}

export async function twofaEnable(secret: string, code: string) {
  return apiPost<{ ok: boolean }>(`/twofa.php?action=enable`, { secret, code });
}

export async function twofaVerify(code: string) {
  return apiPost<{ ok: boolean; role?: string }>(`/twofa.php?action=verify`, { code });
}

export async function twofaDisable(email?: string) {
  return apiPost<{ ok: boolean }>(`/twofa.php?action=disable`, email ? { email } : {});
}

// --- Orders (ticket purchases) ---
export type OrderItem = {
  id: string;
  ticket_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  payment: 'onsite' | 'external';
  href?: string;
  name?: string;
  email?: string;
  status: 'reserved' | 'redirected' | 'confirmed' | 'paid' | 'cancelled';
  // Ticket metadata
  ticket_code?: string;
  qr_token?: string;
  redeemed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function ordersList() {
  return apiGet<{ ok: boolean; orders: OrderItem[] }>(`/orders.php`);
}

export async function ordersMine() {
  return apiGet<{ ok: boolean; orders: OrderItem[] }>(`/orders.php?action=mine`);
}

export async function ordersCreate(payload: { ticket_id: string; title: string; date: string; payment: 'onsite' | 'external'; href?: string; name?: string; email?: string }) {
  return apiPost<{ ok: boolean; order: OrderItem }>(`/orders.php?action=create`, payload);
}

export async function ordersUpdate(id: string, status: OrderItem['status']) {
  return apiPost<{ ok: boolean }>(`/orders.php?action=update`, { id, status });
}

export async function ordersFind(params: { code?: string; token?: string }) {
  const qs = new URLSearchParams();
  if (params.code) qs.set('code', params.code);
  if (params.token) qs.set('token', params.token);
  return apiGet<{ ok: boolean; order: OrderItem }>(`/orders.php?action=find&${qs.toString()}`);
}

export async function ordersRepair() {
  return apiGet<{ ok: boolean; repaired: number }>(`/orders.php?action=repair`);
}

// Password reset helpers
export async function requestPasswordReset(email: string) {
  return apiPost<{ ok: boolean }>(`/users.php?action=request_reset`, { email });
}

export async function confirmPasswordReset(email: string, token: string, new_password: string) {
  return apiPost<{ ok: boolean }>(`/users.php?action=confirm_reset`, { email, token, new_password });
}
