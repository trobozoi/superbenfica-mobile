/** `expo-constants` para integração: a URL da API vem do `.env.test`. */
const Constants = {
  expoConfig: {
    version: 'test',
    extra: {
      appEnv: 'development',
      apiUrl: process.env.TEST_API_URL ?? 'http://127.0.0.1:8000/',
      wsUrl: process.env.TEST_WS_URL,
    },
  },
};

export default Constants;
