const axios = require("axios");
exports.sendMessage = async (message, chatId) => {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage?chat_id=${chatId}&text=${message}`;
    await axios.get(url);
}