/* JS Tetap Sama dengan fungsionalitas aslinya untuk mencegah error */
let cart = [];
let allProducts = [];

async function load() {
  const res = await fetch("/api/products");
  const json = await res.json();
  allProducts = json.data;
  renderProducts(allProducts);
}

//logout function
document.getElementById("logout").addEventListener("click", function () {
  localStorage.removeItem("token");
  window.location.href = "/logout/";
});

function add(id) {
  const exist = cart.find((c) => c.productId === id);
  if (exist) exist.quantity++;
  else cart.push({ productId: id, quantity: 1 });
  updateCount();
  // Efek feedback sederhana
  const btn = event.target;
  const originalText = btn.innerText;
  btn.innerText = "✅ Berhasil!";
  setTimeout(() => (btn.innerText = originalText), 1000);
}

function updateCount() {
  document.getElementById("count").innerText = cart.reduce(
    (a, b) => a + b.quantity,
    0,
  );
}

function toggleCart() {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("sidebarOverlay");

    const isActive = sidebar.classList.toggle("active");
    overlay.classList.toggle("active");

    if (isActive) {
        renderCartList();
        document.body.style.overflow = "hidden"; // Kunci scroll
    } else {
        document.body.style.overflow = "auto"; // Lepas scroll
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    
    sidebar.classList.remove("active");
    overlay.classList.remove("active");

    document.getElementById("btn-cart")?.addEventListener("click", toggleCart);
    document.getElementById("close-sidebar")?.addEventListener("click", toggleCart);
    document.getElementById("sidebarOverlay")?.addEventListener("click", toggleCart);
    document.getElementById("btn-continue")?.addEventListener("click", toggleCart);
    document.getElementById("btn-checkout")?.addEventListener("click", checkout);
});

window.add = add;

function renderProducts(products) {
  document.getElementById("products").innerHTML = products
    .map(
      (p) => `
          <div class="product-card">
            <img src="${p.imageUrl}" alt="${p.name}">
            <div class="product-info">
              <h3>${p.name}</h3>
              <p>${p.description ?? "Produk unggulan Toko Warga."}</p>
              <div class="price">Rp ${Number(p.price).toLocaleString("id-ID")}</div>
              <button class="btn-gold" style="margin-top: 20px;" onclick="add(${p.id})">Tambah (+) </button>
            </div>
          </div>
        `,
    )
    .join("");
}

document
  .getElementById("categoryFilter")
  .addEventListener("change", function () {
    let value = this.value;
    if (value === "all") {
      renderProducts(allProducts);
      return;
    } else if (value === "makanan") value = 1;
    else if (value === "minuman") value = 2;
    else if (value === "pakaian") value = 3;

    const filtered = allProducts.filter((p) => p.categoryId === Number(value));
    renderProducts(filtered);
  });

function renderCartList() {
  const list = document.getElementById("cartList");
  if (cart.length === 0) {
    list.innerHTML =
      "<p style='text-align:center; padding: 20px; color:#b2bec3;'>Keranjang masih kosong...</p>";
    return;
  }
  list.innerHTML = cart
    .map((c) => {
      const p = allProducts.find((x) => x.id === c.productId);
      return `
              <div class="cart-item">
                <span><b style="color:var(--dark-gold)">${c.quantity}x</b> ${p.name}</span>
                <span style="font-weight:700">Rp ${(p.price * c.quantity).toLocaleString()}</span>
              </div>`;
    })
    .join("");
}

async function checkout() {
  const name = document.getElementById("cName").value;
  const addr = document.getElementById("cAddr").value;
  if (!name || !addr || cart.length === 0)
    return alert("Lengkapi data diri dan keranjang Anda.");

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: name,
      address: addr,
      items: cart,
    }),
  });
  const data = await res.json();

  if (data.success) {
    const msg = `Halo Admin, saya mau pesan order ID #${data.orderId}.\n\nTotal: Rp ${data.total.toLocaleString()}\nNama: ${name}\nAlamat: ${addr}`;
    window.location.href = `https://wa.me/6285752214806?text=${encodeURIComponent(msg)}`;
  }
}

async function checkAuth() {
  try {
    const res = await fetch("/api/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    const json = await res.json();
    if (json.success) {
      if (json.data.role === "admin") {
        document.getElementById("admin").style.display = "inline";
      }
      document.getElementById("username").textContent = json.data.username;
      return true;
    } else {
      window.location.href = "./login/";
    }
  } catch (e) {
    window.location.href = "./login/";
  }
  return false;
}

(async () => {
  if (await checkAuth()) load();
})();
