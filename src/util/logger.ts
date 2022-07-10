import { join } from 'node:path';
import dayjs from 'dayjs';
import { createLogger, format, transport, transports } from 'winston';
import { saveLogs } from '../config';

const curTransports: transport[] = [new transports.Console()];

if (saveLogs) {
    const logDir = join(__dirname, '../../logs');
    const filename = `${dayjs().format('YYYYMMDD-HHmmss')}.log`;
    const logPath = join(logDir, filename);
    curTransports.push(new transports.File({ filename: logPath }));
}

export const logger = createLogger({
    transports: curTransports,
    format: format.combine(format.timestamp(), format.json({ space: 4 })),
});
