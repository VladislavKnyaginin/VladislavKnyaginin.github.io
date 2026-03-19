
let userData = null; // теперь берём из базы, а не из localStorage
const modal = document.getElementById("login-modal");
const closeBtn = modal?.querySelector(".close-btn");

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// ──────────────────────────────────────────────
// Уведомления
// ──────────────────────────────────────────────
function showNotification(message, isError = false) {
  const notif = document.createElement("div");
  notif.className = "notification";
  if (isError) notif.style.background = "#dc3545";
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("visible"), 50);
  setTimeout(() => {
    notif.classList.remove("visible");
    setTimeout(() => notif.remove(), 400);
  }, isError ? 4000 : 2200);
}

// ──────────────────────────────────────────────
// Корзина
// ──────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCartPage();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cart-count").forEach(el => {
    el.textContent = count;
  });
}

function addToCart(product, card) {
  let existing = cart.find(item => Number(item.id) === Number(product.id));
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
    existing = cart[cart.length - 1];
  }
  updateCart();
  showNotification(`${product.name} добавлен в корзину`);

  const quantityEl = card.querySelector(".quantity");
  const removeBtn = card.querySelector(".remove-from-cart");
  if (quantityEl) {
    quantityEl.textContent = existing.quantity;
    quantityEl.style.display = "inline-block";
  }
  if (removeBtn) removeBtn.style.display = "inline-block";

  
  animateToCart(card);

}

function animateToCart(card) {
  const img = card.querySelector("img");
  const cartBtn = document.querySelector(".cart-btn"); // сама кнопка корзины

  if (!img || !cartBtn) return;

  const imgRect = img.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  // создаём копию картинки
  const flyingImg = img.cloneNode(true);
  flyingImg.style.position = "fixed";
  flyingImg.style.left = imgRect.left + "px";
  flyingImg.style.top = imgRect.top + "px";
  flyingImg.style.width = imgRect.width + "px";
  flyingImg.style.height = imgRect.height + "px";
  flyingImg.style.transition = "all 0.8s ease-in-out";
  flyingImg.style.zIndex = 9999;
  document.body.appendChild(flyingImg);

  // запускаем анимацию
  requestAnimationFrame(() => {
    flyingImg.style.left = cartRect.left + cartRect.width / 2 + "px";
    flyingImg.style.top = cartRect.top + cartRect.height / 2 + "px";
    flyingImg.style.width = "20px";
    flyingImg.style.height = "20px";
    flyingImg.style.opacity = "0.3";
  });

  // удаляем после анимации
  setTimeout(() => flyingImg.remove(), 900);
}


function removeFromCart(productId, card) {
  let existing = cart.find(item => item.id === productId);
  if (!existing) return;
  existing.quantity--;
  if (existing.quantity <= 0) {
    cart = cart.filter(item => item.id !== productId);
    card.querySelector(".quantity").style.display = "none";
    card.querySelector(".remove-from-cart").style.display = "none";
  } else {
    card.querySelector(".quantity").textContent = existing.quantity;
  }
  updateCart();
  showNotification(`${existing.name} убран из корзины`);
}

function renderCartPage() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const orderForm = document.getElementById("order-form");
  const submitBtn = document.getElementById("submit-order-btn");

  if (!container) return;

  cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    container.innerHTML = "<p class='empty-cart'>Корзина пуста</p>";
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
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-details">${item.price} ₽</div>
          <div class="cart-controls">
            <button class="remove-from-cart">–</button>
            <span class="quantity">${item.quantity}</span>
            <button class="add-to-cart">+</button>
          </div>
        </div>
        <div class="cart-item-total">${itemTotal} ₽</div>
      </div>
    `;
  }).join("");

  if (totalEl) totalEl.innerHTML = `<strong>Итого: ${total} ₽</strong>`;

  // Кнопки +/- для каждой карточки
  document.querySelectorAll(".cart-item").forEach(card => {
    const id = Number(card.dataset.id);
    const product = cart.find(item => Number(item.id) === id);
    const addBtn = card.querySelector(".add-to-cart");
    const removeBtn = card.querySelector(".remove-from-cart");
    const quantityEl = card.querySelector(".quantity");

    if (addBtn) addBtn.onclick = () => { product.quantity++; updateCart(); };
    if (removeBtn) removeBtn.onclick = () => {
      product.quantity--;
      if (product.quantity <= 0) cart = cart.filter(i => Number(i.id) !== id);
      updateCart();
    };
  });

  // Привязываем форму **один раз** при загрузке
  if (orderForm && submitBtn && !orderForm.dataset.bound) {
    orderForm.dataset.bound = "true"; // чтобы не привязывать второй раз
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        showNotification("Корзина пуста", true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Оформляем...";

      const order = {
  user_id: userData?.id || 0,  // 0 = гость
  items: cart,
  comment: document.getElementById("comment")?.value.trim() || "",
  username: document.getElementById("username")?.value.trim() || "Гость",
  phone: document.getElementById("phone")?.value.trim() || "",
  address: document.getElementById("address")?.value.trim() || ""
};

      try {
        const res = await fetch("http://localhost:3000/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Ошибка при отправке заказа");
        }

        const msg = await res.text();
        showNotification(msg || "Заказ успешно отправлен");

        cart = [];
        localStorage.setItem("cart", "[]");
        updateCart();
        orderForm.reset();
      } catch (err) {
        console.error(err);
        showNotification(err.message || "Ошибка при отправке заказа", true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Подтвердить заказ";
      }
    });
  }

  // Автозаполнение формы заказа, если пользователь вошёл
if (orderForm && userData) {
  const nameInput = document.getElementById("username");
  const phoneInput = document.getElementById("phone");
  const addressInput = document.getElementById("address");

  if (nameInput && userData.username) {
    nameInput.value = userData.username;
  }
  if (phoneInput && userData.phone) {
    phoneInput.value = userData.phone;
  }
  if (addressInput && userData.address) {
    addressInput.value = userData.address;
  }
}

}

// ──────────────────────────────────────────────
// Привязка событий к карточкам товаров
// ──────────────────────────────────────────────
document.querySelectorAll(".product-card").forEach(card => {
  const product = {
    id: card.dataset.id,
    name: card.dataset.name,
    price: parseFloat(card.dataset.price),
    image: card.querySelector("img").src
  };
  const addBtn = card.querySelector(".add-to-cart");
  const removeBtn = card.querySelector(".remove-from-cart");
  const quantityEl = card.querySelector(".quantity");

  if (removeBtn) removeBtn.style.display = "none";
  if (quantityEl) {
    quantityEl.style.display = "none";
    quantityEl.textContent = "0";
  }

  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    quantityEl.textContent = existing.quantity;
    quantityEl.style.display = "inline-block";
    removeBtn.style.display = "inline-block";
  }

  if (addBtn) addBtn.onclick = () => addToCart(product, card);
  if (removeBtn) removeBtn.onclick = () => removeFromCart(product.id, card);
});

// ──────────────────────────────────────────────
// Логика кнопки "Профиль" и регистрация
// ──────────────────────────────────────────────
document.querySelectorAll(".login-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (userData) {
      if (userData.username === "Admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "account.html";
      }
    } else {
      const modal = document.getElementById("login-modal");
      if (modal) modal.style.display = "block";
    }
  });
});

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.onsubmit = async function(e) {
    e.preventDefault();

    const phone = document.getElementById("phone")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const username = document.getElementById("username")?.value.trim();
    const address = document.getElementById("address")?.value.trim();

    if (!phone || !password) {
      showNotification("Введите телефон и пароль", true);
      return;
    }

    fetch("http://localhost:3000/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, username, address })
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) throw new Error("Неверный пароль");
        throw new Error("Ошибка авторизации");
      }
      return res.json();
    })
    .then(user => {
      localStorage.setItem("userData", JSON.stringify(user));
      userData = user;
      document.querySelectorAll(".login-text").forEach(el => {
        el.textContent = user.username || "Профиль";
      });
      const modal = document.getElementById("login-modal");
      if (modal) modal.style.display = "none";
      loginForm.reset();
      showNotification("Вы вошли как " + (user.username || "Пользователь"));
    })
    .catch(err => {
      showNotification(err.message, true);
      console.error("Ошибка входа/регистрации:", err);
    });
  };
}

// Автовход при загрузке
document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("userData");
  if (savedUser) {
    userData = JSON.parse(savedUser);
    document.querySelectorAll(".login-text").forEach(el => {
      el.textContent = userData.username || "Профиль";
    });
  }
});

// ──────────────────────────────────────────────
// Чат (через сервер вместо Firebase)
// ──────────────────────────────────────────────
function sendMessage() {
  const text = document.getElementById("chat-input")?.value.trim();
  if (!text) return;

  fetch("http://localhost:3000/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userData?.id || 1, // временно можно 1
      text
    })
  })
  .then(res => res.text())
  .then(msg => {
    showNotification("Сообщение отправлено");
    document.getElementById("chat-input").value = "";
    loadMessages();
  })
  .catch(err => console.error("Ошибка отправки сообщения:", err));
}

function loadMessages() {
  fetch("http://localhost:3000/messages")
    .then(res => res.json())
    .then(messages => {
      const chatMessages = document.getElementById("chat-messages");
      if (!chatMessages) return;
      chatMessages.innerHTML = "";
      messages.forEach(m => {
        const div = document.createElement("div");
        div.className = "chat-message";
        if (m.user_id === userData?.id) div.classList.add("own");
        div.textContent = `${m.username || "Пользователь"}: ${m.text}`;
        chatMessages.appendChild(div);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(err => console.error("Ошибка загрузки сообщений:", err));
}


// Привязка кнопок чата
const chatModal = document.getElementById("chat-modal");
const openChatBtn = document.getElementById("open-chat");
const closeChatBtn = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-message");

if (openChatBtn && chatModal) {
  openChatBtn.onclick = () => {
    chatModal.style.display = "block";
    loadMessages();
    document.getElementById("chat-input").focus();
  };
}
if (closeChatBtn && chatModal) {
  closeChatBtn.onclick = () => {
    chatModal.style.display = "none";
  };
}
if (sendBtn) {
  sendBtn.onclick = sendMessage;
  document.getElementById("chat-input").onkeypress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };
}

// ──────────────────────────────────────────────
// Живой поиск по товарам
// ──────────────────────────────────────────────
function initSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  const productsSection = document.querySelector("#products") || document.querySelector(".products");
  if (!productsSection) return;

  const productsContainer = productsSection.querySelector(".products") || productsSection;
  const allCards = Array.from(productsContainer.querySelectorAll(".product-card"));

  let noResultsMessage = document.getElementById("no-results-message");
  if (!noResultsMessage) {
    noResultsMessage = document.createElement("div");
    noResultsMessage.id = "no-results-message";
    noResultsMessage.textContent = "Пока что такого у нас нет((( Напишите в поддержку чтоб это добавили!!!";
    noResultsMessage.style.cssText = `
      text-align: center;
      font-size: 1.3rem;
      color: #dc3545;
      margin: 3rem 0;
      padding: 2rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      display: none;
    `;
    productsContainer.parentNode.insertBefore(noResultsMessage, productsContainer.nextSibling);
  }

  let wasEmpty = true;
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    const isEmptyNow = query === "";
    if (wasEmpty && !isEmptyNow && productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasEmpty = isEmptyNow;

    let visibleCount = 0;
    allCards.forEach(card => {
      const name = (card.dataset.name || "").toLowerCase();
      if (isEmptyNow || name.includes(query)) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });
    noResultsMessage.style.display = (visibleCount === 0 && !isEmptyNow) ? "block" : "none";
  });
}


// ──────────────────────────────────────────────
// Кнопка корзины
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = "cart.html";
    });
  });
});


// ──────────────────────────────────────────────
// Инициализация при загрузке страницы
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  document.querySelectorAll(".login-text").forEach(el => {
    if (userData) el.textContent = userData.username || "Профиль";
  });
  if (document.getElementById("cart-items")) {
    renderCartPage();
  }
  initSearch();
  setInterval(loadMessages, 3000); // каждые 3 секунды обновляем чат
});



// ──────────────────────────────────────────────
// Логика открытия карточек
// ──────────────────────────────────────────────
const modal1 = document.getElementById('product-modal');

const products = {
  1: {
    name: "Молоко 3.2% 1 л",
    price: "85 ₽",
    image: "products/milk.jpg",
    description: "Свежее молоко 3.2%"
  },
  2: {
    name: "Хлебушек",
    price: "53 ₽",
    image: "products/bread.png",
    description: "Свежий хлеб"
  }
};

// открытие
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.cart-controls')) return;

    const name = card.dataset.name;
    const price = card.dataset.price + " ₽";
    const image = card.querySelector("img").src;

    modal1.dataset.id = card.dataset.id;

    const modal = document.getElementById('product-modal');
    const modalImg = document.getElementById('modal-image');

    document.getElementById('modal-title').textContent = name;
    document.getElementById('modal-price').textContent = price;
    modalImg.src = image;
    document.getElementById('modal-description').textContent = "Описание скоро будет";

    // 📍 АНИМАЦИЯ ИЗ КАРТОЧКИ
    const rect = card.getBoundingClientRect();

    modal.style.display = 'flex';

    const content = modal.querySelector('.product-modal-content');

    content.style.transform = `
      translate(${rect.left}px, ${rect.top}px) scale(0.3)
    `;
    content.style.opacity = "0";

    requestAnimationFrame(() => {
      modal.classList.add('active');

      content.style.transform = "translate(0,0) scale(1)";
      content.style.opacity = "1";
    });
  });
});

// закрытие
function closeModal() {
  const modal = document.getElementById('product-modal');
  const content = modal.querySelector('.product-modal-content');

  content.style.transform = "scale(0.7) translateY(40px)";
  content.style.opacity = "0";

  modal.classList.remove('active');

  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

document.querySelector('.close-modal').onclick = closeModal;
document.querySelector('.product-modal-overlay').onclick = closeModal;


// ──────────────────────────────────────────────
// Добавление в корзину из модалки (ИСПРАВЛЕННАЯ ВЕРСИЯ)
// ──────────────────────────────────────────────
const modalAddBtn = document.querySelector('.add-to-cart-btn');

if (modalAddBtn) {
  modalAddBtn.addEventListener('click', () => {
  const id = Number(modal1.dataset.id);
  const title = document.getElementById('modal-title').textContent;
  const priceText = document.getElementById('modal-price').textContent;
  const image = document.getElementById('modal-image').src;

  const price = parseInt(priceText.replace(/\D/g,''));

  const product = { id, name: title, price, image };

  let existing = cart.find(item => Number(item.id) === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
    existing = cart[cart.length - 1]; // чтобы получить объект для DOM
  }

  updateCart();
  showNotification("Товар добавлен в корзину");

  // 🔹 Обновляем видимость и количество на карточке товара
  const card = document.querySelector(`.product-card[data-id="${id}"]`);
if (card) {
  const quantityEl = card.querySelector(".quantity");
  const removeBtn = card.querySelector(".remove-from-cart");
  const addBtn = card.querySelector(".add-to-cart");

  if (quantityEl) {
    quantityEl.textContent = existing.quantity;
    quantityEl.style.display = "inline-block";
  }
  if (removeBtn) removeBtn.style.display = "inline-block";
  if (addBtn) addBtn.style.display = "inline-block";

  // 🔹 Обновляем обработчики кнопок, чтобы они ссылались на актуальный объект в cart
  addBtn.onclick = () => addToCart(existing, card);
  removeBtn.onclick = () => removeFromCart(existing.id, card);
}
  // Закрываем модалку
  modal1.classList.remove('active');
  setTimeout(() => modal1.style.display = 'none', 300);
});
}