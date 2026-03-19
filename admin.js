document.addEventListener("DOMContentLoaded", () => {
    // Кнопка "Вернуться на сайт"
  const backBtn = document.getElementById("back-to-site");
  if (backBtn) {
    backBtn.onclick = () => {
      window.location.href = "index.html"; // возвращаемся на главную
    };
  }

  // Кнопка "Выйти из аккаунта"
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("userData"); // удаляем данные пользователя
      showNotification("Вы вышли из аккаунта");
      window.location.href = "index.html"; // после выхода — на главную
    };
  }
// Загружаем пользователей из БД
fetch("http://localhost:3000/users")
  .then(res => res.json())
  .then(users => {
    const usersContainer = document.getElementById("admin-users");
    if (users.length > 0) {
      usersContainer.innerHTML = users.map(u => `
        <div class="user">
          <p><strong>Имя:</strong> ${u.username}</p>
          <p><strong>Телефон:</strong> ${u.phone}</p>
          <p><strong>Адрес:</strong> ${u.address}</p>
          <p><strong>IP:</strong> ${u.ip || "неизвестно"}</p>
        </div>
      `).join("");
    } else {
      usersContainer.innerHTML = "<p>Нет зарегистрированных пользователей</p>";
    }
  })
  .catch(err => console.error("Ошибка загрузки пользователей:", err));


// Загружаем заказы из БД
fetch("http://localhost:3000/orders")
  .then(res => res.json())
  .then(data => {
    const ordersContainer = document.getElementById("admin-orders");
    const orders = Array.isArray(data) ? data : data.orders; // поддержка обоих форматов

    if (orders && orders.length > 0) {
      ordersContainer.innerHTML = orders.map(order => {
        // items приходит как JSON-строка → парсим
        let items = [];
        try {
          items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        } catch (e) {
          console.error("Ошибка парсинга items:", e);
        }

        return `
          <div class="order">
            <h3>Заказ #${order.id} (пользователь ID ${order.user_id})</h3>
            <p>Комментарий: ${order.comment || "—"}</p>
            <ul>
              ${items.map(i => `<li>${i.name} × ${i.quantity || 1}</li>`).join("")}
            </ul>
            <small>Создан: ${order.created_at}</small>
          </div>
        `;
      }).join("");
    } else {
      ordersContainer.innerHTML = "<p>Заказов пока нет</p>";
    }
  })
  .catch(err => {
    console.error("Ошибка загрузки заказов:", err);
    document.getElementById("admin-orders").innerHTML = "<p>Ошибка загрузки заказов</p>";
  });



if (users.length > 0) {
  usersContainer.innerHTML = users.map(u => `
    <div class="user">
      <p><strong>Имя:</strong> ${u.username}</p>
      <p><strong>Телефон:</strong> ${u.phone}</p>
      <p><strong>Адрес:</strong> ${u.address}</p>
      <p><strong>IP:</strong> ${u.ip || "неизвестно"}</p>
    </div>
  `).join("");
} else {
  usersContainer.innerHTML = "<p>Нет зарегистрированных пользователей</p>";
}


  // Загружаем заказы
  const ordersContainer = document.getElementById("admin-orders");
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  if (orders.length > 0) {
    ordersContainer.innerHTML = orders.map(order => `
      <div class="order">
        <h3>Заказ от ${order.user.name}</h3>
        <p>Телефон: ${order.user.phone}</p>
        <p>Адрес: ${order.user.address}</p>
        <p>Комментарий: ${order.user.comment}</p>
        <ul>
          ${order.items.map(i => `<li>${i.name} × ${i.quantity}</li>`).join("")}
        </ul>
        <small>${order.timestamp}</small>
      </div>
    `).join("");
  } else {
    ordersContainer.innerHTML = "<p>Заказов пока нет</p>";
  }
});
