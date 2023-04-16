import { format } from 'winston';
import { logStreamHandler } from '../../utils/logger/log-stream-handler';

export const logModuleConfig = {
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: 'admin-services' },
  transports: [logStreamHandler()],
  exitOnError: false,
};
