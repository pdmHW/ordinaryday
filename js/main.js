// Main game loop and initialization
let lastTime = 0;
let gameLoopRunning = false;

function gameLoop(ts) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (GAME_STATE.isGameOn && GAME_STATE.isAlive) {
        update(dt);
    }

    render();
}

function update(dt) {
    // Update player
    PLAYER.update(dt, GAME_STATE.isGameOn);

    // Check nearby interactables
    STORY.checkNearby();

    // Friend AI - Marcus chasing
    if (GAME_STATE.friendActive && (GAME_STATE.currentScene === GAME_STATE.SCENES.MARCUS_CHASE || GAME_STATE.currentScene === GAME_STATE.SCENES.HOME_NIGHT)) {
        const ex = PLAYER.x - GAME_STATE.friendX;
        const ey = PLAYER.y - GAME_STATE.friendY;
        const ed = Math.hypot(ex, ey);

        // Collision check - death condition
        if (ed < 1.0) {
            DEBUG.log('Caught by Marcus! Distance: ' + ed.toFixed(2));
            STORY.endGameDead();
            return;
        }

        // Marcus chases faster if angry, slower if just waiting
        const chaseSpeed = GAME_STATE.marcusAngry ? 1.8 : 1.0;
        const fspd = chaseSpeed * dt;
        
        const nx = GAME_STATE.friendX + (ex / (ed || 1)) * fspd;
        const ny = GAME_STATE.friendY + (ey / (ed || 1)) * fspd;

        if (!COLLISION.isSolid(nx, GAME_STATE.friendY)) {
            GAME_STATE.friendX = nx;
        }
        if (!COLLISION.isSolid(GAME_STATE.friendX, ny)) {
            GAME_STATE.friendY = ny;
        }

        EFFECTS.updateFear(ed);
    }

    // Debug info
    DEBUG.update({
        'FPS': Math.round(1 / (dt || 0.016)),
        'PX': PLAYER.x.toFixed(1),
        'PY': PLAYER.y.toFixed(1),
        'PA': (PLAYER.angle * 180 / Math.PI).toFixed(0),
        'Scene': GAME_STATE.currentScene,
        'Alarm Off': GAME_STATE.alarmOff,
        'Food Eaten': GAME_STATE.foodEaten
    });
}

function render() {
    RENDER.render();
    RENDER.drawMinimap();
}

function startGame() {
    document.getElementById('titleScreen').classList.add('hidden');

    // Request fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.log('Fullscreen request denied:', err);
        });
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }

    GAME_STATE.reset();
    PLAYER.reset();
    STORY.changeScene(GAME_STATE.SCENES.BEDROOM);

    setTimeout(() => {
        STORY.showNarration('NARRATOR', 'Monday. November 14th. The alarm pulls you from a dreamless sleep.', () => {
            STORY.showNarration('NARRATOR', 'Before you can leave, you need to turn off the alarm and eat breakfast.', () => {
                GAME_STATE.isGameOn = true;
            });
        });
    }, 300);

    if (!gameLoopRunning) {
        gameLoopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function restartGame() {
    document.getElementById('ending').classList.remove('show');

    GAME_STATE.reset();
    PLAYER.reset();
    STORY.changeScene(GAME_STATE.SCENES.BEDROOM);

    STORY.showNarration('NARRATOR', 'Monday again.', () => {
        GAME_STATE.isGameOn = true;
    });

    if (!gameLoopRunning) {
        gameLoopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function endGameDead() {
    if (!GAME_STATE.isAlive) return;

    GAME_STATE.isAlive = false;
    GAME_STATE.isGameOn = false;
    GAME_STATE.friendActive = false;

    EFFECTS.flash('#300', 300);

    setTimeout(() => {
        const e = document.getElementById('ending');
        document.getElementById('endTitle').textContent = 'YOU DIDN\'T SURVIVE';
        document.getElementById('endTitle').className = 'dead';
        document.getElementById('endText').textContent = 'Marcus caught you.\nYour story ended here.\nIn a small dark room.\nNo one heard you scream.';
        e.classList.add('show');
    }, 500);
}

// Make endGameDead globally accessible
STORY.endGameDead = endGameDead;

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

function initGame() {
    console.log('[TOD] Initializing game...');
    
    try {
        RENDER.init();
        console.log('[TOD] Rendering initialized');
        
        CONTROLS.init();
        console.log('[TOD] Controls initialized');
        
        DEBUG.log('Game initialized. Press D to toggle debug info.');
        
        // Add click/touch handler to narration box as fallback
        const narBox = document.getElementById('narBox');
        narBox.addEventListener('click', () => STORY.tryInteract());
        narBox.addEventListener('touchend', (e) => {
            e.preventDefault();
            STORY.tryInteract();
        }, { passive: false });
        
        console.log('[TOD] Setup complete!');
    } catch (e) {
        console.error('[TOD] Init error:', e);
    }
}