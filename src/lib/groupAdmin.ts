// Admin → "From FB group" tab (update 26): share, edit, close and delete posts from the Facebook group.
import { supabase } from './supabase';
import { getTrek } from '../data/treks';
import { dateRange, today } from './posts';
import { fetchGroupPosts, type GroupPost } from './groupPosts';

type Toast = (msg: string) => void;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let toast: Toast = () => {};
let ready = false;

const FB_RE = /^https:\/\/(www\.|m\.|web\.)?facebook\.com\/groups\//i;
// Rough check for contact details pasted into the summary
const CONTACT_RE = /(@[a-z0-9_.]{3,}|[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d\s-]{7,}\d|whats\s?app|instagram|insta\b)/i;

function form() { return $<HTMLFormElement>('group-form'); }
function field(name: string) { return form().elements.namedItem(name) as HTMLInputElement; }

function cell(text: string, cls = '') {
  const c = document.createElement('td');
  if (cls) c.className = cls;
  c.textContent = text;
  return c;
}
function btn(label: string, onClick: () => void, cls = '') {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = label;
  if (cls) b.className = cls;
  b.addEventListener('click', onClick);
  return b;
}
function tag(text: string, cls: string) {
  const s = document.createElement('span');
  s.className = `tag ${cls}`; s.textContent = text;
  return s;
}

async function load() {
  const rows = await fetchGroupPosts({ all: true });
  const t = today();
  $('group-rows').replaceChildren(...rows.map((g) => {
    const past = (g.end_date ?? g.start_date) < t;
    const tr = document.createElement('tr');
    if (g.status === 'closed' || past) tr.className = 'hidden-row';

    const status = document.createElement('td');
    status.append(g.status === 'closed' ? tag('Closed', 'off') : past ? tag('Past', 'off') : tag('On website', 'on'));

    const actions = document.createElement('td');
    actions.className = 'actions';
    const view = document.createElement('a');
    view.href = g.fb_url; view.target = '_blank'; view.rel = 'noopener'; view.textContent = 'Facebook';
    actions.append(
      view,
      btn('Edit', () => openForm(g)),
      btn(g.status === 'open' ? 'Close' : 'Reopen', () => toggle(g)),
      btn('Delete', () => remove(g), 'danger'),
    );

    tr.append(
      cell(dateRange(g.start_date, g.end_date) + (g.flexible ? ' · flexible' : ''), 'nowrap'),
      cell(getTrek(g.trek)?.name ?? g.trek),
      cell(g.summary, 'mod-text'),
      status,
      actions,
    );
    return tr;
  }));
  $('group-none').hidden = rows.length > 0;
}

async function toggle(g: GroupPost) {
  const { error } = await supabase.from('group_posts')
    .update({ status: g.status === 'open' ? 'closed' : 'open' }).eq('id', g.id);
  if (error) return toast('Error: ' + error.message);
  toast(g.status === 'open' ? 'Closed – no longer shown on the website' : 'Reopened');
  load();
}

async function remove(g: GroupPost) {
  if (!confirm(`Delete this ${getTrek(g.trek)?.name ?? g.trek} post? This can’t be undone.`)) return;
  const { error } = await supabase.from('group_posts').delete().eq('id', g.id);
  if (error) return toast('Error: ' + error.message);
  toast('Deleted');
  load();
}

function openForm(g?: GroupPost) {
  form().reset();
  $('group-error').hidden = true;
  $('group-form-title').textContent = g ? 'Edit group post' : 'Share a group post';
  field('id').value = g?.id ?? '';
  field('fb_url').value = g?.fb_url ?? '';
  field('trek').value = g?.trek ?? '';
  field('start_date').value = g?.start_date ?? '';
  field('end_date').value = g?.end_date ?? '';
  field('flexible').checked = g?.flexible ?? false;
  field('summary').value = g?.summary ?? '';
  field('open').checked = g ? g.status === 'open' : true;
  $<HTMLDialogElement>('group-dlg').showModal();
}

function showError(msg: string) {
  $('group-error').textContent = msg;
  $('group-error').hidden = false;
}

async function save(e: Event) {
  e.preventDefault();
  const fbUrl = field('fb_url').value.trim();
  const summary = field('summary').value.trim();
  const trekSel = form().elements.namedItem('trek') as HTMLSelectElement;
  const region = trekSel.selectedOptions[0]?.dataset.region ?? '';
  const start = field('start_date').value;
  const end = field('end_date').value || null;

  if (!FB_RE.test(fbUrl)) return showError('Paste the link to the post in the Facebook group (it starts with https://www.facebook.com/groups/…).');
  if (end && end < start) return showError('The end date can’t be before the start date.');
  if (summary.length < 20) return showError('Write a short summary – at least 20 characters.');
  if (CONTACT_RE.test(summary) &&
      !confirm('The summary looks like it has contact details (a phone number, email, @handle, WhatsApp or Instagram). Those should stay on Facebook. Save anyway?')) return;

  const payload = {
    fb_url: fbUrl, trek: trekSel.value, region, start_date: start, end_date: end,
    flexible: field('flexible').checked, summary, status: field('open').checked ? 'open' : 'closed',
  };
  const id = field('id').value;
  const saveBtn = $<HTMLButtonElement>('group-save');
  saveBtn.disabled = true;
  const { error } = id
    ? await supabase.from('group_posts').update(payload).eq('id', id)
    : await supabase.from('group_posts').insert(payload);
  saveBtn.disabled = false;
  if (error) {
    return showError(/group_posts/.test(error.message) && /exist|schema cache/.test(error.message)
      ? 'The group posts table isn’t set up yet – run supabase/update-26-group-posts.sql in Supabase first.'
      : 'Could not save: ' + error.message);
  }
  $<HTMLDialogElement>('group-dlg').close();
  toast(id ? 'Group post updated' : 'Shared on the website');
  load();
}

export function initGroupAdmin(t: Toast) {
  toast = t;
  if (!ready) {
    ready = true;
    $('group-add').addEventListener('click', () => openForm());
    $('group-cancel').addEventListener('click', () => $<HTMLDialogElement>('group-dlg').close());
    form().addEventListener('submit', save);
  }
  load();
}
