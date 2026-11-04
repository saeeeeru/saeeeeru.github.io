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

function setupHashira(): void {
  const bar = document.querySelector('.hashira');
  const fv = document.querySelector('.fv');
  if (!(bar instanceof HTMLElement) || !(fv instanceof HTMLElement)) return;

  const sections = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const kanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (sections.length === 0) return;

  const setActive = (id: string) => {
    const index = sections.findIndex((section) => section.id === id);
    document.querySelectorAll<HTMLElement>('[data-pos]').forEach((link) => {
      const on = link.dataset.pos === id;
      link.classList.toggle('on', on);
      if (on) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const name = index >= 0 ? sections[index]?.querySelector('h2')?.textContent?.trim() ?? '' : '';
    const no = index >= 0 ? kanji[index] ?? String(index + 1) : '';
    document.querySelectorAll('[data-pos-name]').forEach((node) => {
      node.textContent = name;
    });
    document.querySelectorAll('[data-pos-no]').forEach((node) => {
      node.textContent = no;
    });
  };

  const current = new IntersectionObserver(
    (entries) => {
      const hit = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            sections.indexOf(a.target as HTMLElement) - sections.indexOf(b.target as HTMLElement),
        )
        .at(-1);
      if (hit) setActive(hit.target.id);
    },
    { rootMargin: '-30% 0px -65% 0px', threshold: 0 },
  );
  for (const section of sections) current.observe(section);

  const passed = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      const past = !entry.isIntersecting;
      document.documentElement.classList.toggle('past-fv', past);
      bar.toggleAttribute('inert', !past);
    },
    { rootMargin: '0px 0px -85% 0px', threshold: 0 },
  );
  passed.observe(fv);

  const lastId = sections.at(-1)?.id;
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking || !lastId) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          setActive(lastId);
        }
      });
    },
    { passive: true },
  );

  const toc = document.getElementById('toc-dlg');
  const open = document.querySelector('.open-toc');
  if (!(toc instanceof HTMLDialogElement) || !(open instanceof HTMLButtonElement)) return;

  const setExpanded = () => open.setAttribute('aria-expanded', String(toc.open));
  open.addEventListener('click', () => {
    toc.showModal();
  });
  toc.addEventListener('toggle', setExpanded);
  toc.addEventListener('click', (event) => {
    if (event.target === toc) toc.close();
  });
  toc.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toc.close());
  });
}

setupDialogs();
setupSlip();
setupOkawari();
setupHashira();
