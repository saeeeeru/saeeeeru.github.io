function setupDialogs(): void {
  const lastOpener = new WeakMap<HTMLDialogElement, HTMLElement>();

  document.querySelectorAll<HTMLButtonElement>('[data-dialog]').forEach((button) => {
    const dialog = document.getElementById(button.dataset.dialog ?? '');
    if (!(dialog instanceof HTMLDialogElement)) return;

    if (!dialog.dataset.bound) {
      dialog.dataset.bound = '1';
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', () => {
        lastOpener.get(dialog)?.focus();
      });
    }

    button.addEventListener('click', () => {
      lastOpener.set(dialog, button);
      dialog.showModal();
      dialog.querySelector<HTMLElement>('.dlg-x button')?.focus();
    });
  });
}

function setupSlip(): void {
  const today = document.getElementById('today');
  const slipDate = document.getElementById('slipdate');
  const slipNo = document.getElementById('slipno');
  if (!today && !slipDate && !slipNo) return;

  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const ymd = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  if (today) today.textContent = ymd;
  if (slipDate) slipDate.textContent = `${ymd} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  if (slipNo) {
    let visits = 1;
    try {
      visits = Number(localStorage.getItem('saeVisits') || 0) + 1;
      localStorage.setItem('saeVisits', String(visits));
    } catch {
      visits = 1;
    }
    slipNo.textContent = `No.${String(visits).padStart(4, '0')}`;
  }
}

function setupOkawari(): void {
  const button = document.getElementById('okawari');
  const link = document.getElementById('osusume');
  const source = document.getElementById('osusume-src');
  const data = document.getElementById('osusume-data');
  if (!(button instanceof HTMLButtonElement) || !(link instanceof HTMLAnchorElement) || !source || !data) return;

  let articles: { t: string; u: string; s: string; d: string }[] = [];
  try {
    const parsed = JSON.parse(data.textContent || '[]') as typeof articles;
    if (Array.isArray(parsed)) articles = parsed;
  } catch {
    articles = [];
  }
  if (articles.length < 2) return;

  let index = 0;
  button.addEventListener('click', () => {
    index = (index + 1) % articles.length;
    const article = articles[index];
    if (!article) return;
    link.textContent = article.t;
    link.href = article.u;
    source.textContent = `${article.s} ／ ${article.d}`;
  });
}

setupDialogs();
setupSlip();
setupOkawari();
