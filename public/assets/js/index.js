document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const submitButton = form.querySelector("button[type='submit']");
    const inputs = form.querySelectorAll("input");
    const termsCheckbox = form.querySelector("input[name='terms_of_conditions']");


    const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
    console.log(userId)

    // Обработчик проверки формы
    function validateForm() {
        const formData = new FormData(form);
        const network = formData.get("sell_networkId");
        const lastName = formData.get("sell_lastName");
        const firstName = formData.get("sell_firstName");
        const middleName = formData.get("sell_middleName");
        const agreeToTerms = termsCheckbox.checked;

        // Проверка всех обязательных полей
        const isValid =
            network &&
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
            network: formData.get("sell_networkId"),
            lastName: formData.get("sell_lastName"),
            firstName: formData.get("sell_firstName"),
            middleName: formData.get("sell_middleName") || "",
            agreeToTerms: termsCheckbox.checked,
            userId: userId,  // Добавляем юзернейм в данные
        };

        // Отправляем данные через fetch
        fetch("/api/sell", {
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
});

document.addEventListener("DOMContentLoaded", () => {
    const courseElement = document.getElementById("course");

    // Отправляем GET запрос на /api/getCourse с токеном в заголовках
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
            if (data.sell) {
                // Обновляем текст в элементе с sell
                courseElement.textContent = `Продать USDT - Курс ${data.buy}₽`;
            } else {
                console.error("Sell course data not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching course:", error);
        });
});
