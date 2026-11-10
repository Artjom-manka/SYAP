import { STATUS, ALLOWED_STATUSES } from './constants.js';

export class SessionStore {
    constructor() {
        this.records = [];
    }

    static verify(record) {
        const issues = [];
        if (!record.playerName) issues.push('пустое имя игрока');
        if (typeof record.timeSec !== 'number' || record.timeSec <= 0) {
            issues.push('неправдоподобное время сессии');
        }
        if (typeof record.alerts !== 'number' || record.alerts < 0) {
            issues.push('отрицательное число тревог');
        }
        if (!ALLOWED_STATUSES.includes(record.status)) {
            issues.push('недопустимый статус');
        }
        return issues;
    }

    add(record) {
        const issues = SessionStore.verify(record);
        if (issues.length > 0) {
            return { ok: false, issues };
        }
        const sessionId = this.records.length + 1;
        this.records.push({ sessionId, ...record });
        return { ok: true, sessionId };
    }

    all() { return this.records.slice(); }

    leaderboard(limit = 10) {
        return [...this.records]
            .sort((a, b) => b.timeSec - a.timeSec)
            .slice(0, limit);
    }

    personalStats(name) {
        const mine = this.records.filter((r) => r.playerName === name);
        if (mine.length === 0) return null;
        return {
            sessions: mine.length,
            totalTime: mine.reduce((s, r) => s + r.timeSec, 0),
            bestTime: Math.max(...mine.map((r) => r.timeSec)),
            totalAlerts: mine.reduce((s, r) => s + r.alerts, 0),
        };
    }
}