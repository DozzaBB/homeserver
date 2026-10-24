import winston from 'winston';
import { config } from './secrets';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({format: winston.format.simple(), level: 'info'}),
    new winston.transports.File({ format: winston.format.simple(), filename: 'error.log', level: 'error' }),
    new winston.transports.File({ format: winston.format.simple(), filename: config.LOG_FOLDER + 'combined.log' }),
  ],
});

export default logger;