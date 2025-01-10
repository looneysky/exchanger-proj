const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require("ws");
const bot = require('./telegramBot.js'); // Импортируем бота
const fs = require('fs');

// Подключаем dotenv
require('dotenv').config();

const address = process.env.ADDRESS;
const companyName = process.env.COMPANY_NAME;
const supportAccount = process.env.SUPPORT_ACCOUNT;
const addressInfo = process.env.ADDRESS_INFO;
const jobTime = process.env.JOB_TIME;
const jobTimeInfo = process.env.JOB_TIME_INFO;
const reception = process.env.RECEPTION;
const receptionInfo = process.env.RECEPTION_INFO;

const app = express();
const PORT = 3000;

// Указываем Express использовать EJS
app.set('view engine', 'ejs');

// Указываем директорию для шаблонов
app.set('views', path.join(__dirname, '../public'));

// Используем body-parser для обработки JSON в теле запросов
app.use(bodyParser.json());

// Укажите ID чата, куда отправлять сообщения
const CHAT_ID = process.env.ORDERS_CHAT; // Замените на ID вашего чата

// Функция для генерации случайного пропуска
function generatePassNumber() {
    return Math.floor(1000 + Math.random() * 9000); // Случайное число от 1000 до 9999
}

// Путь к файлу users.json
const usersFilePath = path.resolve(__dirname, '../base/users.json');

// Чтение базы пользователей
function getUsers() {
    if (fs.existsSync(usersFilePath)) {
        return JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
    }
    return {};
}

// Сохранение обновленных данных в файл
function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

// Настраиваем раздачу статических файлов
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Обработчик маршрута для корня (выдача index.html)
app.get('/', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('index', { address, companyName, supportAccount }); // Передаем переменные в шаблон
});

// Обработчик маршрута для history
app.get('/history', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('history', { address, companyName }); // Передаем переменные в шаблон
});

// Обработчик маршрута для buy
app.get('/buy', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('buy', { address, companyName }); // Передаем переменные в шаблон
});

// Обработчик маршрута для sell
app.get('/sell', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('sell', { address, companyName }); // Передаем переменные в шаблон
});

// Обработчик маршрута для terms
app.get('/terms', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('terms', { address, companyName }); // Передаем переменные в шаблон
});

// Обработчик маршрута для address
app.get('/address', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('address', { address, companyName, addressInfo, jobTime, jobTimeInfo, reception, receptionInfo }); // Передаем переменные в шаблон
});

// Обработчик маршрута для aml-policy
app.get('/aml-policy', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('aml-policy', { address, companyName }); // Передаем переменные в шаблон
});

// Обработчик маршрута для privacy-policy
app.get('/privacy-policy', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('privacy-policy', { address, companyName }); // Передаем переменные в шаблон
});

// Обработчик маршрута для risk
app.get('/risk', (req, res) => {
    const address = process.env.ADDRESS;
    const companyName = process.env.COMPANY_NAME;
    res.render('risk', { address, companyName }); // Передаем переменные в шаблон
});

// Middleware для базовой авторизации
const basicAuth = (req, res, next) => {
    const auth = req.headers['authorization'];

    if (!auth) {
        // Запрос авторизации
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authorization required');
    }

    // Декодирование Base64 (пользователь:пароль)
    const [login, password] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');

    // Проверка пользователя и пароля
    if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
        return next();
    }

    // Если авторизация не прошла
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Invalid credentials');
};

// Обработчик маршрута для корня (выдача index.html)
app.get('/admin/referral', basicAuth, (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

// API-эндпоинт для получения всех пользователей
app.get('/api/users', (req, res) => {
    try {
        const users = getUsers();
        res.json({
            success: true,
            users,
        });
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить пользователей.',
        });
    }
});

// Путь к orders.json
const ordersFilePath = path.join(__dirname, '../base/orders.json');

// Функция для записи заявки
function saveOrderToFile(order) {
    // Читаем существующие заказы
    fs.readFile(ordersFilePath, 'utf8', (err, data) => {
        let orders = [];
        if (!err && data) {
            try {
                orders = JSON.parse(data);
            } catch (parseError) {
                console.error('Ошибка парсинга JSON:', parseError);
            }
        }

        // Добавляем новый заказ
        orders.push(order);

        // Записываем обновлённые данные обратно в файл
        fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 4), (writeErr) => {
            if (writeErr) {
                console.error('Ошибка записи в файл:', writeErr);
            } else {
                console.log('Заявка успешно записана в файл.');
            }
        });
    });
}

// Обработчик маршрута /buy
app.post('/api/buy', (req, res) => {
    const { amount, network, walletAddress, firstName, lastName, middleName, userId, course } = req.body;

    if (!amount || !network || !walletAddress || !firstName || !lastName) {
        return res.status(400).send({ error: 'Все поля должны быть заполнены.' });
    }

    // Получаем текущие данные пользователей
    const users = getUsers();

    // Находим пользователя по userId
    const user = users[userId];

    if (user) {
        // Получаем бонус пользователя
        let bonus = user.bonus;

        // Уменьшаем бонус в зависимости от его типа
        if (bonus !== 0) {
            if (Number.isInteger(bonus)) {
                user.bonus = bonus - 1; // Если бонус целое число, уменьшаем на 1
            } else {
                user.bonus = (bonus - 0.1).toFixed(1); // Если бонус нецелое число, уменьшаем на 0.1
            }
            saveUsers(users); // Сохраняем обновленные данные
        }
    } else {
        console.error("User not found!");
    }

    const passNumber = generatePassNumber();
    const message = `
🔔 Новый запрос на покупку USDT

👤 Покупатель: ${lastName} ${firstName} ${middleName || ''}
💵 Сумма: ${amount} USDT
🌐 Сеть: ${network}
📥 Адрес кошелька: ${walletAddress}

Курс: ${course}

Telegram: [${firstName}](tg://user?id=${userId})

⏳ Проверьте запрос и подтвердите!
    `;

    bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" })
        .then(() => {
            // Сохраняем заявку в файл
            saveOrderToFile({
                userId,
                timestamp: new Date().toISOString(),
                orderType: 'buy',
                amount: parseFloat(amount),
            });

            res.status(200).send({
                message: 'Запрос успешно отправлен в Telegram!',
                passNumber: passNumber,
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send({
                error: 'Не удалось отправить сообщение в Telegram.',
                passNumber: passNumber,
            });
        });
});

// Обработчик маршрута /sell
app.post('/api/sell', (req, res) => {
    const { network, firstName, lastName, middleName, userId } = req.body;

    if (!network || !firstName || !lastName) {
        return res.status(400).send({ error: 'Все поля должны быть заполнены.' });
    }

    const passNumber = generatePassNumber();
    const message = `
🔔 Новый запрос на продажу USDT

👤 Продавец: ${lastName} ${firstName} ${middleName || ''}
🌐 Сеть: ${network}

Telegram: [${firstName}](tg://user?id=${userId})

⏳ Проверьте запрос и подтвердите!
  `;

    bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" })
        .then(() => {
            // Сохраняем заявку в файл
            saveOrderToFile({
                userId,
                timestamp: new Date().toISOString(),
                orderType: 'sell',
                amount: null, // Указываем null, если поле amount отсутствует
            });

            res.status(200).send({
                message: 'Запрос успешно отправлен в Telegram!',
                passNumber: passNumber,
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send({
                error: 'Не удалось отправить сообщение в Telegram.',
                passNumber: passNumber,
            });
        });
});

app.get('/api/orders/:userId', (req, res) => {
    const { userId } = req.params;

    // Путь к файлу с заказами
    const ordersFilePath = path.join(__dirname, '../base/orders.json');

    // Чтение файла orders.json
    fs.readFile(ordersFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Ошибка чтения файла:', err);
            return res.status(500).send({ error: 'Ошибка сервера. Не удалось прочитать заказы.' });
        }

        try {
            // Парсинг JSON
            const orders = JSON.parse(data);

            // Фильтрация заказов по userId
            const userOrders = orders.filter(order => order.userId === parseInt(userId, 10));

            // Возвращаем результат
            return res.status(200).send(userOrders);
        } catch (parseError) {
            console.error('Ошибка парсинга JSON:', parseError);
            return res.status(500).send({ error: 'Ошибка сервера. Невалидный формат данных заказов.' });
        }
    });
});

// Экспортируем приложение для использования в других модулях
module.exports = app;

// Запуск сервера (если модуль запускается напрямую)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
}
