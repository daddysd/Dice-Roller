class DiceRoller {
    constructor(diceType, canvasId) {
        this.diceType = diceType;
        this.canvasId = canvasId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dice = null;
        this.isRolling = false;
        this.stats = { rolls: [], total: 0 };

        this.init();
        this.loadStats();
    }

    init() {
        const canvas = document.getElementById(this.canvasId);
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a1420);
        
        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = 3;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        this.setupLighting();
        this.createDice();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize(canvas));
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x00d4ff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x7c3aed, 0.6);
        pointLight.position.set(-5, 3, 3);
        this.scene.add(pointLight);
    }

    createDice() {
        if (this.dice) {
            this.scene.remove(this.dice);
        }

        const diceConfig = {
            d4: { faces: 4, size: 1.2 },
            d6: { faces: 6, size: 1 },
            d8: { faces: 8, size: 1.1 },
            d10: { faces: 10, size: 1.2 },
            d12: { faces: 12, size: 0.9 },
            d20: { faces: 20, size: 0.85 }
        };

        const config = diceConfig[this.diceType];
        const geometry = this.generatePolyhedron(config.faces);
        const material = new THREE.MeshStandardMaterial({
            color: 0xa89968,
            metalness: 0.1,
            roughness: 0.8,
            emissive: 0x4a4a4a,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        });

        this.dice = new THREE.Mesh(geometry, material);
        this.dice.castShadow = true;
        this.dice.receiveShadow = true;
        this.dice.scale.set(config.size, config.size, config.size);
        this.dice.userData = { faces: config.faces };

        this.scene.add(this.dice);
    }

    generatePolyhedron(faces) {
        let geometry;

        switch(faces) {
            case 4:
                geometry = new THREE.TetrahedronGeometry(1, 0);
                break;
            case 6:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 8:
                geometry = new THREE.OctahedronGeometry(1, 0);
                break;
            case 10:
                geometry = this.createD10Geometry();
                break;
            case 12:
                geometry = new THREE.DodecahedronGeometry(1, 0);
                break;
            case 20:
                geometry = new THREE.IcosahedronGeometry(1, 0);
                break;
            default:
                geometry = new THREE.IcosahedronGeometry(1, 0);
        }

        geometry.computeVertexNormals();
        return geometry;
    }

    createD10Geometry() {
        const phi = (1 + Math.sqrt(5)) / 2;
        const a = 1 / Math.sqrt(3);
        
        const vertices = [
            0, a, phi * a,
            0, a, -phi * a,
            0, -a, phi * a,
            0, -a, -phi * a,
            
            a, phi * a, 0,
            a, -phi * a, 0,
            -a, phi * a, 0,
            -a, -phi * a, 0,
            
            phi * a, 0, a,
            phi * a, 0, -a,
            -phi * a, 0, a,
            -phi * a, 0, -a
        ];
        
        const indices = [
            0, 4, 8,
            0, 8, 2,
            0, 2, 10,
            0, 10, 6,
            0, 6, 4,
            
            3, 9, 5,
            3, 5, 7,
            3, 7, 11,
            3, 11, 1,
            3, 1, 9,
            
            4, 6, 11,
            4, 11, 1,
            4, 1, 9,
            4, 9, 8,
            
            8, 9, 5,
            8, 5, 2,
            
            2, 5, 7,
            2, 7, 10,
            
            10, 7, 11,
            10, 11, 6,
            
            6, 11, 4
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();
        
        return geometry;
    }

    rollDice() {
        if (this.isRolling) return Promise.resolve(null);

        this.isRolling = true;
        const faces = this.dice.userData.faces;
        const randomValue = Math.floor(Math.random() * faces) + 1;

        anime({
            targets: this.dice.rotation,
            x: this.dice.rotation.x + Math.random() * 20,
            y: this.dice.rotation.y + Math.random() * 20,
            z: this.dice.rotation.z + Math.random() * 20,
            duration: 1200,
            easing: 'easeOutElastic(1, 0.7)'
        });

        anime({
            targets: this.dice.scale,
            x: [1.3, 1],
            y: [1.3, 1],
            z: [1.3, 1],
            duration: 600,
            easing: 'easeOutQuad'
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                this.isRolling = false;
                resolve(randomValue);
            }, 1300);
        });
    }

    updateDisplay(card, result) {
        const resultValue = card.querySelector('.result-value');
        if (resultValue) {
            resultValue.textContent = result;
        }

        this.stats.rolls.push(result);
        this.stats.total++;

        const lastRoll = card.querySelector('.last-roll');
        if (lastRoll) {
            lastRoll.textContent = result;
        } else {
            console.warn(`lastRoll element bulunamadı. Card:`, card);
        }

        this.saveStats();
    }

    saveStats() {
        localStorage.setItem(`diceStats-${this.diceType}`, JSON.stringify(this.stats));
    }

    loadStats() {
        const saved = localStorage.getItem(`diceStats-${this.diceType}`);
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.dice && !this.isRolling) {
            this.dice.rotation.x += 0.001;
            this.dice.rotation.y += 0.002;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize(canvas) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

const diceRollers = {};
const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

window.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    diceTypes.forEach(type => {
        diceRollers[type] = new DiceRoller(type, `diceCanvas-${type}`);
    });

    setupIndividualRolls();
    setupMultiRoll();
}

function setupIndividualRolls() {
    document.querySelectorAll('.dice-card').forEach(card => {
        const diceType = card.dataset.dice;
        const rollBtn = card.querySelector('.roll-btn');

        const saved = localStorage.getItem(`diceStats-${diceType}`);
        if (saved) {
            const stats = JSON.parse(saved);
            card.querySelector('.last-roll').textContent = stats.rolls[stats.rolls.length - 1] || '0';
        }

        rollBtn.addEventListener('click', async () => {
            rollBtn.disabled = true;
            const result = await diceRollers[diceType].rollDice();
            if (result !== null) {
                diceRollers[diceType].updateDisplay(card, result);
            }
            rollBtn.disabled = false;
        });
    });
}

function setupMultiRoll() {
    const multiRollBtn = document.getElementById('multiRollBtn');
    if (multiRollBtn) {
        multiRollBtn.addEventListener('click', handleMultiRoll);
    }
}

function handleMultiRoll() {
    const checkboxes = document.querySelectorAll('.dice-select:checked');
    
    if (checkboxes.length === 0) {
        alert('Lütfen en az bir zar seç!');
        return;
    }

    const multiRollBtn = document.getElementById('multiRollBtn');
    multiRollBtn.disabled = true;

    const selectedDice = Array.from(checkboxes).map(cb => cb.dataset.dice);
    const results = {};
    let completedCount = 0;

    selectedDice.forEach(diceType => {
        const card = document.querySelector(`.dice-card[data-dice="${diceType}"]`);
        if (!card) {
            console.error(`Zar kartı bulunamadı: ${diceType}`);
            completedCount++;
            return;
        }
        
        const roller = diceRollers[diceType];

        roller.rollDice().then(value => {
            console.log(`${diceType} atıldı: ${value}`);
            results[diceType] = value;
            if (value !== null && card) {
                roller.updateDisplay(card, value);
            }
            completedCount++;

            if (completedCount === selectedDice.length) {
                console.log('Tüm zarlar bitti. Sonuçlar:', results);
                setTimeout(() => {
                    displayResults(results, selectedDice);
                    checkboxes.forEach(cb => cb.checked = false);
                    multiRollBtn.disabled = false;
                }, 600);
            }
        }).catch(error => {
            console.error(`${diceType} hatası:`, error);
            completedCount++;
        });
    });
}

function displayResults(results, diceList) {
    let total = 0;
    let message = 'SONUÇLAR:\n\n';

    diceList.forEach(dice => {
        const value = results[dice];
        if (value !== undefined && value !== null) {
            total += value;
            message += `${dice.toUpperCase()}: ${value}\n`;
        }
    });

    message += `\nTOPLAM: ${total}`;
    alert(message);
}

function showRollResults(results, diceTypes) {
    const resultsBody = document.getElementById('resultsBody');
    const totalResult = document.getElementById('totalResult');
    const modal = document.getElementById('resultsModal');

    resultsBody.innerHTML = '';
    let total = 0;

    diceTypes.forEach((dice) => {
        const val = results[dice];
        if (val !== undefined && val !== null) {
            total += val;
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `<span style="font-weight:bold;">${dice.toUpperCase()}</span><span style="font-size:28px;color:#00d4ff;font-weight:bold;">${val}</span>`;
            resultsBody.appendChild(item);
        }
    });

    totalResult.textContent = `TOPLAM: ${total}`;
    modal.classList.add('show');
}

