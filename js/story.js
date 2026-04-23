// Story and interaction handling
const STORY = {
    narrationCallback: null,
    nearObject: null,

    tryInteract() {
        if (!GAME_STATE.isAlive) return;
        const nb = document.getElementById('narBox');
        if (nb.classList.contains('show')) {
            nb.classList.remove('show');
            this.afterNarration();
            return;
        }
        if (!this.nearObject) return;
        const id = this.nearObject.id;
        if (id !== 'marcus' && id !== 'door') {
            this.nearObject.done = true;
        }
        this.nearObject = null;
        document.getElementById('prompt').style.display = 'none';
        AUDIO.playUIClick();
        this.handleObject(id);
    },

    showNarration(speaker, text, callback) {
        GAME_STATE.isGameOn = false;
        document.getElementById('narName').textContent = speaker;
        document.getElementById('narText').textContent = '';
        document.getElementById('narBox').classList.add('show');
        this.narrationCallback = callback || null;
        this.typeText(document.getElementById('narText'), text);
    },

    afterNarration() {
        GAME_STATE.isGameOn = true;
        if (this.narrationCallback) {
            const cb = this.narrationCallback;
            this.narrationCallback = null;
            cb();
        }
    },

    typeText(el, text) {
        let i = 0;
        el.textContent = '';
        const iv = setInterval(() => {
            if (i < text.length) { el.textContent += text[i]; i++; }
            else clearInterval(iv);
        }, 18);
    },

    checkNearby() {
        const objs = GAME_STATE.objects[GAME_STATE.currentScene] || [];
        this.nearObject = null;
        let best = 1.6;
        for (const o of objs) {
            if (o.done) continue;
            const d = Math.hypot(PLAYER.x - o.x, PLAYER.y - o.y);
            if (d < best) { best = d; this.nearObject = o; }
        }
        const pr = document.getElementById('prompt');
        if (this.nearObject) {
            pr.style.display = 'block';
            pr.textContent = this.nearObject.label;
        } else {
            pr.style.display = 'none';
        }
    },

    handleObject(id) {
        if (id === 'alarm') {
            this.showNarration('NARRATOR', 'The alarm goes silent. You silence the incessant beeping.', () => {
                GAME_STATE.alarmOff = true;
                GAME_STATE.isGameOn = true;
                AUDIO.playTone(300, 200);
            });
        }
        else if (id === 'food') {
            this.showNarration('NARRATOR', 'You eat quickly. Toast and coffee. The rain hasn\'t stopped outside.', () => {
                GAME_STATE.foodEaten = true;
                GAME_STATE.isGameOn = true;
                AUDIO.playTone(500, 150);
            });
        }
        else if (id === 'door') {
            if (!GAME_STATE.alarmOff) {
                this.showNarration('NARRATOR', 'Wait... the alarm. You can\'t forget that. Go back and turn it off.', () => {
                    GAME_STATE.isGameOn = true;
                });
                return;
            }
            if (!GAME_STATE.foodEaten) {
                this.showNarration('NARRATOR', 'You need to eat something before you leave. You\'ll be at work all day.', () => {
                    GAME_STATE.isGameOn = true;
                });
                return;
            }
            const doorObj = GAME_STATE.objects.BEDROOM.find(o => o.id === 'door');
            if (doorObj) doorObj.done = true;
            this.showNarration('NARRATOR', 'You grab your keys. The hallway is quiet. Time to face another day.', () => {
                EFFECTS.flash('#000', 600);
                setTimeout(() => {
                    this.changeScene(GAME_STATE.SCENES.BEDROOM_EXIT);
                    this.showNarration('NARRATOR', 'The front door is right ahead. Your car is waiting outside.', () => {
                        GAME_STATE.isGameOn = true;
                    });
                }, 700);
            });
        }
        else if (id === 'desk') {
            this.showNarration('YOU', 'Back at my desk. Same old routine.', () => {
                setTimeout(() => this.triggerPhoneCall(), 2000);
            });
        }
        else if (id === 'choice') {
            this.showNarration('MARCUS', 'Hey... I need your help with something. No questions. You in or you out?', () => {
                this.showChoices([
                    { text: 'Go with Marcus. Whatever it is.', fn: () => this.badPathCar() },
                    { text: 'Tell him no. Head home alone.', fn: () => this.goodPathHome() }
                ]);
            });
        }
        else if (id === 'marcus') {
            if (GAME_STATE.marcusAngry) {
                this.showNarration('MARCUS', '"I knew I couldn\'t trust you."', () => {
                    GAME_STATE.friendActive = true;
                    GAME_STATE.friendX = 5;
                    GAME_STATE.friendY = 6;
                    this.changeScene(GAME_STATE.SCENES.MARCUS_CHASE);
                    this.showNarration('NARRATOR', 'He moves toward you. His face dark. You need to act fast.', () => {
                        GAME_STATE.isGameOn = true;
                    });
                });
            } else {
                this.showNarration('MARCUS', 'Come on. Let\'s make some easy money.', () => {
                    this.showChoices([
                        { text: 'Do it. What could go wrong?', fn: () => this.acceptCrime() },
                        { text: 'No way. I\'m leaving.', fn: () => this.rejectCrime() }
                    ]);
                });
            }
        }
        else if (id === 'door_front') {
            this.showNarration('NARRATOR', 'You step outside. The cold air hits you. Time to go.', () => {
                EFFECTS.flash('#000', 800);
                setTimeout(() => {
                    this.changeScene(GAME_STATE.SCENES.OFFICE);
                    this.showNarration('NARRATOR', '08:30. You settle at your desk. The office hums with fluorescent light and quiet tension.', () => {
                        GAME_STATE.isGameOn = true;
                    });
                }, 900);
            });
        }
        else if (id === 'phone_police' || id === 'phone') {
            this.callPolice();
        }
        else if (id === 'door_escape') {
            this.escapeHouse();
        }
        else if (id === 'hide') {
            this.hideFromMarcus();
        }
    },

    changeScene(newScene) {
        GAME_STATE.currentScene = newScene;
        if (newScene === GAME_STATE.SCENES.BEDROOM) {
            PLAYER.x = 5; PLAYER.y = 7; PLAYER.angle = -Math.PI / 2;
        } else if (newScene === GAME_STATE.SCENES.BEDROOM_EXIT) {
            PLAYER.x = 9; PLAYER.y = 9; PLAYER.angle = -Math.PI / 2;
        } else if (newScene === GAME_STATE.SCENES.OFFICE) {
            PLAYER.x = 10; PLAYER.y = 10; PLAYER.angle = 0;
        } else if (newScene === GAME_STATE.SCENES.CAR_WITH_MARCUS) {
            PLAYER.x = 6; PLAYER.y = 1.5; PLAYER.angle = Math.PI / 2;
        } else if (newScene === GAME_STATE.SCENES.MARCUS_HOUSE) {
            PLAYER.x = 7; PLAYER.y = 8; PLAYER.angle = Math.PI;
            GAME_STATE.friendActive = false;
        } else if (newScene === GAME_STATE.SCENES.MARCUS_CHASE) {
            PLAYER.x = 9; PLAYER.y = 13; PLAYER.angle = -Math.PI / 2;
            GAME_STATE.friendActive = true;
            GAME_STATE.marcusAngry = true;
            GAME_STATE.friendX = 9;
            GAME_STATE.friendY = 5;
        } else if (newScene === GAME_STATE.SCENES.HOME_NIGHT) {
            PLAYER.x = 9; PLAYER.y = 13; PLAYER.angle = -Math.PI / 2;
            GAME_STATE.friendActive = true;
            GAME_STATE.friendX = 9;
            GAME_STATE.friendY = 6;
        }
        const cfg = GAME_STATE.sceneConfig[newScene];
        document.getElementById('locLabel').textContent = cfg.label;
        document.getElementById('clockLabel').textContent = cfg.clock;
    },

    triggerPhoneCall() {
        GAME_STATE.isGameOn = false;
        AUDIO.playPhoneRing();
        document.getElementById('phoneRing').classList.add('show');
        document.getElementById('callerName').textContent = 'MARCUS';
        setTimeout(() => {
            document.getElementById('phoneRing').classList.remove('show');
            this.showNarration('MARCUS', '"Meet me at my place. We\'re going for a ride."', () => {
                EFFECTS.flash('#000', 600);
                setTimeout(() => {
                    this.changeScene(GAME_STATE.SCENES.CAR_WITH_MARCUS);
                    this.showNarration('NARRATOR', 'You meet Marcus outside. He drives you across town. The city gets darker.', () => {
                        GAME_STATE.isGameOn = true;
                    });
                }, 700);
            });
        }, 3000);
    },

    badPathCar() {
        this.showNarration('YOU', '"Yeah, alright. Let\'s go."', () => {
            this.showNarration('MARCUS', 'There\'s a store nearby. Quick job. In and out. Easy money.', () => {
                EFFECTS.flash('#000', 500);
                setTimeout(() => {
                    this.changeScene(GAME_STATE.SCENES.MARCUS_HOUSE);
                    this.showNarration('NARRATOR', 'Marcus pulls up to an old house. This is where he lives.', () => {
                        this.showNarration('NARRATOR', 'He explains the plan. Your stomach tightens. This is serious.', () => {
                            GAME_STATE.isGameOn = true;
                        });
                    });
                }, 700);
            });
        });
    },

    acceptCrime() {
        this.showNarration('YOU', '"Okay. I\'m in."', () => {
            this.showNarration('MARCUS', 'Good. Good. Let\'s do this.', () => {
                EFFECTS.flash('#000', 400);
                setTimeout(() => {
                    EFFECTS.startPoliceFlash();
                    this.showNarration('NARRATOR', 'Sirens. Red and blue lights. They were waiting.', () => {
                        this.showNarration('COP', '"Hands in the air! Don\'t move!"', () => {
                            EFFECTS.stopPoliceFlash();
                            setTimeout(() => this.endGameArrest(), 600);
                        });
                    });
                }, 400);
            });
        });
    },

    rejectCrime() {
        this.showNarration('YOU', '"No. I can\'t do this."', () => {
            this.showNarration('MARCUS', 'What? After I brought you here?', () => {
                this.showNarration('YOU', 'I\'m sorry. I\'m leaving.', () => {
                    this.changeScene(GAME_STATE.SCENES.MARCUS_CHASE);
                    this.showNarration('MARCUS', '"You think you can just walk out on me? I don\'t think so."', () => {
                        this.showNarration('NARRATOR', 'His face darkens. He steps toward you. You need to run.', () => {
                            GAME_STATE.isGameOn = true;
                        });
                    });
                });
            });
        });
    },

    goodPathHome() {
        this.showNarration('YOU', '"I can\'t Marcus. Not like this."', () => {
            this.showNarration('MARCUS', 'Fine. Fine. Your loss.', () => {
                EFFECTS.flash('#000', 600);
                setTimeout(() => {
                    this.changeScene(GAME_STATE.SCENES.HOME_NIGHT);
                    this.showNarration('NARRATOR', 'You turn down Marcus. He drops you at home without another word.', () => {
                        this.showNarration('NARRATOR', 'You push the door open. Something feels wrong. Very wrong.', () => {
                            this.showNarration('NARRATOR', 'A shadow in the hallway. He\'s inside.', () => {
                                GAME_STATE.isGameOn = true;
                            });
                        });
                    });
                }, 700);
            });
        });
    },

    callPolice() {
        this.showNarration('NARRATOR', 'You dial. Hand shaking. Voice steady.', () => {
            this.showNarration('NARRATOR', 'Sirens. They\'re coming.', () => {
                EFFECTS.flash('#000', 400);
                setTimeout(() => {
                    EFFECTS.startPoliceFlash();
                    this.showNarration('NARRATOR', 'Blue lights. Red lights. Voices. Footsteps.', () => {
                        setTimeout(() => {
                            EFFECTS.stopPoliceFlash();
                            this.endGameSaved();
                        }, 1500);
                    });
                }, 500);
            });
        });
    },

    escapeHouse() {
        this.showNarration('NARRATOR', 'You bolt for the door. Your lungs burn. Don\'t look back.', () => {
            EFFECTS.flash('#000', 500);
            setTimeout(() => {
                EFFECTS.flash('#fff', 300);
                setTimeout(() => {
                    this.showNarration('NARRATOR', 'You\'re out. Running down the street. Free.', () => {
                        this.endGameEscaped();
                    });
                }, 400);
            }, 600);
        });
    },

    hideFromMarcus() {
        this.showNarration('NARRATOR', 'You find a closet. Press yourself in. Don\'t breathe. Don\'t make a sound.', () => {
            GAME_STATE.isGameOn = true;
            GAME_STATE.friendActive = false;
            setTimeout(() => {
                if (GAME_STATE.isAlive) {
                    this.showNarration('NARRATOR', 'Time passes. Silence. Where is he?', () => {
                        this.showNarration('NARRATOR', 'Your phone. You have to call. Now.', () => {
                            GAME_STATE.isGameOn = true;
                            GAME_STATE.friendActive = true;
                        });
                    });
                }
            }, 6000);
        });
    },

    showChoices(choices) {
        const box = document.getElementById('choiceBox');
        box.innerHTML = '<div class="clabel">— what do you do? —</div>';
        choices.forEach(c => {
            const b = document.createElement('button');
            b.className = 'cbtn';
            b.textContent = '▶  ' + c.text;
            b.onclick = () => {
                AUDIO.playUIClick();
                box.classList.remove('show');
                box.innerHTML = '';
                c.fn();
            };
            box.appendChild(b);
        });
        box.classList.add('show');
    },

    endGameArrest() {
        GAME_STATE.isAlive = false; GAME_STATE.isGameOn = false; GAME_STATE.friendActive = false;
        EFFECTS.stopPoliceFlash();
        const e = document.getElementById('ending');
        document.getElementById('endTitle').textContent = 'ARRESTED';
        document.getElementById('endTitle').className = 'bad';
        document.getElementById('endText').textContent = 'You made your choice.\nYou knew what Marcus was planning.\nNow you\'re paying the price.\nThe ordinary day ended here.';
        e.classList.add('show');
    },

    endGameSaved() {
        GAME_STATE.isAlive = false; GAME_STATE.isGameOn = false; GAME_STATE.friendActive = false;
        const e = document.getElementById('ending');
        document.getElementById('endTitle').textContent = 'YOU MADE IT';
        document.getElementById('endTitle').className = 'good';
        document.getElementById('endText').textContent = 'You stayed calm when it mattered.\nYou had the courage to refuse.\nPolice arrived. Justice was served.\nYou survived the ordinary day.';
        e.classList.add('show');
    },

    endGameEscaped() {
        GAME_STATE.isAlive = false; GAME_STATE.isGameOn = false; GAME_STATE.friendActive = false;
        const e = document.getElementById('ending');
        document.getElementById('endTitle').textContent = 'FREE';
        document.getElementById('endTitle').className = 'good';
        document.getElementById('endText').textContent = 'You ran. You survived.\nMarcus is behind you now.\nThe city lights fade as you disappear into the night.\nYou\'re free.';
        e.classList.add('show');
    }
};
