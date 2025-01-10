// telegramBot.js
const QRCode = require('qrcode');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Подключаем dotenv
require('dotenv').config();

// Получите свой токен от BotFather на Telegram
const token = process.env.BOT_TOKEN; // Замените на ваш токен

// Создайте экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Путь к файлу users.json
const usersFilePath = path.resolve(__dirname, '../base/users.json');

// Чтение базы пользователей
function getUsers() {
  if (fs.existsSync(usersFilePath)) {
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
  }
  return {};
}

// Генерация QR-кода с ссылкой
function generateQRCode(link, filePath) {
  return new Promise((resolve, reject) => {
    QRCode.toFile(filePath, link, {
      width: 1000,  // Устанавливаем размер изображения 1000x1000
    }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Запись в базу пользователей
function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

// Обработчик команды /start
bot.onText(/\/start(?: (\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const referrerId = match[1] ? parseInt(match[1], 10) : null;

  let users = getUsers();

  // Проверяем, есть ли пользователь в базе
  if (!users[chatId]) {
    users[chatId] = {
      id: chatId,
      referrals: 0,
      bonus: 0,
      referral: 0,
    };
  }

  // Если пользователь указал реферальный ID
  if (referrerId && referrerId !== chatId) {
    const currentUser = users[chatId];

    // Проверяем, не установлен ли уже реферал
    if (!currentUser.referral) {
      // Проверяем, существует ли реферальный пользователь
      if (users[referrerId]) {
        currentUser.referral = referrerId;
        currentUser.bonus = 1;
        users[referrerId].referrals += 1;
        users[referrerId].bonus += 0.1;

        bot.sendMessage(chatId, `Вы указали реферальный код ${referrerId}. Спасибо!`);
        bot.sendMessage(referrerId, `У вас новый реферал! Общее количество: ${users[referrerId].referrals}`);
      } else {
        bot.sendMessage(chatId, `Реферальный код ${referrerId} не найден.`);
      }
    } else {
      bot.sendMessage(chatId, `Вы уже указали реферальный код ${currentUser.referral}.`);
    }
  }

  saveUsers(users);

  bot.sendMessage(chatId, `Добро пожаловать в ${process.env.COMPANY_NAME}!

📍 Адрес: ${process.env.ADDRESS}
    
📅 Работаем круглосуточно, без перерывов и выходных.
    
💵 Обмен только за наличные рубли.
    
💹 Предлагаем лучший курс покупки USDT и самый выгодный курс на продажу USDT в Москве.
    
🤑 Никаких комиссий на покупку и продажу USDT.
    
Чтобы приобрести USDT, нажмите кнопку "Обмен".`, {
    reply_markup: {
      keyboard: [
        [{ text: "💸 Реферальная система" }], // Кнопка на первой строке
        [
          { text: "ℹ️ О нас" }, // Первая кнопка на второй строке
          { text: "📞 Поддержка" } // Вторая кнопка на второй строке
        ],
        [
          { text: "💱 Курс" }
        ]
      ],
      resize_keyboard: true, // Клавиатура адаптируется под экран
      one_time_keyboard: false // Клавиатура остаётся после нажатия
    }
  });
});

// Обработчик любых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  let users = getUsers();

  // Проверяем, есть ли пользователь в базе
  if (!users[chatId]) {
    users[chatId] = {
      id: chatId,
      referrals: 0,
      bonus: 0,
      referral: 0,
    };
    saveUsers(users);
  }

  if (text === "💸 Реферальная система") {
    const users = getUsers();
    const user = users[userId]; // Ищем пользователя по ID

    if (user) {
      const referralCount = user.referrals || 0;
      const bonus = user.bonus || 0;
      const referralId = user.referral || "Нет реферала";

      let skidka;

      if (bonus === 0) {
        skidka = 0; // Если бонус 0
      } else if (Number.isInteger(bonus)) {
        skidka = 0.3; // Если целое число
      } else {
        skidka = 0.1; // Если не целое число
      }

      // Генерируем ссылку
      const referralLink = process.env.BOT_URL + "?start=" + userId;

      // Путь для сохранения QR-кода
      const qrFilePath = path.join(__dirname, 'qr-codes', `${userId}_referral_qr.png`);

      // Генерация QR-кода
      generateQRCode(referralLink, qrFilePath)
        .then(() => {
          // Отправляем изображение с подписью
          bot.sendPhoto(userId, qrFilePath, {
            caption: `📊 Статистика рефералов:\nРефералов: *${referralCount}*\nСкидка: *${skidka}*\n\nВаша реферальная ссылка: \`${referralLink}\`\n\nЗа каждого реферала получаете - 10 копеек скидку\nЗа переход по ссылке - 30 копеек скидка.`,
            parse_mode: 'Markdown' // Используем MarkdownV2 для форматирования
          }).then(() => {
            // После отправки изображения можно удалить его, чтобы не занимать место
            fs.unlinkSync(qrFilePath);
          }).catch((error) => {
            console.error("Ошибка при отправке изображения:", error);
          });
        })
        .catch((error) => {
          console.error("Ошибка при генерации QR-кода:", error);
        });
    } else {
      bot.sendMessage(chatId, "Пользователь с таким ID не найден.");
    }
  } else if (text === "ℹ️ О нас") {
    bot.sendMessage(chatId, `🤖 О нас

Добро пожаловать в наш бот для обмена криптовалюты!

💰 Мы занимаемся обменом криптовалют более 3х лет.

📅 Мы работаем для вас 24/7.

💵 Мы работаем только за наличные рубли.

💹 У нас вы можете купить USDT без комиссии по самому лучшему курсу в Москве.  

Наш адрес: ${process.env.ADDRESS}

Для получения пропуска к нам в офис и покупки USDT, вам нужно создать заявку через приложение`);
  } else if (text === "📞 Поддержка") {
    bot.sendMessage(chatId, `Наши операторы на связи 24/7 и готовы ответить на любые ваши вопросы.

Для связи с нами напишите - ${process.env.SUPPORT_ACCOUNT}

Для получения пропуска к нам в офис и покупки USDT, вам нужно создать заявку - нажмите на кнопку "Обмен"`);
  } else if (text === "💱 Курс") {
    axios.get("https://mosca.moscow/api/v1/rate/", {
      headers: {
        "access-token": "pLKHNguNDKifklXVqV1N8XVTHXj_MdocKF6kJFdF8fOXkolyScLaI6zeX1ShxE3YqGT_bWcbxzIC7pg3QnYNKw"
      }
    })
      .then(response => {
        const data = response.data;
        console.log('API Response:', data); // Добавьте логирование для отладки

        if (data.buy && data.sell) {
          bot.sendMessage(chatId, `💸 *Курс обмена* 💸\n\n🔼 Курс покупки: *${data.buy} ₽*\n🔽 Курс продажи: *${data.sell} ₽*\n\n💰 Обменяйте прямо сейчас!`);
        } else {
          console.error("Sell course data not found!");
          bot.sendMessage(chatId, "❌ Не удалось получить курс.");
        }
      })
      .catch(error => {
        console.error("Error fetching course:", error);
        bot.sendMessage(chatId, "⚠️ Ошибка при запросе курса. Попробуйте позже.");
      });
  }
});

// Экспортируем бот для использования в других скриптах
module.exports = bot;
