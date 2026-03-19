// server.js

const TelegramBot = require("node-telegram-bot-api");
const token = "8530850108:AAEaYOEyBF9NzqoIf_QkRN3OO69Isfk7rNw";
const bot = new TelegramBot(token, { polling: true });

// chatId администратора (твой)
let adminChatId = 1232974371;

let replyTargets = {}; // adminChatId → userChatId


bot.on("message", (msg) => {
  const text = msg.text || "<нет текста>";
  const chatId = msg.chat.id;
  const username = msg.chat.username;

  // Если пишет админ — проверим, отвечает ли он кому-то
  if (chatId === adminChatId && replyTargets[adminChatId]) {
    const target = replyTargets[adminChatId];

    bot.sendMessage(target, `Вам ответили:\n${text}`, {
      reply_to_message_id: replyTargets[target] // если хотим reply
    });

    bot.sendMessage(adminChatId, "Ответ отправлен!");
    delete replyTargets[adminChatId];
    return;
  }

  // Если пишет обычный пользователь — пересылаем админу
  bot.sendMessage(
    adminChatId,
    `Сообщение от ${username ? '@' + username : chatId}:\n${text}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Ответить", callback_data: `reply_${chatId}_${msg.message_id}` }]
        ]
      }
    }
  );
});

bot.on("callback_query", (query) => {
  const data = query.data;

  if (data.startsWith("reply_")) {
    const parts = data.split("_");
    const userChatId = parts[1];
    const messageId = parts[2];

    replyTargets[adminChatId] = userChatId;
    replyTargets[userChatId] = messageId;

    bot.sendMessage(adminChatId, "Введите ответ пользователю:");
  }
});



// Команда /chatid
bot.onText(/\/chatid/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Твой chatId: ${chatId}`);
});

// Команда /message
bot.onText(/\/message (\d+) (.+)/, (msg, match) => {
  const senderId = msg.chat.id;

  // // Проверяем, что команду пишет админ
  // if (senderId !== adminChatId) {
  //   return bot.sendMessage(senderId, "У вас нет прав для этой команды.");
  // }

  const targetChatId = match[1];   // Telegram chatId пользователя
  const textToSend = match[2];     // Сообщение

  bot.sendMessage(targetChatId, "Тебе админ написал " + textToSend)
    .then(() => {
      bot.sendMessage(adminChatId, `Сообщение отправлено пользователю ${targetChatId}`);
    })
    .catch(err => {
      bot.sendMessage(adminChatId, `Ошибка: ${err.message}`);
    });
});


const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Настройка подключения к MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // замени на своего пользователя MySQL
  password: "root",       // замени на свой пароль MySQL
  database: "velosiped" // название базы данных
});

// Проверка подключения
db.connect(err => {
  if (err) {
    console.error("Ошибка подключения к MySQL:", err);
    return;
  }
  console.log("MySQL подключён!");
});

// ──────────────────────────────────────────────
// Регистрация пользователя
// ──────────────────────────────────────────────
app.post("/register", (req, res) => {
  const { username, phone, address, password, ip } = req.body;
  db.query(
    "INSERT INTO users (username, phone, address, password, ip) VALUES (?, ?, ?, ?, ?)",
    [username, phone, address, password, ip],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка регистрации");
      }
      res.send("Пользователь зарегистрирован");
      bot.sendMessage(adminChatId, `Новый пользователь: ${username}`);
    }
  );
});

// ──────────────────────────────────────────────
// Создание заказа
// ──────────────────────────────────────────────
app.post("/order", (req, res) => {
  const { user_id, username, phone, address, items, comment } = req.body;

  // Убираем поле image из каждого товара
  const cleanedItems = items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  // Считаем общую сумму
  const totalPrice = cleanedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Сохраняем заказ в базе
  db.query(
    "INSERT INTO orders (user_id, username, phone, address, items, total_price, comment) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user_id, username, phone, address, JSON.stringify(cleanedItems), totalPrice, comment],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка создания заказа");
      }

      const orderId = result.insertId; // ID только что созданного заказа

      res.send("Заказ сохранён");

      // Формируем сообщение для Telegram
      const tgMessage = `
📞 ПОСТУПИЛ ЗАКАЗ № ${orderId} ОТ ${username || "Гость"} (ID: ${user_id}) 📞
Сумма заказа: ${totalPrice} ₽
Телефон заказчика: ${phone || "Не указан"}
Адрес заказчика: ${address || "Не указан"}
Комментарий к заказу: ${comment || "Без комментария"}
Товары: ${cleanedItems.map(i => `${i.name} x${i.quantity} (${i.price}₽)`).join(", ")}
      `;

      bot.sendMessage(adminChatId, tgMessage);
    }
  );
});

// ──────────────────────────────────────────────
// Получение всех пользователей
// ──────────────────────────────────────────────
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Ошибка получения пользователей");
    }
    res.json(results);
  });
});

// ──────────────────────────────────────────────
// Получение всех заказов
// ──────────────────────────────────────────────
app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Ошибка получения заказов");
    }
    res.json(results);
  });
});

// ──────────────────────────────────────────────
// Чат: сохранение сообщения
// ──────────────────────────────────────────────
app.post("/message", (req, res) => {
  const { user_id, text } = req.body;

  // сначала получаем имя пользователя по его id
  db.query("SELECT username FROM users WHERE id = ?", [user_id], (err, results) => {
    if (err || results.length === 0) {
      console.error(err);
      return res.status(500).send("Ошибка получения имени пользователя");
    }

    const username = results[0].username;

    // сохраняем сообщение вместе с именем
    db.query(
      "INSERT INTO messages (user_id, username, text) VALUES (?, ?, ?)",
      [user_id, username, text],
      (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).send("Ошибка сохранения сообщения");
        }
        res.send("Сообщение сохранено");
      }
    );
  });
});


// ──────────────────────────────────────────────
// Чат: получение всех сообщений
// ──────────────────────────────────────────────
app.get("/messages", (req, res) => {
  db.query("SELECT * FROM messages ORDER BY created_at ASC", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Ошибка получения сообщений");
    }
    res.json(results);
  });
});


// Регистрация/вход по телефону
app.post("/auth", (req, res) => {
  const { phone, password, username, address } = req.body;

  db.query("SELECT * FROM users WHERE phone = ?", [phone], (err, results) => {
    if (err) return res.status(500).send("Ошибка сервера");

    if (results.length === 0) {
  db.query(
    "INSERT INTO users (username, phone, address, password) VALUES (?, ?, ?, ?)",
    [username || "", phone, address || "", password],
    (err2, result) => {
      if (err2) return res.status(500).send("Ошибка регистрации");

      bot.sendMessage(
        adminChatId,
        `Новый пользователь зарегистрирован!\nИмя: ${username || "Без имени"}\nТелефон: ${phone}`
      );

      res.json({ id: result.insertId, phone, username, address });
    }
  );
}
 else {
      // Телефон найден → проверяем пароль
      const user = results[0];
      if (user.password === password) {
        res.json(user); // успешный вход
      } else {
        res.status(401).send("Неверный пароль");
      }
    }
  });
});


// ──────────────────────────────────────────────
// Изменение профиля
// ──────────────────────────────────────────────
// server.js
app.post("/update-profile", (req, res) => {
  const { user_id, username, phone, address } = req.body;

  // Сначала проверяем, нет ли другого пользователя с таким же телефоном
  db.query(
    "SELECT id FROM users WHERE phone = ? AND id != ?",
    [phone, user_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Ошибка проверки телефона" });
      }

      if (results.length > 0) {
        // Телефон уже занят
        return res.status(400).json({ error: "Этот номер телефона уже зарегистрирован" });
      }

      // Если телефон уникален, обновляем профиль
      db.query(
        "UPDATE users SET username = ?, phone = ?, address = ? WHERE id = ?",
        [username, phone, address, user_id],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: "Ошибка обновления профиля" });
          }

          // Возвращаем обновленные данные
          res.json({ id: user_id, username, phone, address });
        }
      );
    }
  );
});



// ──────────────────────────────────────────────
// Запуск сервера
// ──────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
