// News tab on /admin/: list, write, edit, publish and delete articles (table: news).
// Saving changes the database; a Supabase webhook then tells Cloudflare to rebuild the site,
// so the article page is live about 2 minutes later.
import { marked } from 'marked';
import { supabase } from './supabase';
import { getCategory } from '../data/news';

type Toast = (msg: string) => void;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

let rows: any[] = [];
let toast: Toast = () => {};
let bound = false;
let slugTouched = false;
let editing: any = null;

const today = () => {
  // Nepal date, so an article saved late in the evening isn't dated yesterday
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
};

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/, '');

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function initNewsAdmin(t: Toast) {
  toast = t;
  if (!bound) { bind(); bound = true; }
  load();
}

// ── List ──────────────────────────────────────────────────
async function load() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) { toast('Could not load articles: ' + error.message); return; }
  rows = data ?? [];
  render();
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = '') {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function btn(label: string, onClick: () => void, cls = '') {
  const b = el('button', label, cls);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function render() {
  const body = $('news-rows');
  body.replaceChildren(...rows.map((r) => {
    const tr = el('tr');
    if (!r.published) tr.className = 'hidden-row';

    const title = el('td', '', 'news-title-cell');
    title.append(el('strong', r.title), el('small', `/news/${r.slug}/`));

    const status = el('td');
    status.append(el('span', r.published ? 'Published' : 'Draft', `tag ${r.published ? 'on' : 'off'}`));
    if (r.featured) { status.append(' '); status.append(el('span', 'Top story', 'tag full')); }

    const actions = el('td', '', 'actions');
    actions.append(btn('Edit', () => openForm(r)));
    if (r.published) {
      const view = el('a', 'View');
      view.href = `/news/${r.slug}/`; view.target = '_blank';
      actions.append(view);
    }
    actions.append(
      btn(r.published ? 'Unpublish' : 'Publish', () => togglePublished(r)),
      btn('Delete', () => remove(r), 'danger'),
    );

    tr.append(
      el('td', fmtDate(r.updated_on ?? r.published_on), 'nowrap'),
      title,
      el('td', getCategory(r.category)?.name ?? r.category),
      status,
      actions,
    );
    return tr;
  }));
  $('news-none').hidden = rows.length > 0;
}

const LIVE_NOTE = 'The website updates in about 2 minutes.';

async function togglePublished(r: any) {
  const change: any = { published: !r.published };
  // A draft going live gets today's date (unless it's an older article that was updated)
  if (!r.published && !r.updated_on && r.published_on < today()) change.published_on = today();
  const { error } = await supabase.from('news').update(change).eq('id', r.id);
  if (error) return toast('Error: ' + error.message);
  toast(r.published ? `Unpublished. ${LIVE_NOTE}` : `Published! ${LIVE_NOTE}`);
  load();
}

async function remove(r: any) {
  if (!confirm(`Delete “${r.title}”? This can’t be undone.`)) return;
  const { error } = await supabase.from('news').delete().eq('id', r.id);
  if (error) return toast('Error: ' + error.message);
  toast(`Article deleted. ${LIVE_NOTE}`);
  load();
}

// ── Form ──────────────────────────────────────────────────
const form = () => $<HTMLFormElement>('news-form');
const field = (name: string) => form().elements.namedItem(name) as HTMLInputElement;
const checks = (name: string) => [...form().querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];

function setCover(url: string) {
  field('image').value = url;
  const img = $<HTMLImageElement>('cover-img');
  img.hidden = !url;
  if (url) img.src = url; else img.removeAttribute('src');
  $('cover-remove').hidden = !url;
}

function updateCounts() {
  for (const name of ['title', 'description']) {
    const counter = form().querySelector<HTMLElement>(`[data-count="${name}"]`)!;
    const max = name === 'title' ? 140 : 200;
    const extra = name === 'description' ? ' · aim for 120–158, shown on Google and on cards' : '';
    counter.textContent = `${field(name).value.length} / ${max}${extra}`;
  }
}

function openForm(r?: any) {
  editing = r ?? null;
  const f = form();
  f.reset();
  $('news-error').hidden = true;
  $('news-form-title').textContent = r ? 'Edit article' : 'New article';
  field('id').value = r?.id ?? '';
  field('title').value = r?.title ?? '';
  field('slug').value = r?.slug ?? '';
  field('description').value = r?.description ?? '';
  field('category').value = r?.category ?? 'route-updates';
  field('trail_status').value = r?.trail_status ?? '';
  field('author').value = r?.author ?? 'Sameer Regmi';
  field('published_on').value = r?.published_on ?? today();
  field('updated_on').value = r?.updated_on ?? '';
  field('image_alt').value = r?.image_alt ?? '';
  field('body').value = r?.body ?? '';
  field('sources').value = (r?.sources ?? []).map((s: any) => `${s.title} | ${s.url}`).join('\n');
  field('featured').checked = !!r?.featured;
  field('published').checked = !!r?.published;
  checks('treks').forEach((c) => (c.checked = (r?.treks ?? []).includes(c.value)));
  checks('regions').forEach((c) => (c.checked = (r?.regions ?? []).includes(c.value)));
  setCover(r?.image ?? '');
  $('cover-status').textContent = '';
  slugTouched = !!r;
  $('slug-warn').hidden = true;
  setMode('write');
  updateCounts();
  $<HTMLDialogElement>('news-dlg').showModal();
  field('title').focus();
}

function setMode(mode: 'write' | 'preview') {
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  const preview = $('news-preview');
  const area = field('body');
  if (mode === 'preview') {
    preview.innerHTML = marked.parse(area.value || '_Nothing written yet._', { async: false }) as string;
  }
  preview.hidden = mode !== 'preview';
  area.hidden = mode === 'preview';
  $('tools').style.visibility = mode === 'preview' ? 'hidden' : 'visible';
}

function parseSources(text: string) {
  const out: { title: string; url: string }[] = [];
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const i = line.lastIndexOf('|');
    const url = (i >= 0 ? line.slice(i + 1) : line).trim();
    const title = (i >= 0 ? line.slice(0, i) : url).trim() || url;
    if (!/^https?:\/\/\S+$/.test(url)) throw new Error(`This source line needs a link starting with https://  →  “${line}”`);
    out.push({ title, url });
  }
  return out;
}

async function save(e: Event) {
  e.preventDefault();
  const err = $('news-error');
  err.hidden = true;
  const fail = (msg: string) => { err.textContent = msg; err.hidden = false; };

  let sources;
  try { sources = parseSources(field('sources').value); } catch (x: any) { return fail(x.message); }

  const slug = slugify(field('slug').value);
  if (!slug) return fail('Please add a web address for the article.');
  const updated = field('updated_on').value || null;
  if (updated && updated < field('published_on').value) return fail('“Updated on” can’t be before “Published on”.');

  const payload = {
    title: field('title').value.trim(),
    slug,
    description: field('description').value.trim(),
    category: field('category').value,
    trail_status: field('trail_status').value || null,
    author: field('author').value.trim() || 'Sameer Regmi',
    published_on: field('published_on').value,
    updated_on: updated,
    image: field('image').value || null,
    image_alt: field('image_alt').value.trim() || null,
    body: field('body').value.trim(),
    sources,
    regions: checks('regions').filter((c) => c.checked).map((c) => c.value),
    treks: checks('treks').filter((c) => c.checked).map((c) => c.value),
    featured: field('featured').checked,
    published: field('published').checked,
  };
  if (payload.published && payload.body.length < 50) return fail('The article text is very short. Write a bit more before publishing.');

  const saveBtn = $<HTMLButtonElement>('news-save');
  saveBtn.disabled = true;
  // Only one top story at a time
  if (payload.featured) await supabase.from('news').update({ featured: false }).eq('featured', true).neq('id', field('id').value || '00000000-0000-0000-0000-000000000000');
  const id = field('id').value;
  const { error } = id
    ? await supabase.from('news').update(payload).eq('id', id)
    : await supabase.from('news').insert(payload);
  saveBtn.disabled = false;
  if (error) {
    if (error.code === '23505') return fail('Another article already uses this web address. Change it slightly.');
    return fail('Could not save: ' + error.message);
  }
  $<HTMLDialogElement>('news-dlg').close();
  toast(payload.published ? `Saved and published. ${LIVE_NOTE}` : 'Saved as a draft (not on the website).');
  load();
}

// ── Photos: shrink in the browser, then upload to the "news" storage bucket ──
async function shrink(file: File, maxW = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process the photo'))), 'image/webp', 0.82));
}

async function upload(file: File): Promise<string> {
  const blob = await shrink(file);
  const base = slugify(field('slug').value || field('title').value || 'photo').slice(0, 50) || 'photo';
  const path = `${today().slice(0, 7)}/${base}-${Date.now().toString(36)}.webp`;
  const { error } = await supabase.storage.from('news').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return supabase.storage.from('news').getPublicUrl(path).data.publicUrl;
}

// ── Markdown toolbar ──────────────────────────────────────
function insert(before: string, after = '', placeholder = '') {
  const ta = field('body') as unknown as HTMLTextAreaElement;
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const sel = value.slice(s, e) || placeholder;
  ta.setRangeText(before + sel + after, s, e, 'end');
  if (!value.slice(s, e) && placeholder) {
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + placeholder.length;
  }
  ta.focus();
}

function lineStart(prefix: string, placeholder: string) {
  const ta = field('body') as unknown as HTMLTextAreaElement;
  const before = ta.value.slice(0, ta.selectionStart);
  const nl = before.length && !before.endsWith('\n') ? '\n\n' : '';
  insert(nl + prefix, '', placeholder);
}

function tool(kind: string) {
  switch (kind) {
    case 'h2': return lineStart('## ', 'Heading');
    case 'h3': return lineStart('### ', 'Small heading');
    case 'bold': return insert('**', '**', 'bold text');
    case 'list': return lineStart('- ', 'List item');
    case 'quote': return lineStart('> ', 'Tip or important note');
    case 'link': {
      const url = prompt('Link address (https://… or a page on this site like /annapurna-region/annapurna-circuit/)');
      if (url) insert('[', `](${url.trim()})`, 'link text');
      return;
    }
    case 'youtube': {
      const url = prompt('Paste the YouTube video link');
      const id = url?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
      if (url && !id) return toast('That doesn’t look like a YouTube link');
      if (id) lineStart(`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allowfullscreen></iframe>\n\n`, '');
      return;
    }
  }
}

function bind() {
  const f = form();
  f.addEventListener('submit', save);
  $('news-add').addEventListener('click', () => openForm());
  $('news-cancel').addEventListener('click', () => $<HTMLDialogElement>('news-dlg').close());
  $('news-x').addEventListener('click', () => $<HTMLDialogElement>('news-dlg').close());

  field('title').addEventListener('input', () => {
    if (!slugTouched) field('slug').value = slugify(field('title').value);
    updateCounts();
  });
  field('description').addEventListener('input', updateCounts);
  field('slug').addEventListener('input', () => {
    slugTouched = true;
    $('slug-warn').hidden = !(editing?.published && field('slug').value !== editing.slug);
  });
  field('slug').addEventListener('blur', () => (field('slug').value = slugify(field('slug').value)));

  // Ticking a trek also ticks its region
  checks('treks').forEach((c) => c.addEventListener('change', () => {
    if (!c.checked) return;
    const region = c.closest('.trek-group')?.querySelector<HTMLInputElement>('input[name="regions"]');
    if (region) region.checked = true;
  }));

  field('published').addEventListener('change', () => {
    if (field('published').checked && !editing?.published) field('published_on').value = today();
  });
  $('mark-updated').addEventListener('click', () => (field('updated_on').value = today()));

  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
    b.addEventListener('click', () => setMode(b.dataset.mode as 'write' | 'preview')));
  document.querySelectorAll<HTMLButtonElement>('[data-md]').forEach((b) =>
    b.addEventListener('click', () => tool(b.dataset.md!)));

  $<HTMLInputElement>('cover-file').addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    $('cover-status').textContent = 'Uploading…';
    try {
      setCover(await upload(file));
      $('cover-status').textContent = 'Uploaded ✓';
    } catch (x: any) {
      $('cover-status').textContent = 'Upload failed: ' + x.message;
    }
    input.value = '';
  });
  $('cover-remove').addEventListener('click', () => setCover(''));

  $<HTMLInputElement>('body-file').addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    toast('Uploading photo…');
    try {
      const url = await upload(file);
      const alt = prompt('Short description of the photo (for Google):') ?? '';
      lineStart(`![${alt.replace(/[\[\]]/g, '')}](${url})\n\n`, '');
      toast('Photo added');
    } catch (x: any) {
      toast('Upload failed: ' + x.message);
    }
    input.value = '';
  });
}
