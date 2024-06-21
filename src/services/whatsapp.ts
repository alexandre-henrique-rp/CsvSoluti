import axios from 'axios';

const WhatsApp = {
  sendText: async (tel: string, msg: string) => {
    try {
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
            'access-token': '60de0c8bb0012f1e6ac5546b',
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
