require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN);

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text.toLowerCase().trim();

  const partes = texto.split(' ');
  const comando = partes[0];

  if (comando === 'g' || comando === 'gasto') {

    if (partes.length < 3) {
      bot.sendMessage(chatId, '⚠ Formato incorrecto.\nUsá: g 2500 nafta');
      return;
    }

    const monto = parseFloat(partes[1]);
    const categoria = partes[2];
    const descripcion = partes.slice(3).join(' ') || '';

    if (isNaN(monto)) {
      bot.sendMessage(chatId, '⚠ El monto no es válido.');
      return;
    }

  const ahora = new Date();
	const fecha = ahora.toLocaleDateString('es-AR');
	const hora = ahora.toLocaleTimeString('es-AR', { hour12: false });

    console.log({
      fecha,
      hora,
      monto,
      categoria,
      descripcion
    });

    await db.collection('gastos').add({
      fecha,
      hora,
      monto,
      categoria,
      descripcion,
      creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    bot.sendMessage(chatId,
      `✅ Gasto detectado\n📅 ${fecha} ${hora}\n💰 $${monto}\n🏷 ${categoria}`
    );

  } 
  else if (texto === '/total') {

    const snapshot = await db.collection('gastos').get();

    let total = 0;

    snapshot.forEach(doc => {
      total += doc.data().monto;
    });

    bot.sendMessage(chatId, `💰 Total acumulado: $${total}`);

    return;
  }
  
  else if (texto === '/reset') {

    const snapshot = await db.collection('gastos').get();

    const batch = db.batch();

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    bot.sendMessage(chatId, '🗑 Todos los gastos fueron eliminados.');

    return;
  } 
  
  else {
    bot.sendMessage(chatId, 'Ejemplo:\n\ng 2500 nafta');
  }
});

const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot funcionando 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});