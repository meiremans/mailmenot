const axios = require("axios");
exports.sendMessage = async (message, chatId) => {
    console.log("message send:");
    console.log(message);
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
    await axios.get(url);
}