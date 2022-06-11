import dayjs from 'dayjs';
import { createLogger, format, transports } from 'winston';

const logDir = `${__dirname}/../logs`;
const filename = `${dayjs().format('YYYYMMDD-HHmmss')}.log`;
const logPath = `${logDir}/${filename}`;

export const logger = createLogger({
    transports: [
        new transports.Console(),
        new transports.File({ filename: logPath }),
    ],
    format: format.combine(
        format.timestamp(),
        format.json({ space: 4 }),
    ),
});
