const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

async function checkAuth() {
  try {
    const res = await fetch("/api/me", {
      headers: { Authorization: "Bearer " + token },
    });
    const json = await res.json();
    if (!json.success) window.location.href = "./login.html";
    return json.data.id;
  } catch (e) {
    window.location.href = "./login/";
  }
}

//logout function
document.getElementById("logout").addEventListener("click", function () {
  localStorage.removeItem("token");
  window.location.href = "/logout/";
});

async function loadProduct() {
  const userId = await checkAuth();
  const res = await fetch(`/api/product/${userId}`);
  const json = await res.json();
  const allProducts = json.data;
  renderProducts(allProducts, userId);

  // Filter Logic
  document.getElementById("categoryFilter").onchange = function () {
    let val = this.value;
    if (val === "all") return renderProducts(allProducts, userId);
    const map = { makanan: 1, minuman: 2, pakaian: 3 };
    renderProducts(
      allProducts.filter((p) => p.categoryId === map[val]),
      userId,
    );
  };
}

function renderProducts(products, userId) {
  const container = document.getElementById("products");
  if (!products || products.length === 0) {
    container.innerHTML =
      "<p style='grid-column: 1/-1; text-align: center; color: #999; padding: 20px;'>Belum ada produk.</p>";
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
          <div class="product-item">
            <img src="${p.imageUrl}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>Rp ${parseInt(p.price).toLocaleString()}</p>
            <p>Stok: ${p.stock}</p>
            <div style="display: flex; gap: 5px; justify-content: center; margin-top: 10px;">
              <button class="btn-edit" onclick="editProduct(${p.id}, ${userId})">Edit</button>
              <button class="btn-delete" onclick="deleteProduct(${p.id})">Hapus</button>
            </div>
          </div>
        `,
    )
    .join("");
}

function logout() {
  window.location.href = "/logout/";
}

async function deleteProduct(id) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  const res = await fetch(`/api/product/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (json.success) {
    alert("Berhasil dihapus");
    loadProduct();
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

async function editProduct(id, userId) {
  const modal = document.getElementById("modal");
  modal.style.display = "flex";

  const res = await fetch(`/api/product/${userId}`);
  const json = await res.json();
  const product = json.data.find((p) => p.id === id);

  if (!product) return alert("Produk tidak ditemukan");

  document.getElementById("nameEdit").value = product.name;
  document.getElementById("descEdit").value = product.description || "";
  document.getElementById("priceEdit").value = product.price;
  document.getElementById("stockEdit").value = product.stock;
  document.getElementById("categoryEdit").value = product.categoryId;
  document.getElementById("name-product").innerText = product.name;
  document.getElementById("imagePreviewEdit").src = product.imageUrl;

  document.getElementById("productFormEdit").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", document.getElementById("nameEdit").value);
    formData.append("description", document.getElementById("descEdit").value);
    formData.append("price", document.getElementById("priceEdit").value);
    formData.append("stock", document.getElementById("stockEdit").value);
    formData.append(
      "categoryId",
      document.getElementById("categoryEdit").value,
    );
    if (document.getElementById("imageEdit").files[0]) {
      formData.append("image", document.getElementById("imageEdit").files[0]);
    }
    formData.append("userId", userId);

    const updateRes = await fetch(`/api/product/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ` + token },
      body: formData,
    });
    const data = await updateRes.json();
    alert(data.message);
    if (data.success) {
      closeModal();
      loadProduct();
    }
  };
}

// Preview Image Listeners
document.getElementById("image").onchange = (e) => {
  const img = document.getElementById("imagePreview");
  img.src = URL.createObjectURL(e.target.files[0]);
  img.style.display = "block";
};

document.getElementById("imageEdit").onchange = (e) => {
  document.getElementById("imagePreviewEdit").src = URL.createObjectURL(
    e.target.files[0],
  );
};

// Close modal on click outside
window.onclick = (e) => {
  if (e.target == document.getElementById("modal")) closeModal();
};

// Add Product Form
document.getElementById("productForm").onsubmit = async (e) => {
  e.preventDefault();
  const userId = await checkAuth();
  const formData = new FormData();
  formData.append("name", document.getElementById("name").value);
  formData.append("description", document.getElementById("desc").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("stock", document.getElementById("stock").value);
  formData.append("categoryId", document.getElementById("category").value);
  formData.append("image", document.getElementById("image").files[0]);
  formData.append("userId", userId);

  const res = await fetch("/api/products", {
    method: "POST",
    headers: { Authorization: `Bearer ` + token },
    body: formData,
  });
  const data = await res.json();
  alert(data.message);
  if (data.success) location.reload();
};

// Initial Load
loadProduct();
