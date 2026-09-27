const $ = (id) => document.getElementById(id);

const tokenEl = $("token");
const searchEl = $("search");
const filterEl = $("status");
const ordersEl = $("orders");
const refreshBtn = document.querySelector('button[onclick="loadOrders()"]');

const STATUS_OPTIONS = [
  "Pending",
  "Design",
  "Production",
  "Ready",
  "Completed",
  "Cancelled"
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function money(value) {
  return "RM " + Number(value || 0).toFixed(2);
}

function showMessage(message, isError = false) {
  let box = $("adminMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "adminMessage";
    box.className = "card";
    ordersEl.parentNode.insertBefore(box, ordersEl);
  }

  box.textContent = message;
  box.style.color = isError ? "#ff8a8a" : "";
}

async function loadOrders() {
  const token = tokenEl.value.trim();

  if (!token) {
    showMessage("Masukkan ADMIN_TOKEN dahulu.", true);
    return;
  }

  const params = new URLSearchParams();

  if (filterEl.value) {
    params.set("status", filterEl.value);
  }

  if (searchEl.value.trim()) {
    params.set("search", searchEl.value.trim());
  }

  refreshBtn.disabled = true;
  refreshBtn.textContent = "Loading...";
  showMessage("Sedang mengambil pesanan...");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = "/api/orders" + (params.toString() ? "?" + params.toString() : "");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-admin-token": token,
        "Accept": "application/json"
      },
      cache: "no-store",
      signal: controller.signal
    });

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(text || "Server tidak memberi respons JSON.");
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const orders = Array.isArray(data.orders) ? data.orders : [];

    renderOrders(orders);

    showMessage(
      orders.length
        ? `${orders.length} pesanan dijumpai.`
        : "Tiada pesanan dijumpai."
    );

  } catch (error) {
    if (error.name === "AbortError") {
      showMessage("Timeout: server tidak memberi jawapan dalam 10 saat.", true);
    } else {
      showMessage("Ralat: " + error.message, true);
    }

    ordersEl.innerHTML = "";

  } finally {
    clearTimeout(timeout);
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Refresh";
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersEl.innerHTML = "";
    return;
  }

  ordersEl.innerHTML = orders.map(order => {

    const options = STATUS_OPTIONS.map(status =>
      `<option value="${esc(status)}" ${
        status === order.status ? "selected" : ""
      }>${esc(status)}</option>`
    ).join("");

    return `
      <div class="card">

        <div class="grid">

          <div>
            <small>Reference</small><br>
            <b>${esc(order.reference)}</b>
          </div>

          <div>
            <small>Customer</small><br>
            ${esc(order.customer_name)}
          </div>

          <div>
            <small>WhatsApp</small><br>
            ${esc(order.whatsapp || order.customer_whatsapp)}
          </div>

          <div>
            <small>Total</small><br>
            <b>${money(order.total)}</b>
          </div>

          <div>
            <small>Status</small><br>

            <select onchange="updateOrder('${esc(order.id)}',{status:this.value})">
              ${options}
            </select>

          </div>

        </div>

        <p>
          <small>Item</small><br>
          ${esc(JSON.stringify(order.items || []))}
        </p>

        <textarea
          id="note-${esc(order.id)}"
          rows="2"
          style="width:100%"
          placeholder="Nota admin"
        >${esc(order.admin_note || "")}</textarea>

        <br><br>

        <button onclick="saveNote('${esc(order.id)}')">
          Simpan nota
        </button>

      </div>
    `;

  }).join("");
}

async function updateOrder(id, patch) {

  const token = tokenEl.value.trim();

  if (!token) {
    showMessage("Masukkan ADMIN_TOKEN dahulu.", true);
    return;
  }

  try {

    const response = await fetch(
      "/api/orders/" + encodeURIComponent(id),
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
          "Accept": "application/json"
        },

        body: JSON.stringify(patch)
      }
    );

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    showMessage("Pesanan berjaya dikemaskini.");

  } catch (error) {

    showMessage(
      "Gagal kemaskini: " + error.message,
      true
    );

  }
}

async function saveNote(id) {

  const noteEl = $("note-" + id);

  await updateOrder(id, {
    admin_note: noteEl ? noteEl.value : ""
  });

}

window.loadOrders = loadOrders;
window.updateOrder = updateOrder;
window.saveNote = saveNote;
