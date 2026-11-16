import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { getStore } from '@netlify/blobs';
import { db } from '../../db/index.ts';
import { records } from '../../db/schema.ts';

const collections = new Set(['players', 'cases', 'sessions', 'ppe', 'events', 'contacts', 'illness', 'wellness', 'meds', 'tue', 'stock', 'settings', 'preferences']);
const limit = 20 * 1024 * 1024;

export default async function handler(request) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  const json = (body, status = 200) => Response.json(body, { status, headers });
  const url = new URL(request.url);
  // An opaque browser workspace keeps newly entered medical data separate.
  const existing = request.headers.get('cookie')?.match(/(?:^|;\s*)psbs_workspace=([a-f0-9-]{36})(?:;|$)/)?.[1];
  const workspace = existing || randomUUID();
  if (!existing) headers.append('Set-Cookie', `psbs_workspace=${workspace}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`);
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return json({ error: 'Permintaan tidak diizinkan.' }, 403);
    if (Number(request.headers.get('content-length') || 0) > limit) return json({ error: 'File terlalu besar (maks. 20 MB).' }, 413);
  }
  try {
    if (url.pathname === '/api/state' && request.method === 'GET') {
      const rows = await db.select().from(records).where(eq(records.workspace, workspace));
      const state = Object.fromEntries([...collections].map(name => [name, {}]));
      for (const row of rows) state[row.collection][row.id] = row.data;
      return json(state);
    }
    const match = url.pathname.match(/^\/api\/records\/([^/]+)\/([^/]+)$/);
    if (match) {
      const collection = decodeURIComponent(match[1]);
      const id = decodeURIComponent(match[2]);
      if (!collections.has(collection) || !id || id.length > 200) return json({ error: 'Data tidak valid.' }, 400);
      const where = and(eq(records.workspace, workspace), eq(records.collection, collection), eq(records.id, id));
      if (request.method === 'DELETE') {
        await db.delete(records).where(where);
        return json({ ok: true });
      }
      if (request.method === 'PUT' || request.method === 'PATCH') {
        const text = await request.text();
        if (Buffer.byteLength(text) > limit) return json({ error: 'Data terlalu besar.' }, 413);
        let data;
        try { data = JSON.parse(text); } catch { return json({ error: 'Format data tidak valid.' }, 400); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Data tidak valid.' }, 400);
        await db.insert(records).values({ workspace, collection, id, data }).onConflictDoUpdate({
          target: [records.workspace, records.collection, records.id],
          set: { data: request.method === 'PATCH' ? sql`${records.data} || ${JSON.stringify(data)}::jsonb` : data },
        });
        return json({ ok: true });
      }
      return json({ error: 'Metode tidak diizinkan.' }, 405);
    }
    if (url.pathname === '/api/uploads' && request.method === 'POST') {
      const contentType = request.headers.get('content-type')?.split(';')[0] || '';
      const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf' };
      if (!extensions[contentType]) return json({ error: 'Gunakan PNG, JPEG, WebP, atau PDF.' }, 400);
      const bytes = await request.arrayBuffer();
      if (bytes.byteLength > limit) return json({ error: 'File terlalu besar (maks. 20 MB).' }, 413);
      const id = `${randomUUID()}.${extensions[contentType]}`;
      await getStore('medical-uploads').set(`${workspace}/${id}`, bytes);
      return json({ id }, 201);
    }
    if (url.pathname.startsWith('/_blob/') && request.method === 'GET') {
      const id = url.pathname.slice('/_blob/'.length);
      if (!/^[a-f0-9-]{36}\.(png|jpg|webp|pdf)$/.test(id)) return json({ error: 'File tidak ditemukan.' }, 404);
      const bytes = await getStore('medical-uploads').get(`${workspace}/${id}`, { type: 'arrayBuffer' });
      if (!bytes) return json({ error: 'File tidak ditemukan.' }, 404);
      headers.set('Content-Type', { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' }[id.split('.').pop()]);
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(bytes, { headers });
    }
    return json({ error: 'Tidak ditemukan.' }, 404);
  } catch {
    return json({ error: 'Penyimpanan tidak tersedia. Silakan coba lagi.' }, 503);
  }
}
