// Player object and movement
const PLAYER = {
    x: 10,
    y: 10,
    angle: 0,
    dx: 0,
    dy: 0,
    moveSpeed: 3.8,
    turnSpeed: 2.0,

    reset() {
        this.x = 5;
        this.y = 5;
        this.angle = 0;
        this.dx = 0;
        this.dy = 0;
    },

    update(dt, canMove = true) {
        if (!canMove) return;

        const spd = this.moveSpeed * dt;
        const turnSpd = this.turnSpeed * dt;

        // Keyboard turn controls
        if (CONTROLS.keys['ArrowLeft'] || CONTROLS.keys['KeyA']) {
            this.angle -= turnSpd;
        }
        if (CONTROLS.keys['ArrowRight'] || CONTROLS.keys['KeyD']) {
            this.angle += turnSpd;
        }

        // Joystick turn control (RIGHT STICK / LOOK PAD)
        // This is handled separately in controls.js

        // Movement calculation
        let mx = 0, my = 0;
        
        // Keyboard movement
        if (CONTROLS.keys['ArrowUp'] || CONTROLS.keys['KeyW']) {
            mx += Math.cos(this.angle);
            my += Math.sin(this.angle);
        }
        if (CONTROLS.keys['ArrowDown'] || CONTROLS.keys['KeyS']) {
            mx -= Math.cos(this.angle);
            my -= Math.sin(this.angle);
        }

        // Joystick movement (LEFT STICK ONLY - no camera rotation)
        if (CONTROLS.joystick.active) {
            // Left stick: movement only (vertical = forward/back, horizontal = strafe)
            mx += Math.cos(this.angle) * (-CONTROLS.joystick.dy) * 0.8;
            my += Math.sin(this.angle) * (-CONTROLS.joystick.dy) * 0.8;
            mx += Math.cos(this.angle + Math.PI / 2) * CONTROLS.joystick.dx * 0.8;
            my += Math.sin(this.angle + Math.PI / 2) * CONTROLS.joystick.dx * 0.8;
        }

        // Normalize movement
        const movLen = Math.hypot(mx, my);
        if (movLen > 1) {
            mx /= movLen;
            my /= movLen;
        }

        // Collision detection
        const nx = this.x + mx * spd;
        const ny = this.y + my * spd;

        if (!COLLISION.isSolid(nx + Math.sign(mx) * 0.3, this.y)) {
            this.x = nx;
        }
        if (!COLLISION.isSolid(this.x, ny + Math.sign(my) * 0.3)) {
            this.y = ny;
        }
    }
};

// Collision detection
const COLLISION = {
    getCell(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const mapConfig = GAME_STATE.maps[`${GAME_STATE.currentScene}_MAP`];

        if (!mapConfig || ix < 0 || iy < 0 || ix >= mapConfig.width || iy >= mapConfig.height) {
            return 1; // Wall
        }

        return mapConfig.data[iy * mapConfig.width + ix];
    },

    isSolid(x, y) {
        const cell = this.getCell(x, y);
        return cell === 1 || cell === 2 || cell === 3;
    }
};