export function hasAllImages(images: Set<number>): boolean {
    for (let i = 1; i <= 9; i++) {
        if (!images.has(i)) {
            return false;
        }
    }

    return true;
}
