// "Report" button and dialog for posts, replies, Community questions/answers and trekker profiles (browser only).
import { supabase } from './supabase';
import { getUser, goToLogin } from './auth';
import { el } from './posts';

export type ReportKind = 'post' | 'reply' | 'profile' | 'question' | 'answer';

const REASONS: [string, string][] = [
  ['spam', 'Spam or advertising'],
  ['scam', 'Scam, fake profile or asking for money'],
  ['harassment', 'Harassment, hate or offensive'],
  ['unsafe', 'Unsafe or makes me uncomfortable'],
  ['other', 'Something else'],
];

const WHAT: Record<ReportKind, string> = { post: 'post', reply: 'reply', profile: 'trekker', question: 'question', answer: 'answer' };

let dlg: HTMLDialogElement | null = null;

function buildDialog() {
  const d = document.createElement('dialog');
  d.className = 'report-dlg';
  const form = el('form', 'report-form');
  form.method = 'dialog';

  const h = el('h2', '', 'Report');
  const intro = el('p', 'muted', 'Tell us what’s wrong. Only the site admin sees reports, and the person won’t know who reported them.');

  const list = el('fieldset', 'report-reasons');
  list.append(el('legend', '', 'Reason'));
  for (const [value, label] of REASONS) {
    const l = el('label', 'check-field');
    const r = document.createElement('input');
    r.type = 'radio'; r.name = 'reason'; r.value = value; r.required = true;
    l.append(r, ' ' + label);
    list.append(l);
  }

  const detailsLabel = el('label', 'field', 'Details ');
  detailsLabel.append(el('span', 'hint', 'optional'));
  const details = document.createElement('textarea');
  details.name = 'details'; details.maxLength = 500; details.rows = 3;
  details.placeholder = 'Anything that helps us check it, e.g. what they asked you for.';
  detailsLabel.append(details);

  const err = el('p', 'form-error'); err.hidden = true;
  const done = el('p', 'form-note'); done.hidden = true;

  const actions = el('div', 'report-actions');
  const cancel = el('button', 'btn btn-outline btn-sm', 'Cancel'); cancel.type = 'button';
  const send = el('button', 'btn btn-sun btn-sm', 'Send report'); send.type = 'submit';
  actions.append(cancel, send);

  form.append(h, intro, list, detailsLabel, err, done, actions);
  d.append(form);
  document.body.append(d);

  cancel.addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  return d;
}

/** Open the report dialog for one item. Visitors who aren't signed in are sent to sign in first. */
export async function openReport(kind: ReportKind, targetId: string) {
  const user = await getUser();
  if (!user) return goToLogin();

  dlg?.remove();
  dlg = buildDialog();
  const d = dlg;
  const form = d.querySelector('form')!;
  const err = d.querySelector('.form-error') as HTMLElement;
  const done = d.querySelector('.form-note') as HTMLElement;
  const send = d.querySelector('button[type=submit]') as HTMLButtonElement;
  const cancel = d.querySelector('button[type=button]') as HTMLButtonElement;
  d.querySelector('h2')!.textContent = `Report this ${WHAT[kind]}`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const reason = (form.querySelector('input[name=reason]:checked') as HTMLInputElement | null)?.value;
    if (!reason) { err.textContent = 'Please choose a reason.'; err.hidden = false; return; }
    const details = (form.elements.namedItem('details') as HTMLTextAreaElement).value.trim() || null;
    send.disabled = true;
    const { error } = await supabase.from('reports').insert({ kind, target_id: targetId, reason, details });
    send.disabled = false;
    if (error && error.code !== '23505') {
      err.textContent = 'Could not send: ' + error.message;
      err.hidden = false;
      return;
    }
    form.querySelectorAll('fieldset, label.field').forEach((n) => ((n as HTMLElement).hidden = true));
    d.querySelector('.muted')!.setAttribute('hidden', '');
    done.textContent = error
      ? 'You’ve already reported this. Thanks, we’ll look at it.'
      : 'Thanks, your report has been sent. We check reports regularly and remove anything that breaks the rules.';
    done.hidden = false;
    send.hidden = true;
    cancel.textContent = 'Close';
  });

  d.showModal();
}

/** A small "Report" text button. */
export function reportButton(kind: ReportKind, targetId: string, label = 'Report') {
  const b = el('button', 'report-btn', label);
  b.type = 'button';
  b.title = `Report this ${WHAT[kind]}`;
  b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openReport(kind, targetId); });
  return b;
}
