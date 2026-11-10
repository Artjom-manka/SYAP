export function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

export function closestPointOnRect(cx, cy, rect) {
    const closestX = Math.max(rect.left, Math.min(cx, rect.right));
    const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
    return [closestX, closestY];
}

export function circleIntersectsRect(cx, cy, radius, rect) {
    const [closestX, closestY] = closestPointOnRect(cx, cy, rect);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
}