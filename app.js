const app = require('./modules/expressServer.js');

app.listen(3000, () => {
  console.log('Сервер запущен на http://localhost:3000');
});
