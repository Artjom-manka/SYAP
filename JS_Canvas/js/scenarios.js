export function createScenarios(widget) {
    return {
        teleport() {
            const g = widget.getGame();
            if (!g) return;
            g.tank.x = 400;
            g.tank.y = 320;
            g.tank.vx = 0;
            g.tank.vy = 0;
        },

        boost() {
            widget.setBoost(3);
            setTimeout(() => widget.setBoost(1), 2000);
        },

        freeze() {
            widget.setFrozen(true);
            setTimeout(() => widget.setFrozen(false), 1500);
        },

        toggleFog() {
            widget.toggleFog();
            return widget.getFog();
        },

        reset() {
            widget.restart();
        },

        win() {
            const g = widget.getGame();
            if (g) g.win();
        },

        stop() {
            const g = widget.getGame();
            if (g) g.finishByUser();
        },
    };
}