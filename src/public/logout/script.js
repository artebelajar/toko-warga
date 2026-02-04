
    lucide.createIcons();

        (async () => {
            // 1. Hapus Token dari LocalStorage segera
            localStorage.removeItem("token");

            // 3. Logika Hitung Mundur (3 detik)
            let seconds = 3;
            const timerElement = document.getElementById("timer");

            const countdown = setInterval(() => {
                seconds--;
                timerElement.innerText = seconds;

                if (seconds <= 0) {
                    clearInterval(countdown);
                    window.location.href = "/login/"; // Redirect ke halaman login
                }
            }, 1000);
        })();