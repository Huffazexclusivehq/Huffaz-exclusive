const $ = (s) => document.querySelector(s);

const tokenEl = $('#token');
const searchEl = $('#search');
const statusEl = $('#status');
const refreshBtn = $('#refresh');
const tbody = $('#ordersBody');

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff8a8a' : '';
}

function getToken() {
  return (tokenEl?.value || '').trim();
}

function money(value) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR'
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

async function loadOrders() {
  const token = getToken();

  if (!token) {
    setStatus('Sila masukkan ADMIN_TOKEN.', true);
    return;
  }

  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Loading...';
  setStatus('Sedang mengambil data pesanan...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('/api/orders', {
      method: 'GET',
      headers: {
        'x-admin-token': token,
        'Accept': 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || 'Server tidak memberi JSON.' };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const orders = Array.isArray(data) ? data : (data.orders || []);

    renderOrders(orders);
    setStatus(`${orders.length} pesanan dijumpai.`);
  } catch (error) {
    if (error.name === 'AbortError') {
      setStatus('Timeout: server tidak memberi jawapan dalam 10 saat.', true);
    } else {
      setStatus(`Ralat: ${error.message}`, true);
    }
    tbody.innerHTML = '';
  } finally {
    clearTimeout(timeout);
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh';
  }
}

function renderOrders(orders) {
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="8">Tiada pesanan.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${escapeHtml(order.reference)}</td>
      <td>${escapeHtml(order.customer_name)}</td>
      <td>${escapeHtml(order.customer_whatsapp)}</td>
      <td>${escapeHtml(order.status)}</td>
      <td>${money(order.total)}</td>
      <td>${money(order.paid)}</td>
      <td>${money(order.balance)}</td>
      <td>${escapeHtml(order.created_at ? new Date(order.created_at).toLocaleString('ms-MY') : '')}</td>
    </tr>
  `).join('');
}

refreshBtn?.addEventListener('click', loadOrders);

searchEl?.addEventListener('input', () => {
  const term = searchEl.value.trim().toLowerCase();
  document.querySelectorAll('#ordersBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});
