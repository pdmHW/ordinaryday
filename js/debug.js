// Debug utilities
const DEBUG = {
    enabled: false,
    element: null,

    init() {
        this.element = document.getElementById('debugInfo');
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'd') {
                this.toggle();
            }
        });
    },

    toggle() {
        this.enabled = !this.enabled;
        if (this.element) {
            this.element.classList.toggle('show');
        }
    },

    update(data) {
        if (!this.enabled || !this.element) return;
        let info = '<strong>DEBUG INFO</strong><br>';
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'number') {
                info += `${key}: ${value.toFixed(2)}<br>`;
            } else {
                info += `${key}: ${value}<br>`;
            }
        }
        this.element.innerHTML = info;
    },

    log(message) {
        console.log(`[TOD] ${message}`);
    },

    warn(message) {
        console.warn(`[TOD] ${message}`);
    },

    error(message) {
        console.error(`[TOD] ${message}`);
    }
};

// Initialize debug on script load
DEBUG.init();