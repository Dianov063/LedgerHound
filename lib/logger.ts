import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['email', 'password', 'apiKey', 'wallet', 'address'],
  base: {
    env: process.env.NODE_ENV,
    service: 'ledgerhound',
  },
});

export default logger;
