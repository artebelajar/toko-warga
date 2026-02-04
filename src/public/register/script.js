document
  .getElementById("register-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Efek loading pada tombol
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;
    btn.innerText = "Mendaftarkan...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: document.getElementById("username").value,
          password: document.getElementById("password").value
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Registrasi berhasil! Silakan login.");
        window.location.href = "/login/";
      } else {
        alert("❌ " + data.message);
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
      btn.innerText = originalText;
      btn.style.opacity = "1";
      btn.disabled = false;
    }
  });
