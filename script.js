let cart = JSON.parse(localStorage.getItem("cart")) || [];
let userData = JSON.parse(localStorage.getItem("userData")) || null;

// --- Корзина ---
function updateCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) cartCountEl.textContent = count;
}

function showNotification(message) {
  const notif = document.createElement("div");
  notif.className = "notification";
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("visible"), 50);
  setTimeout(() => {
    notif.classList.remove("visible");
    setTimeout(() => notif.remove(), 300);
  }, 2000);
}

function addToCart(product, card) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCart();
  updateCartCount();
  showNotification(`${product.name} добавлен в корзину`);

  const removeBtn = card.querySelector(".remove-from-cart");
  const quantityEl = card.querySelector(".quantity");

  if (removeBtn) removeBtn.style.display = "inline-block";
  if (quantityEl) {
    quantityEl.style.display = "inline-block";
    quantityEl.textContent = existing ? existing.quantity : 1;
  }
}

function removeFromCart(productId, card) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity--;
    if (existing.quantity <= 0) {
      cart = cart.filter(item => item.id !== productId);
      const removeBtn = card.querySelector(".remove-from-cart");
      const quantityEl = card.querySelector(".quantity");
      if (removeBtn) removeBtn.style.display = "none";
      if (quantityEl) quantityEl.style.display = "none";
    } else {
      const quantityEl = card.querySelector(".quantity");
      if (quantityEl) quantityEl.textContent = existing.quantity;
    }
    updateCart();
    updateCartCount();
    showNotification(`${existing.name} удалён из корзины`);
  }
}

// Навешиваем обработчики на карточки товаров
document.querySelectorAll(".product-card").forEach(card => {
  const product = {
    id: card.dataset.id,
    name: card.dataset.name,
    price: parseFloat(card.dataset.price),
    image: card.querySelector("img").getAttribute("src")
  };

  const addBtn = card.querySelector(".add-to-cart");
  const removeBtn = card.querySelector(".remove-from-cart");
  const quantityEl = card.querySelector(".quantity");

  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    if (removeBtn) removeBtn.style.display = "inline-block";
    if (quantityEl) {
      quantityEl.style.display = "inline-block";
      quantityEl.textContent = existing.quantity;
    }
  } else {
    if (removeBtn) removeBtn.style.display = "none";
    if (quantityEl) quantityEl.style.display = "none";
  }

  if (addBtn) addBtn.addEventListener("click", () => addToCart(product, card));
  if (removeBtn) removeBtn.addEventListener("click", () => removeFromCart(product.id, card));
});

// Кнопка перехода в корзину
const cartBtn = document.querySelector(".cart-btn");
if (cartBtn) {
  cartBtn.addEventListener("click", () => {
    window.location.href = "cart.html";
  });
}

// Отображение корзины
// ... весь код до renderCartPage() оставь без изменений ...

// Отображение корзины + автоподстановка + обработка заказа
function renderCartPage() {
  const container = document.getElementById("cart-items");
  const totalEl   = document.getElementById("cart-total");
  const orderForm = document.getElementById("order-form");
  const submitBtn = document.getElementById("submit-order-btn");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p class=\"empty-cart\">Корзина пуста</p>";
    if (totalEl) totalEl.innerHTML = "";
    if (orderForm) orderForm.style.display = "none";
    return;
  }

  // показываем форму, если корзина не пуста
  if (orderForm) orderForm.style.display = "block";

  let total = 0;
  container.innerHTML = cart.map(item => {
    const itemTotal = item.quantity * item.price;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-details">
            ${item.price} ₽ × ${item.quantity} шт
          </div>
        </div>
        <div class="cart-item-total">${itemTotal} ₽</div>
      </div>
    `;
  }).join("");

  if (totalEl) {
    totalEl.innerHTML = `<strong>Итого: ${total} ₽</strong>`;
  }

  // автоподстановка данных пользователя
  if (userData) {
    const nameEl    = document.getElementById("username");
    const phoneEl   = document.getElementById("phone");
    const addressEl = document.getElementById("address");

    if (nameEl)    nameEl.value    = userData.username || "";
    if (phoneEl)   phoneEl.value   = userData.phone   || "";
    if (addressEl) addressEl.value = userData.address || "";
  }

  // обработка отправки заказа
  if (orderForm) {
    // снимаем старые обработчики, чтобы не дублировались
    orderForm.removeEventListener("submit", handleOrderSubmit);
    orderForm.addEventListener("submit", handleOrderSubmit);
  }

  function handleOrderSubmit(e) {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Оформляем...";
    }

    const order = {
      user: {
        name:    document.getElementById("username")?.value || "",
        phone:   document.getElementById("phone")?.value   || "",
        address: document.getElementById("address")?.value || "",
        comment: document.getElementById("comment")?.value || ""
      },
      items: cart,
      timestamp: new Date().toISOString()
    };

    console.log("Заказ отправлен:", order);
    // здесь в будущем можно отправить на сервер: fetch('/api/order', ...)

    showNotification("Заказ успешно оформлен! Спасибо за покупку!");

    // очищаем корзину
    cart = [];
    updateCart();
    updateCartCount();
    renderCartPage();

    // возвращаем кнопку в нормальное состояние (на случай, если пользователь останется на странице)
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Подтвердить заказ";
      }
    }, 2000);
  }
}

// --- Вход / регистрация ---
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault(); // ← это обязательно, чтобы страница не перезагружалась

    // Явно берём значения по id
    const usernameInput = document.getElementById("username");
    const phoneInput    = document.getElementById("phone");
    const addressInput  = document.getElementById("address");
    const passwordInput = document.getElementById("password");

    // Проверяем, что все поля найдены и заполнены
    if (!usernameInput || !phoneInput || !addressInput || !passwordInput) {
      showNotification("Ошибка: не найдены поля формы");
      return;
    }

    const username = usernameInput.value.trim();
    const phone    = phoneInput.value.trim();
    const address  = addressInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !phone || !address || !password) {
      showNotification("Заполните все поля!");
      return;
    }

    // Сохраняем
    userData = { username, phone, address, password };
    localStorage.setItem("userData", JSON.stringify(userData));

    showNotification(`Добро пожаловать, ${username}!`);

    // Закрываем модалку
    const loginModal = document.getElementById("login-modal");
    if (loginModal) loginModal.style.display = "none";

    // Меняем текст кнопки
    const loginText = document.querySelector(".login-text");
    if (loginText) loginText.textContent = username;

    // (опционально) очищаем форму
    loginForm.reset();
  });
}

// --- Обработчик кнопки профиля / входа ---
const loginBtn = document.querySelector(".login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (userData) {
      // уже залогинен → переходим в личный кабинет
      window.location.href = "account.html";
    } else {
      // не залогинен → показываем модалку (только на index.html)
      const loginModal = document.getElementById("login-modal");
      if (loginModal) {
        loginModal.style.display = "block";
      } else {
        // если модалки нет (например на cart.html), можно показать уведомление или ничего
        showNotification("Пожалуйста, войдите через главную страницу");
      }
    }
  });
}

// --- Инициализация ---
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  if (userData) {
    const loginText = document.querySelector(".login-text");
    if (loginText) loginText.textContent = userData.username || "Профиль";
  }

  // рендерим корзину только если мы на странице cart.html
  if (document.getElementById("cart-items")) {
    renderCartPage();
  }
});
