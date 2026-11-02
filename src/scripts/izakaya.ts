const CLOSED_KEY = 'izakaya-sae-entered';

type Phase = 'prep' | 'open' | 'last' | 'closed';

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

function phaseOf(hour: number): Phase {
  if (hour >= 22 || hour < 5) return 'closed';
  if (hour === 21) return 'last';
  if (hour >= 17) return 'open';
  return 'prep';
}

function formatDuration(ms: number): string {
  const total = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds}秒`;
  return `${minutes}分${String(seconds).padStart(2, '0')}秒`;
}

function visitStamp(debug: string | null): string {
  const date = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  if (debug && /^\d{1,2}(:\d{2})?$/.test(debug)) {
    const [hour, minute = '00'] = debug.split(':');
    return `${date} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  const time = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  return `${date} ${time}`;
}

function setStatus(text: string, kind: string): void {
  const status = document.getElementById('shop-status');
  if (!status) return;
  status.hidden = false;
  status.dataset.kind = kind;
  status.textContent = text;
}

function setupHours(): void {
  const sign = document.getElementById('closed-sign');
  const shop = document.getElementById('shop');
  const enter = document.getElementById('closed-enter');
  const debug = new URLSearchParams(location.search).get('time');
  const hour = tokyoHour(debug);
  if (hour === null) return;
  const phase = phaseOf(hour);
  document.body.dataset.phase = phase;

  if (phase === 'prep') setStatus('仕込み中', 'prep');
  if (phase === 'open') setStatus('営業中', 'open');
  if (phase === 'last') setStatus('ラストオーダーです', 'last');
  if (phase === 'closed' && sessionStorage.getItem(CLOSED_KEY) === '1' && !debug) {
    setStatus('閉店後です。お静かに', 'after');
  }

  if (!sign || !shop || !enter || phase !== 'closed') return;
  if (!debug && sessionStorage.getItem(CLOSED_KEY) === '1') return;

  sign.classList.add('is-open');
  sign.removeAttribute('hidden');
  shop.setAttribute('inert', '');
  enter.focus();

  const leave = () => {
    sign.classList.remove('is-open');
    sign.setAttribute('hidden', '');
    shop.removeAttribute('inert');
    if (!debug) sessionStorage.setItem(CLOSED_KEY, '1');
    setStatus('閉店後です。お静かに', 'after');
    const noren = document.getElementById('noren');
    if (noren instanceof HTMLElement) noren.focus({ preventScroll: true, focusVisible: false });
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
  const when = document.getElementById('receipt-when');
  const slip = document.getElementById('receipt-no');
  if (!(button instanceof HTMLButtonElement) || !(dialog instanceof HTMLDialogElement) || !lines || !total) return;

  const debug = new URLSearchParams(location.search).get('time');
  const slipNo = String(Date.now()).slice(-6);
  const elapsed = new Map<string, number>();
  const started = new Map<string, number>();
  const targets = [...document.querySelectorAll<HTMLElement>('[data-receipt]')];

  const flush = (id: string) => {
    const start = started.get(id);
    if (start === undefined) return;
    elapsed.set(id, (elapsed.get(id) ?? 0) + (performance.now() - start));
    started.delete(id);
  };

  if (targets.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            if (!started.has(id)) started.set(id, performance.now());
          } else {
            flush(id);
          }
        }
      },
      { threshold: 0.25 },
    );
    for (const target of targets) observer.observe(target);
  }

  button.addEventListener('click', () => {
    for (const id of started.keys()) flush(id);
    lines.replaceChildren();
    let sum = 0;
    const items = targets.filter((target) => (elapsed.get(target.id) ?? 0) > 0);
    if (items.length === 0) {
      const empty = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = 'お通し';
      const price = document.createElement('span');
      price.textContent = '0秒';
      empty.append(name, price);
      lines.append(empty);
    } else {
      for (const item of items) {
        const ms = elapsed.get(item.id) ?? 0;
        sum += ms;
        const row = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = item.dataset.receipt ?? item.id;
        const price = document.createElement('span');
        price.textContent = formatDuration(ms);
        row.append(name, price);
        lines.append(row);
      }
    }
    if (when) when.textContent = visitStamp(debug);
    if (slip) slip.textContent = `No. ${slipNo}`;
    total.textContent = `合計　${items.length === 0 ? '0秒' : formatDuration(sum)}`;
    dialog.showModal();
  });
}

function toggleEnkai(): void {
  const on = document.documentElement.classList.toggle('enkai');
  const live = document.getElementById('karaoke-live');
  const status = document.getElementById('shop-status');
  if (live) live.textContent = on ? '宴会のあかりにしました' : 'いつものあかりに戻しました';
  if (on) {
    setStatus('宴会中！', 'enkai');
  } else if (status) {
    const phase = document.body.dataset.phase;
    if (phase === 'prep') setStatus('仕込み中', 'prep');
    else if (phase === 'open') setStatus('営業中', 'open');
    else if (phase === 'last') setStatus('ラストオーダーです', 'last');
    else if (phase === 'closed') setStatus('閉店後です。お静かに', 'after');
  }
}

function setupKaraoke(): void {
  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const buffer: string[] = [];
  document.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    buffer.push(key);
    if (buffer.length > sequence.length) buffer.shift();
    if (sequence.every((step, index) => buffer[index] === step)) {
      buffer.length = 0;
      toggleEnkai();
    }
  });

  const lantern = document.getElementById('lantern-tap');
  if (!lantern) return;
  let taps = 0;
  let timer = 0;
  lantern.addEventListener('click', () => {
    taps += 1;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      taps = 0;
    }, 1600);
    if (taps >= 5) {
      taps = 0;
      toggleEnkai();
    }
  });
}

function setupBottles(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-bottle-open]').forEach((button) => {
    const dialog = document.getElementById(button.dataset.bottleOpen ?? '');
    if (!(dialog instanceof HTMLDialogElement)) return;

    button.addEventListener('click', () => {
      dialog.showModal();
      dialog.focus();
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
      button.focus();
    });
  });
}

function setupSideways(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLButtonElement>('.scroll-hint').forEach((button) => {
    const scroller = document.getElementById(button.dataset.scrollTarget ?? '');
    if (!scroller) {
      button.hidden = true;
      return;
    }

    const update = () => {
      button.hidden = scroller.scrollWidth <= scroller.clientWidth + 4;
    };
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(scroller);
    else window.addEventListener('resize', update);

    button.addEventListener('click', () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const step = Math.max(scroller.clientWidth * 0.8, 140);
      const atEnd = scroller.scrollLeft >= max - 8;
      scroller.scrollTo({
        left: atEnd ? 0 : Math.min(max, scroller.scrollLeft + step),
        behavior: reduce ? 'auto' : 'smooth',
      });
    });
  });
}

setupHours();
setupReceipt();
setupKaraoke();
setupBottles();
setupSideways();
document.getElementById('shop-status')?.addEventListener('click', () => {
  if (document.documentElement.classList.contains('enkai')) toggleEnkai();
});
