async function fetchOrders(userId) {
    try {
        // Отправляем запрос на сервер
        const response = await fetch(`/api/orders/${userId}`);
        if (!response.ok) {
            throw new Error('Не удалось загрузить заказы.');
        }

        // Получаем данные
        const orders = await response.json();

        // Находим контейнер для HTML
        const container = document.querySelector('.min-h-dvh.grid.bg-bg-primary');

        if (orders.length > 0) {
            // Сортируем заказы от новых к старым
            orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Генерируем HTML для заказов
            const orderList = `
                <ul class="w-full bg-bg-secondary rounded-default divide-y divide-bg-tertiary">
                    ${orders
                    .map(order => {
                        const orderType = order.orderType === 'buy' ? 'Покупка' : 'Продажа';
                        const amountText = order.amount ? `${order.amount} USDT` : 'USDT';
                        const color = order.orderType === 'buy' ? '#FF375F' : '#4caf50';
                        return `
                                <li>
                                    <div class="flex py-3 px-4 text-primary gap-4 cursor-pointer">
                                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="28" height="28" rx="14" fill="${color}"></rect>
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="" fill="white"></path>
                                        </svg>
                                        <span>${orderType} ${amountText}</span>
                                    </div>
                                </li>
                            `;
                    })
                    .join('')}
                </ul>
            `;

            // Заменяем HTML контейнера на список заказов
            container.innerHTML = orderList;
        } else {
            console.log('null');
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
}

const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
fetchOrders(userId);
