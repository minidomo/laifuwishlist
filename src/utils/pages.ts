import type { Bounds } from 'laifutil';

export function next(page: number, lastPage: number): number {
    return ((page - 1) + 1 + lastPage) % lastPage + 1;
}

export function previous(page: number, lastPage: number): number {
    return ((page - 1) - 1 + lastPage) % lastPage + 1;
}

export function calculateLastPage(lines: number, linesPerPage: number): number {
    if (lines === 0) {
        return 1;
    }

    return Math.ceil(lines / linesPerPage);
}

export function calculateBounds(page: number, lines: number, linesPerPage: number): Bounds {
    return {
        lower: (page - 1) * linesPerPage,
        upper: Math.min(page * linesPerPage - 1, lines - 1),
    };
}

export function clamp(page: number, lastPage: number): number {
    if (page < 1) {
        return 1;
    } else if (page > lastPage) {
        return lastPage;
    } else {
        return page;
    }
}
