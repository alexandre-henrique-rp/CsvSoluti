import axios from 'axios';

const WhatsApp = {
  sendText: async (tel: string, msg: string) => {
    try {
      const token = process.env.WHATSAPP_TOKEN;
      const response = await axios.post(
        `https://api.inovstar.com/core/v2/api/chats/send-text`,
        {
          number: '55' + tel,
          message: msg,
          forceSend: true,
          verifyContact: false,
        },
        {
          headers: {
            'access-token': token,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};

export default WhatsApp;
