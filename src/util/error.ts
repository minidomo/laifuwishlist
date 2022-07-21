import { logger } from './logger';

// eslint-disable-next-line
export function handleError(err: any) {
    if (err instanceof Error && !err.message.endsWith('reason: time')) {
        let msg = `${err.name}: ${err.message}`;

        if (err.stack) {
            msg += `\n${err.stack}`;
        }

        logger.error(msg);
    }
}
