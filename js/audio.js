// Audio Manager
const AUDIO = {
    enabled: true,
    audioCtx: null,
    ambientVolume: 0.3,
    effectVolume: 0.6,
    tracks: {
        ambientBedroom: null,
        ambientOffice: null,
        ambientHome: null,
        phoneRing: null,
        policeSiren: null,
        footstep: null,
        uiClick: null
    },

    init() {
        // Check localStorage for audio preference
        const savedPref = localStorage.getItem('audio-enabled');
        if (savedPref !== null) {
            this.enabled = savedPref === 'true';
        }

        this.updateAudioToggle();

        document.getElementById('audioToggle').addEventListener('click', () => {
            this.toggle();
        });

        // Initialize Web Audio API context (lazy)
        document.addEventListener('click', () => {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('audio-enabled', this.enabled);
        this.updateAudioToggle();
    },

    updateAudioToggle() {
        const btn = document.getElementById('audioToggle');
        if (this.enabled) {
            btn.textContent = '🔊 SOUND';
            btn.classList.remove('muted');
        } else {
            btn.textContent = '🔇 MUTED';
            btn.classList.add('muted');
        }
    },

    // Simplified audio feedback using Web Audio API
    playTone(frequency = 440, duration = 100, type = 'sine') {
        if (!this.enabled || !this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.frequency.value = frequency;
            osc.type = type;

            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration / 1000);

            osc.start(this.audioCtx.currentTime);
            osc.stop(this.audioCtx.currentTime + duration / 1000);
        } catch (e) {
            DEBUG.warn('Audio tone playback failed: ' + e.message);
        }
    },

    playPhoneRing() {
        if (!this.enabled) return;
        // Create a retro phone ring effect
        this.playTone(800, 150);
        setTimeout(() => this.playTone(600, 150), 200);
        setTimeout(() => this.playTone(800, 150), 400);
    },

    playSiren() {
        if (!this.enabled) return;
        let freq = 400;
        const interval = setInterval(() => {
            this.playTone(freq, 100);
            freq = freq === 400 ? 600 : 400;
        }, 200);
        return interval;
    },

    playUIClick() {
        if (!this.enabled) return;
        this.playTone(1200, 80);
    },

    playFootstep() {
        if (!this.enabled) return;
        this.playTone(200, 50);
    }
};

// Initialize audio on load
document.addEventListener('DOMContentLoaded', () => {
    AUDIO.init();
});