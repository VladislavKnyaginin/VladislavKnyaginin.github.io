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
  const el = document.getElementById("cart-count");
  if (el) el.textContent = count;
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

  const qtyEl = card.querySelector(".quantity");
  const removeBtn = card.querySelector(".remove-from-cart");
  if (qtyEl) {
    qtyEl.textContent = existing ? existing.quantity : 1;
    qtyEl.style.display = "inline-block";
  }
  if (removeBtn) removeBtn.style.display = "inline-block";
}

function removeFromCart(productId, card) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity--;
    const qtyEl = card.querySelector(".quantity");
    const removeBtn = card.querySelector(".remove-from-cart");

    if (existing.quantity > 0) {
      if (qtyEl) qtyEl.textContent = existing.quantity;
    } else {
      cart = cart.filter(item => item.id !== productId);
      if (qtyEl) qtyEl.style.display = "none";
      if (removeBtn) removeBtn.style.display = "none";
      if (qtyEl) qtyEl.textContent = "0";
    }
    updateCart();
    updateCartCount();
    showNotification(`${existing.name} удалён из корзины`);
  }
}

// Навешивание обработчиков на товары
document.querySelectorAll(".product-card").forEach(card => {
  const product = {
    id: card.dataset.id,
    name: card.dataset.name,
    price: parseFloat(card.dataset.price),
    image: card.querySelector("img").src
  };

  const addBtn = card.querySelector(".add-to-cart");
  const removeBtn = card.querySelector(".remove-from-cart");
  const qtyEl = card.querySelector(".quantity");

  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    if (qtyEl) {
      qtyEl.textContent = existing.quantity;
      qtyEl.style.display = "inline-block";
    }
    if (removeBtn) removeBtn.style.display = "inline-block";
  } else {
    if (qtyEl) qtyEl.style.display = "none";
    if (removeBtn) removeBtn.style.display = "none";
  }

  if (addBtn) addBtn.addEventListener("click", () => addToCart(product, card));
  if (removeBtn) removeBtn.addEventListener("click", () => removeFromCart(product.id, card));
});

// Кнопка корзины → переход на cart.html
const cartBtn = document.querySelector(".cart-btn");
if (cartBtn) {
  cartBtn.addEventListener("click", () => {
    window.location.href = "cart.html";
  });
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
      const modal = document.getElementById("login-modal");
      if (modal) modal.style.display = "block";
    }
  });
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const phone    = document.getElementById("phone")?.value.trim();
    const address  = document.getElementById("address")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!username || !phone || !address || !password) {
      showNotification("Заполните все поля");
      return;
    }

    userData = { username, phone, address, password };
    localStorage.setItem("userData", JSON.stringify(userData));

    showNotification(`Добро пожаловать, ${username}!`);

    const modal = document.getElementById("login-modal");
    if (modal) modal.style.display = "none";

    if (loginText) loginText.textContent = username;

    loginForm.reset();
  });
}

// ──────────────────────────────────────────────
// Чат с Firebase
// ──────────────────────────────────────────────

function getUsername() {
  const u = JSON.parse(localStorage.getItem("userData")) || {};
  return u.username || "Аноним";
}

function initChat() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK не загружен");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyD-2adAi4ofdKoMdvw2DESVRv5qoEhkim4",
    authDomain: "velosiped-87468.firebaseapp.com",
    databaseURL: "https://velosiped-87468-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "velosiped-87468",
    storageBucket: "velosiped-87468.firebasestorage.app",
    messagingSenderId: "462857607556",
    appId: "1:462857607556:web:07e28b471beb9154baa5d1"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const messagesRef = db.ref("public-chat");

  const container = document.getElementById("chat-messages");
  if (!container) {
    console.warn("Элемент #chat-messages не найден");
    return;
  }

  messagesRef.on("child_added", snapshot => {
    const msg = snapshot.val();
    const div = document.createElement("div");
    div.className = "chat-message";
    if (msg.username === getUsername()) div.classList.add("own");
    div.innerHTML = `<strong>${msg.username}:</strong> ${msg.text}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
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

  // Чат — навешиваем события и инициализируем
  const openBtn   = document.getElementById("open-chat");
  const modal     = document.getElementById("chat-modal");
  const closeBtn  = document.getElementById("close-chat");
  const sendBtn   = document.getElementById("send-message");
  const input     = document.getElementById("chat-input");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      modal.style.display = "block";
      if (input) input.focus();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) return;

      const messagesRef = firebase.database().ref("public-chat");
      messagesRef.push({
        username: getUsername(),
        text,
        timestamp: Date.now()
      });

      input.value = "";
    });

    input.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }

  // Запуск чата, если элементы есть
  if (document.getElementById("chat-messages")) {
    initChat();
  }
});
