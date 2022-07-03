import { logger } from './logger';

export function handleError(err?: Error) {
    if (err && !err.message.endsWith('reason: time')) {
        let msg = `${err.name}: ${err.message}`;

        if (err.stack) {
            msg += `\n${err.stack}`;
        }

        logger.error(msg);
    }
}
