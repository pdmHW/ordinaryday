// Visual and gameplay effects
const EFFECTS = {
    flashInterval: null,
    policeFlashInterval: null,

    flash(color = '#000', duration = 600) {
        const el = document.getElementById('flash');
        el.style.background = color;
        el.style.opacity = '0.85';
        el.style.transition = 'opacity 0.04s';

        clearTimeout(this.flashInterval);
        this.flashInterval = setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.6s';
        }, duration);
    },

    startPoliceFlash() {
        const pf = document.getElementById('policeFlash');
        let tog = false;

        this.stopPoliceFlash();

        this.policeFlashInterval = setInterval(() => {
            tog = !tog;
            pf.style.opacity = '0.3';
            pf.style.background = tog ? 'rgba(58,106,200,0.5)' : 'rgba(200,50,30,0.5)';
        }, 280);

        AUDIO.playSiren();
    },

    stopPoliceFlash() {
        if (this.policeFlashInterval) {
            clearInterval(this.policeFlashInterval);
            this.policeFlashInterval = null;
        }
        document.getElementById('policeFlash').style.opacity = '0';
    },

    updateFear(distance) {
        const vigEl = document.getElementById('vig');
        if (distance < 5) {
            vigEl.style.opacity = (0.5 + (1 - distance / 5) * 0.4).toString();
        } else {
            vigEl.style.opacity = '0.5';
        }
    }
};