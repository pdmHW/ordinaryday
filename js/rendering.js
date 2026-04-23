// Rendering engine
const RENDER = {
    canvas: null,
    ctx: null,
    mmCanvas: null,
    mctx: null,
    W: 0,
    H: 0,
    FOV: Math.PI / 2.6,
    isMobile: /Mobi|Android/i.test(navigator.userAgent),

    init() {
        this.canvas = document.getElementById('gc');
        this.ctx = this.canvas.getContext('2d', { antialias: true, alpha: false, willReadFrequently: false });
        this.mmCanvas = document.getElementById('mmCanvas');
        this.mctx = this.mmCanvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this.canvas.style.width = `${this.W}px`;
        this.canvas.style.height = `${this.H}px`;
        this.ctx.imageSmoothingEnabled = false;
    },

    render() {
        if (!this.ctx || !this.canvas) return;

        const RAYS = this.isMobile ? Math.ceil(this.W / 2.8) : Math.ceil(this.W / 2);
        const SW = Math.ceil(this.W / RAYS) + 1;
        const halfH = this.H / 2;
        const zbuf = new Float32Array(RAYS);

        let ceilColor, floorGrad;
        if (GAME_STATE.currentScene === GAME_STATE.SCENES.BEDROOM) {
            ceilColor = '#1a1a28'; floorGrad = ['#2a2a38', '#1a1a25'];
        } else if (GAME_STATE.currentScene === GAME_STATE.SCENES.OFFICE) {
            ceilColor = '#1a1a2a'; floorGrad = ['#2a2a3a', '#1a1a28'];
        } else {
            ceilColor = '#0d0d12'; floorGrad = ['#151520', '#0a0a0f'];
        }

        this.ctx.fillStyle = ceilColor;
        this.ctx.fillRect(0, 0, this.W, halfH);

        const fg = this.ctx.createLinearGradient(0, halfH, 0, this.H);
        fg.addColorStop(0, floorGrad[0]);
        fg.addColorStop(1, floorGrad[1]);
        this.ctx.fillStyle = fg;
        this.ctx.fillRect(0, halfH, this.W, halfH);

        for (let i = 0; i < RAYS; i++) {
            const ra = PLAYER.angle - this.FOV / 2 + (i / RAYS) * this.FOV;
            let mapX = Math.floor(PLAYER.x);
            let mapY = Math.floor(PLAYER.y);

            const rDX = Math.cos(ra);
            const rDY = Math.sin(ra);
            const dX = Math.abs(1 / (rDX || 0.0001));
            const dY = Math.abs(1 / (rDY || 0.0001));

            let stepX, stepY, sdX, sdY;
            if (rDX < 0) { stepX = -1; sdX = (PLAYER.x - mapX) * dX; }
            else { stepX = 1; sdX = (mapX + 1 - PLAYER.x) * dX; }
            if (rDY < 0) { stepY = -1; sdY = (PLAYER.y - mapY) * dY; }
            else { stepY = 1; sdY = (mapY + 1 - PLAYER.y) * dY; }

            let hit = false, side = 0, type = 0, dist = 0;

            for (let s = 0; s < 40 && !hit; s++) {
                if (sdX < sdY) { sdX += dX; mapX += stepX; side = 0; }
                else { sdY += dY; mapY += stepY; side = 1; }
                const cellType = COLLISION.getCell(mapX, mapY);
                if (cellType === 1 || cellType === 2 || cellType === 3) {
                    hit = true; type = cellType;
                    dist = side === 0
                        ? (mapX - PLAYER.x + (1 - stepX) / 2) / (rDX || 0.0001)
                        : (mapY - PLAYER.y + (1 - stepY) / 2) / (rDY || 0.0001);
                }
            }

            if (!hit) dist = 25;
            const corr = Math.abs(dist) * Math.cos(ra - PLAYER.angle);
            zbuf[i] = corr;
            if (corr >= 25) continue;

            const sh = Math.min(this.H * 1.15, this.H / Math.max(corr, 0.0001));
            const sy = halfH - sh / 2;
            const light = Math.max(0.3, 1 - corr / 16) * (side === 0 ? 1 : 0.75);

            let r, g, b;
            if (GAME_STATE.currentScene === GAME_STATE.SCENES.BEDROOM) {
                if (type === 3) { r = 80 + light*120; g = 100 + light*140; b = 160 + light*80; }
                else if (type === 2) { r = 120 + light*110; g = 90 + light*80; b = 60 + light*50; }
                else { r = 100 + light*120; g = 90 + light*110; b = 110 + light*130; }
            } else if (GAME_STATE.currentScene === GAME_STATE.SCENES.OFFICE) {
                if (type === 3) { r = 80 + light*100; g = 110 + light*140; b = 170 + light*80; }
                else if (type === 2) { r = 100 + light*110; g = 100 + light*110; b = 110 + light*120; }
                else { r = 90 + light*110; g = 90 + light*110; b = 110 + light*130; }
            } else {
                if (type === 3) { r = 40 + light*70; g = 40 + light*70; b = 60 + light*90; }
                else if (type === 2) { r = 70 + light*80; g = 55 + light*65; b = 40 + light*55; }
                else { r = 55 + light*80; g = 50 + light*70; b = 65 + light*90; }
            }

            this.ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
            this.ctx.fillRect((i / RAYS) * this.W, sy, SW, sh);
        }

        this.drawSprites(zbuf, RAYS);

        if (GAME_STATE.currentScene === GAME_STATE.SCENES.BEDROOM) {
            const wg = this.ctx.createRadialGradient(this.W*0.15, this.H*0.35, 0, this.W*0.15, this.H*0.35, this.W*0.45);
            wg.addColorStop(0, 'rgba(110,140,190,0.15)');
            wg.addColorStop(1, 'transparent');
            this.ctx.fillStyle = wg;
            this.ctx.fillRect(0, 0, this.W, this.H);
        } else if (GAME_STATE.currentScene === GAME_STATE.SCENES.OFFICE) {
            const og = this.ctx.createLinearGradient(0, 0, 0, this.H * 0.3);
            og.addColorStop(0, 'rgba(190,210,250,0.1)');
            og.addColorStop(1, 'transparent');
            this.ctx.fillStyle = og;
            this.ctx.fillRect(0, 0, this.W, this.H);
        }
    },

    drawSprites(zbuf, RAYS) {
        const scene = GAME_STATE.currentScene;
        const objs = GAME_STATE.objects[scene] || [];
        const sprites = objs.filter(o => !o.done).map(o => ({ ...o, _type: 'obj' }));

        if (GAME_STATE.friendActive && (scene === GAME_STATE.SCENES.HOME_NIGHT || scene === GAME_STATE.SCENES.MARCUS_CHASE)) {
            sprites.push({ x: GAME_STATE.friendX, y: GAME_STATE.friendY, _type: 'friend' });
        }

        sprites.sort((a, b) => {
            const da = (b.x - PLAYER.x) ** 2 + (b.y - PLAYER.y) ** 2;
            const db = (a.x - PLAYER.x) ** 2 + (a.y - PLAYER.y) ** 2;
            return da - db;
        });

        for (const s of sprites) {
            const dx = s.x - PLAYER.x;
            const dy = s.y - PLAYER.y;
            const dd = Math.hypot(dx, dy);
            if (dd < 0.3) continue;

            let ang = Math.atan2(dy, dx) - PLAYER.angle;
            while (ang > Math.PI) ang -= Math.PI * 2;
            while (ang < -Math.PI) ang += Math.PI * 2;
            if (Math.abs(ang) > this.FOV * 0.7) continue;

            const sx = ((ang / this.FOV) + 0.5) * this.W;
            const sz = Math.min(this.H * 0.95, (this.H / dd) * 0.85);
            const halfH = this.H / 2;
            const ri = Math.floor(((ang / this.FOV) + 0.5) * RAYS);

            let ok = false;
            for (let r = Math.max(0, ri - 5); r <= Math.min(RAYS - 1, ri + 5); r++) {
                if (zbuf[r] >= dd) { ok = true; break; }
            }
            if (!ok) continue;

            const shade = Math.min(1, Math.max(0.25, 1 - dd / 13));
            this.ctx.save();
            this.ctx.globalAlpha = Math.min(1, shade * 1.25);

            if (s._type === 'friend') {
                const bw = sz * 0.32, bh = sz * 0.72, hw = sz * 0.22;
                this.ctx.fillStyle = `rgba(25,12,12,${shade * 0.98})`;
                this.ctx.fillRect(sx - bw / 2, halfH - bh * 0.82, bw, bh);
                this.ctx.beginPath();
                this.ctx.ellipse(sx, halfH - bh * 0.85, hw * 0.65, hw * 0.8, 0, 0, Math.PI * 2);
                this.ctx.fill();
                const es = Math.max(2.5, sz * 0.028);
                this.ctx.fillStyle = `rgba(210,40,40,${shade * 1.15})`;
                this.ctx.beginPath();
                this.ctx.arc(sx - sz * 0.045, halfH - bh * 0.78, es, 0, Math.PI * 2);
                this.ctx.arc(sx + sz * 0.045, halfH - bh * 0.78, es, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                const nw = Math.max(10, sz * 0.20), nh = Math.max(12, sz * 0.26);
                const g = this.ctx.createRadialGradient(sx, halfH, 0, sx, halfH, nw * 5);
                g.addColorStop(0, `rgba(250,230,170,${shade * 0.45})`);
                g.addColorStop(0.5, `rgba(240,220,160,${shade * 0.2})`);
                g.addColorStop(1, 'rgba(230,210,150,0)');
                this.ctx.fillStyle = g;
                this.ctx.fillRect(sx - nw * 4, halfH - nw * 4, nw * 8.5, nw * 8.5);
                this.ctx.fillStyle = `rgba(245,225,155,${Math.min(1, shade * 1.35)})`;
                this.ctx.shadowColor = `rgba(240,220,160,${shade * 0.6})`;
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(sx - nw / 2, halfH - nh / 2, nw, nh);
            }

            this.ctx.restore();
        }
    },

    drawMinimap() {
        const mapConfig = GAME_STATE.maps[`${GAME_STATE.currentScene}_MAP`];
        if (!mapConfig) return;

        const sx = this.mmCanvas.width / mapConfig.width;
        const sy = this.mmCanvas.height / mapConfig.height;

        this.mctx.fillStyle = '#0a0a0e';
        this.mctx.fillRect(0, 0, this.mmCanvas.width, this.mmCanvas.height);

        for (let y = 0; y < mapConfig.height; y++) {
            for (let x = 0; x < mapConfig.width; x++) {
                const c = mapConfig.data[y * mapConfig.width + x];
                this.mctx.fillStyle = c === 0 ? '#1a1a22' : c === 3 ? '#2a3a55' : c === 2 ? '#3a2a15' : '#222230';
                this.mctx.fillRect(x * sx + 0.5, y * sy + 0.5, sx - 1, sy - 1);
            }
        }

        const objs = GAME_STATE.objects[GAME_STATE.currentScene] || [];
        objs.forEach(o => {
            if (o.done) return;
            this.mctx.fillStyle = '#d8cc9e';
            this.mctx.fillRect(o.x * sx - 2, o.y * sy - 2, 4, 4);
        });

        if (GAME_STATE.friendActive) {
            this.mctx.fillStyle = '#b82020';
            this.mctx.beginPath();
            this.mctx.arc(GAME_STATE.friendX * sx, GAME_STATE.friendY * sy, 3, 0, Math.PI * 2);
            this.mctx.fill();
        }

        this.mctx.fillStyle = '#ffffff';
        this.mctx.beginPath();
        this.mctx.arc(PLAYER.x * sx, PLAYER.y * sy, 2.5, 0, Math.PI * 2);
        this.mctx.fill();

        this.mctx.strokeStyle = '#ffffffcc';
        this.mctx.lineWidth = 1;
        this.mctx.beginPath();
        this.mctx.moveTo(PLAYER.x * sx, PLAYER.y * sy);
        this.mctx.lineTo(PLAYER.x * sx + Math.cos(PLAYER.angle) * 7, PLAYER.y * sy + Math.sin(PLAYER.angle) * 7);
        this.mctx.stroke();
    }
};
