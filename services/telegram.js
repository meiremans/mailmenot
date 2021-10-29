const axios = require("axios");
exports.sendMessage = async (message, chatId) => {
    try{
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=html`;
        await axios.get(url);
        console.log("message send:");
        console.log(message);
    }
    catch(e){
        console.error(e);
    }
}