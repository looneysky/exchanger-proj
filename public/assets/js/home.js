document.addEventListener("DOMContentLoaded", () => {
    const courseBuyElement = document.getElementById("course_buy");
    const courseSellElement = document.getElementById("course_sell");

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
            if (data.buy && data.sell) {
                // Обновляем текст в элементе с sell
                courseBuyElement.textContent = `${data.sell} ₽`;
                courseSellElement.textContent = `${data.buy} ₽`;
            } else {
                console.error("Sell course data not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching course:", error);
        });
});
