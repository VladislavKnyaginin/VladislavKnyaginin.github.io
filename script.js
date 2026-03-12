let cart = JSON.parse(localStorage.getItem("cart")) || [];
let userData = JSON.parse(localStorage.getItem("userData")) || null;

// ──────────────────────────────────────────────
// Корзина
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Отображение корзины (cart.html)
// ──────────────────────────────────────────────

function renderCartPage() {
  const container = document.getElementById("cart-items");
  const totalEl   = document.getElementById("cart-total");
  const orderForm = document.getElementById("order-form");
  const submitBtn = document.getElementById("submit-order-btn");

  if (!container) return;

  // Перечитываем корзину заново
  cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    container.innerHTML = "<p class=\"empty-cart\">Корзина пуста</p>";
    if (totalEl) totalEl.innerHTML = "";
    if (orderForm) orderForm.style.display = "none";
    return;
  }

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

  // Автоподстановка
  if (userData) {
    const nameEl    = document.getElementById("username");
    const phoneEl   = document.getElementById("phone");
    const addressEl = document.getElementById("address");

    if (nameEl)    nameEl.value    = userData.username || "";
    if (phoneEl)   phoneEl.value   = userData.phone   || "";
    if (addressEl) addressEl.value = userData.address || "";
  }

  // Отправка заказа
  if (orderForm) {
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
    showNotification("Заказ успешно оформлен!");

    cart = [];
    updateCart();
    renderCartPage();

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Подтвердить заказ";
      }
    }, 2000);
  }
}

// ──────────────────────────────────────────────
// Вход / регистрация
// ──────────────────────────────────────────────

const loginBtn = document.querySelector(".login-btn");
const loginText = document.querySelector(".login-text");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (userData) {
      window.location.href = "account.html";
    } else {
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.style.display = "block";
    }
  });
}

const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const phoneInput    = document.getElementById("phone");
    const addressInput  = document.getElementById("address");
    const passwordInput = document.getElementById("password");

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

    userData = { username, phone, address, password };
    localStorage.setItem("userData", JSON.stringify(userData));

    showNotification(`Добро пожаловать, ${username}!`);

    const loginModal = document.getElementById("login-modal");
    if (loginModal) loginModal.style.display = "none";

    if (loginText) loginText.textContent = username;

    loginForm.reset();
  });
}

// ──────────────────────────────────────────────
// Чат (Firebase compat)
// ──────────────────────────────────────────────

let messagesRef;

function initChat() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK НЕ ЗАГРУЗИЛСЯ — проверь <script> теги в HTML");
    return;
  }

  console.log("Попытка подключения к Firebase...");

  const firebaseConfig = {
    apiKey: "AIzaSyD-2adAi4ofdKoMdvw2DESVRv5qoEhkim4",
    authDomain: "velosiped-87468.firebaseapp.com",
    databaseURL: "https://velosiped-87468-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "velosiped-87468",
    storageBucket: "velosiped-87468.firebasestorage.app",
    messagingSenderId: "462857607556",
    appId: "1:462857607556:web:07e28b471beb9154baa5d1"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    messagesRef = db.ref("public-chat");

    console.log("УСПЕШНО подключились к Firebase! Слушаем public-chat");

    messagesRef.on("child_added", (snapshot) => {
      console.log("Получено новое сообщение от сервера:", snapshot.val());
      const msg = snapshot.val();
      const container = document.getElementById("chat-messages");
      if (container) {
        const div = document.createElement("div");
        div.className = "chat-message";
        if (msg.username === getUsername()) div.classList.add("own");
        div.innerHTML = `<strong>${msg.username}:</strong> ${msg.text}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      }
    });

    // Тестовое сообщение при подключении (чтобы проверить)
    messagesRef.once("value", (snap) => {
      console.log("Текущая база сообщений:", snap.val() || "пусто");
    });
  } catch (error) {
    console.error("Ошибка подключения к Firebase:", error);
  }
}

function getUsername() {
  const u = JSON.parse(localStorage.getItem("userData")) || {};
  return u.username || "Аноним";
}

const openChatBtn = document.getElementById("open-chat");
const chatModal = document.getElementById("chat-modal");
const closeChatBtn = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-message");
const chatInput = document.getElementById("chat-input");

if (openChatBtn && chatModal) {
  openChatBtn.addEventListener("click", () => {
    chatModal.style.display = "block";
    if (chatInput) chatInput.focus();
  });
}

if (closeChatBtn && chatModal) {
  closeChatBtn.addEventListener("click", () => {
    chatModal.style.display = "none";
  });
}

if (sendBtn && chatInput) {
  sendBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;

    messagesRef.push({
      username: getUsername(),
      text,
      timestamp: Date.now()
    });

    chatInput.value = "";
  });

  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });
}

// ──────────────────────────────────────────────
// Инициализация страницы
// ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  if (userData && loginText) {
    loginText.textContent = userData.username || "Профиль";
  }

  // Закрытие модалки входа
  const loginModal = document.getElementById("login-modal");
  const closeLoginBtn = document.querySelector("#login-modal .close-btn");

  if (closeLoginBtn && loginModal) {
    closeLoginBtn.addEventListener("click", () => {
      loginModal.style.display = "none";
    });
  }

  if (loginModal) {
    loginModal.addEventListener("click", e => {
      if (e.target === loginModal) loginModal.style.display = "none";
    });
  }

  // Рендер корзины, если мы на cart.html
  if (document.getElementById("cart-items")) {
    renderCartPage();
  }

  // Инициализация чата, если элементы есть
  if (document.getElementById("chat-messages")) {
    initChat();
  }
});