// Input handling
const CONTROLS = {
    keys: {},
    joystick: { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 },
    look: { active: false, id: -1, lx: 0 },
    isMobile: /Mobi|Android/i.test(navigator.userAgent),

    init() {
        this.setupKeyboard();
        this.setupJoystick();
        this.setupLookPad();
        this.setupActionButton();
        this.setupFullscreen();
        this.setupMouseLook();
    },

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && GAME_STATE.isGameOn) {
                STORY.tryInteract();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },

    setupJoystick() {
        const joyBase = document.getElementById('joyBase');
        const joyKnob = document.getElementById('joyKnob');
        const R = 42;

        joyBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            const r = joyBase.getBoundingClientRect();
            this.joystick = {
                active: true,
                id: t.identifier,
                ox: r.left + r.width / 2,
                oy: r.top + r.height / 2,
                dx: 0,
                dy: 0
            };
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            // Only process if joystick is active
            for (const t of e.changedTouches) {
                if (t.identifier === this.joystick.id && this.joystick.active) {
                    e.preventDefault();
                    let dx = t.clientX - this.joystick.ox;
                    let dy = t.clientY - this.joystick.oy;
                    const d = Math.hypot(dx, dy);

                    if (d > R) {
                        dx = (dx / d) * R;
                        dy = (dy / d) * R;
                    }

                    this.joystick.dx = dx / R;
                    this.joystick.dy = dy / R;
                    joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === this.joystick.id) {
                    this.joystick.active = false;
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                    joyKnob.style.transform = 'translate(-50%,-50%)';
                }
            }
        });
    },

    setupLookPad() {
        const lookPad = document.getElementById('lookPad');

        lookPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            this.look = { active: true, id: t.identifier, lx: t.clientX };
        }, { passive: false });

        lookPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                if (t.identifier === this.look.id && this.look.active) {
                    const dx = t.clientX - this.look.lx;
                    PLAYER.angle += dx * 0.008; // Camera rotation
                    this.look.lx = t.clientX;
                }
            }
        }, { passive: false });

        lookPad.addEventListener('touchend', (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === this.look.id) {
                    this.look.active = false;
                }
            }
        });
    },

    setupActionButton() {
        document.getElementById('actBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            STORY.tryInteract();
        }, { passive: false });
    },

    setupFullscreen() {
        document.getElementById('fsBtn').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
                document.exitFullscreen?.().catch(() => {});
            }
        });
    },

    setupMouseLook() {
        if (this.isMobile) return;

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body && GAME_STATE.isGameOn) {
                PLAYER.angle += e.movementX * 0.003;
            }
        });

        RENDER.canvas.addEventListener('click', () => {
            if (GAME_STATE.isGameOn && !this.isMobile) {
                RENDER.canvas.requestPointerLock?.();
            }
        });
    }
};