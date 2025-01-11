document.addEventListener("DOMContentLoaded", () => {
    const courseElement = document.getElementById("course");
    const userId = window.Telegram.WebApp.initDataUnsafe.user.id; // Получаем userId
    let skidka = 0;

    // Запрашиваем данные с http://localhost:3000/api/users
    fetch("/api/users", {
        method: "GET",
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Находим пользователя по userId
            const user = data.users[userId];

            // Если пользователь найден, проверяем бонус и рассчитываем скидку
            if (user) {
                const bonus = user.bonus;

                if (bonus === 0) {
                    skidka = 0; // Если бонус 0
                } else if (Number.isInteger(bonus)) {
                    skidka = 0.03; // Если целое число
                } else {
                    skidka = 0.01; // Если не целое число
                }

                console.log(`User bonus: ${bonus}, Discount: ${skidka}`);
            } else {
                console.error("User not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });

    // Запрашиваем курс с https://mosca.moscow/api/v1/rate/
    fetch("https://mosca.moscow/api/v1/rate/", {
        method: "GET",
        headers: {
            "access-token": `pLKHNguNDKifklXVqV1N8XVTHXj_MdocKF6kJFdF8fOXkolyScLaI6zeX1ShxE3YqGT_bWcbxzIC7pg3QnYNKw`,
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Проверяем наличие данных
            if (data.buy) {
                const buyRate = data.sell; // Курс для покупки
                const finalRate = buyRate - skidka; // Применяем скидку к курсу
                courseElement.textContent = `Купить USDT - Курс ${finalRate.toFixed(2)}₽`; // Обновляем текст с курсом с учетом скидки

                const form = document.querySelector("form");
                const submitButton = form.querySelector("button[type='submit']");
                const inputs = form.querySelectorAll("input");
                const termsCheckbox = form.querySelector("input[name='terms_of_conditions']");

                const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
                console.log(userId)

                // Обработчик проверки формы
                function validateForm() {
                    const formData = new FormData(form);
                    const amount = formData.get("buy_amount");
                    const network = formData.get("buy_networkId");
                    const walletAddress = formData.get("buy_address");
                    const lastName = formData.get("buy_lastName");
                    const firstName = formData.get("buy_firstName");
                    const agreeToTerms = termsCheckbox.checked;

                    // Проверка всех обязательных полей
                    const isValid =
                        amount && !isNaN(amount) && Number(amount) > 0 &&
                        network &&
                        walletAddress &&
                        lastName &&
                        firstName &&
                        agreeToTerms;

                    // Активация или деактивация кнопки
                    submitButton.disabled = !isValid;
                    return isValid;
                }

                // Слушаем изменения в полях формы
                inputs.forEach((input) => {
                    input.addEventListener("input", validateForm);
                });

                termsCheckbox.addEventListener("change", validateForm);

                // Отправка данных
                form.addEventListener("submit", function (e) {
                    e.preventDefault(); // Предотвращаем стандартное поведение

                    if (!validateForm()) {
                        alert("Пожалуйста, заполните все обязательные поля.");
                        return;
                    }

                    // Формируем объект для отправки
                    const formData = new FormData(form);
                    const data = {
                        amount: formData.get("buy_amount"),
                        network: formData.get("buy_networkId"),
                        walletAddress: formData.get("buy_address"),
                        lastName: formData.get("buy_lastName"),
                        firstName: formData.get("buy_firstName"),
                        middleName: formData.get("buy_middleName") || "",
                        agreeToTerms: termsCheckbox.checked,
                        userId: userId,
                        course: finalRate
                    };

                    // Отправляем данные через fetch
                    fetch("/api/buy", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data),
                    })
                        .then((response) => {
                            if (response.ok) {
                                return response.json();
                            }
                            throw new Error("Ошибка при отправке данных");
                        })
                        .then((result) => {
                            alert("Ваша заявка успешно отправлена. Ожидайте сообщения от менеджера.");
                            console.log("Ответ сервера:", result);
                        })
                        .catch((error) => {
                            alert("Произошла ошибка!");
                            console.error("Ошибка:", error);
                        });
                });
            } else {
                console.error("Sell course data not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching course:", error);
        });
});