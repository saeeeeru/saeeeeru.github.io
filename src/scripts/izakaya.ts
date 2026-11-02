const CLOSED_KEY = 'izakaya-sae-entered';

function tokyoHour(debug: string | null): number | null {
  if (debug) {
    const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(debug.trim());
    if (!match) return null;
    const hour = Number(match[1]);
    if (hour < 0 || hour > 23) return null;
    return hour;
  }
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  return Number(hour);
}

function isClosedHour(hour: number): boolean {
  return hour >= 22 || hour < 5;
}

function setupClosedSign(): void {
  const sign = document.getElementById('closed-sign');
  const shop = document.getElementById('shop');
  const enter = document.getElementById('closed-enter');
  if (!sign || !shop || !enter) return;

  const debug = new URLSearchParams(location.search).get('time');
  const hour = tokyoHour(debug);
  if (hour === null || !isClosedHour(hour)) return;
  if (!debug && sessionStorage.getItem(CLOSED_KEY) === '1') return;

  sign.classList.add('is-open');
  sign.removeAttribute('hidden');
  shop.setAttribute('inert', '');
  document.getElementById('last-order')?.removeAttribute('hidden');
  enter.focus();

  const leave = () => {
    sign.classList.remove('is-open');
    sign.setAttribute('hidden', '');
    shop.removeAttribute('inert');
    if (!debug) sessionStorage.setItem(CLOSED_KEY, '1');
    const noren = document.getElementById('noren');
    if (noren instanceof HTMLElement) noren.focus();
  };

  enter.addEventListener('click', leave);
  sign.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') leave();
  });
}

function setupReceipt(): void {
  const button = document.getElementById('checkout');
  const dialog = document.getElementById('receipt');
  const lines = document.getElementById('receipt-lines');
  const total = document.getElementById('receipt-total');
  if (!(button instanceof HTMLButtonElement) || !(dialog instanceof HTMLDialogElement) || !lines || !total) return;

  const seen = new Set<string>();
  const targets = [...document.querySelectorAll<HTMLElement>('[data-receipt]')];
  if (targets.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) seen.add(entry.target.id);
        }
      },
      { threshold: 0.35 },
    );
    for (const target of targets) observer.observe(target);
  }

  button.addEventListener('click', () => {
    const viewed = targets.filter((target) => seen.has(target.id));
    const items = viewed.length > 0 ? viewed : [];
    lines.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.innerHTML = '<span>お通し</span><span>時価</span>';
      lines.append(empty);
    } else {
      for (const item of items) {
        const row = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = item.dataset.receipt ?? item.id;
        const price = document.createElement('span');
        price.textContent = '時価';
        row.append(name, price);
        lines.append(row);
      }
    }
    total.textContent = '合計　時価';
    dialog.showModal();
  });
}

function setupKaraoke(): void {
  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const buffer: string[] = [];
  const live = document.getElementById('karaoke-live');

  document.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    buffer.push(key);
    if (buffer.length > sequence.length) buffer.shift();
    const matched = sequence.every((step, index) => buffer[index] === step);
    if (!matched) return;
    buffer.length = 0;
    const on = document.documentElement.classList.toggle('enkai');
    if (live) live.textContent = on ? '宴会のあかりにしました' : 'いつものあかりに戻しました';
  });
}

setupClosedSign();
setupReceipt();
setupKaraoke();
