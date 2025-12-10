lucide.createIcons();

class ParticleApp {
    constructor() {
        this.scene = null; this.camera = null; this.renderer = null; this.composer = null; this.particles = null;
        this.count = 8000; 
        this.positions = []; 
        this.targetColor = new THREE.Color(0xff3366);
        
        // Interaction State
        this.handCount = 0;
        this.handOpenness = 0; 
        this.handPosition = { x: 0, y: 0 };
        
        // Rotation (1 Hand)
        this.handAngle = 0; this.lastHandAngle = 0; this.rotationalVelocity = 0; this.hasPreviousAngle = false;
        
        // Rubber Band & Blast (2 Hands)
        this.handDx = 0; this.handDy = 0; 
        this.handSeparation = 0; 
        this.currentScaleX = 1.0; this.currentScaleY = 1.0;
        this.blastIntensity = 0; 
        
        // Gestures
        this.isShapeGestureActive = false; 
        this.isColorGestureActive = false; 
        
        this.shapeList = ['sphere', 'saturn', 'flowers', 'fireworks', 'dna', 'cube', 'torus'];
        this.currentShapeIndex = 0;

        this.colorList = [0xff3366, 0x33ccff, 0x00ff99, 0xffcc33, 0xffffff, 0xcc33ff];
        this.currentColorIndex = 0;
        
        this.currentTemplate = 'sphere'; 
        this.customText = "";
        
        this.clock = new THREE.Clock();
        this.time = 0;
        this.mouse = new THREE.Vector2();

        this.initThree();
        this.initParticles();
        this.initMediaPipe();
        this.animate();
        this.setupResize();
    }

    initThree() {
        const container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.002);
        this.scene.background = new THREE.Color(0x050505);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        container.appendChild(this.renderer.domElement);
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // POST PROCESSING CHAIN
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        
        // Bloom Pass (Glow)
        const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.0; bloomPass.strength = 1.8; bloomPass.radius = 0.5;
        
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    createTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    initParticles() {
        const geometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        for(let i = 0; i < this.count * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
            colors[i] = 1;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({
            size: 0.4, map: this.createTexture(), transparent: true, opacity: 0.9, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
        this.currentPositions = this.particles.geometry.attributes.position.array;
        this.generateShape('sphere');
    }

    sampleTextCoordinates(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800; canvas.height = 200;
        ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; ctx.font = '900 120px Inter, sans-serif'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const coords = [];
        const step = 4; 
        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const index = (y * canvas.width + x) * 4;
                if (data[index] > 128) { 
                    const px = (x - canvas.width / 2) * 0.08; 
                    const py = -(y - canvas.height / 2) * 0.08;
                    coords.push({x: px, y: py});
                }
            }
        }
        return coords;
    }

    generateShape(type) {
        this.positions = new Float32Array(this.count * 3);
        let textCoords = [];
        if (type === 'text') { textCoords = this.sampleTextCoordinates(this.customText); }

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            let x, y, z;
            if (type === 'text') {
                if (i < textCoords.length) { x = textCoords[i].x; y = textCoords[i].y; z = (Math.random() - 0.5) * 1.5; } 
                else { const r = 30 + Math.random() * 20; const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1); x = r * Math.sin(phi) * Math.cos(theta); y = r * Math.sin(phi) * Math.sin(theta); z = r * Math.cos(phi); }
            } 
            else if (type === 'saturn') {
                const rnd = Math.random();
                if (rnd > 0.3) { const angle = Math.random() * Math.PI * 2; const radius = 8 + Math.random() * 4; x = Math.cos(angle) * radius; z = Math.sin(angle) * radius; y = (Math.random() - 0.5) * 0.2; }
                else { const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1); const r = 4; x = r * Math.sin(phi) * Math.cos(theta); y = r * Math.sin(phi) * Math.sin(theta); z = r * Math.cos(phi); }
            } else if (type === 'flowers') {
                const goldenAngle = Math.PI * (3 - Math.sqrt(5)); const r = 0.3 * Math.sqrt(i); const theta = i * goldenAngle; x = r * Math.cos(theta); z = r * Math.sin(theta); y = Math.sqrt(r) * 1.5 - 5; 
            } else if (type === 'fireworks') {
                const r = 15 * Math.cbrt(Math.random()); const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1); x = r * Math.sin(phi) * Math.cos(theta); y = r * Math.sin(phi) * Math.sin(theta); z = r * Math.cos(phi);
            } else if (type === 'dna') {
                const helixRadius = 5; const height = 24; const turns = 3; 
                if (i < this.count * 0.7) { const t = (i / (this.count * 0.7)); y = (t - 0.5) * height; const angle = t * Math.PI * 2 * turns; const strandOffset = (i % 2 === 0) ? 0 : Math.PI; x = Math.cos(angle + strandOffset) * helixRadius; z = Math.sin(angle + strandOffset) * helixRadius; x += (Math.random() - 0.5) * 0.5; z += (Math.random() - 0.5) * 0.5; y += (Math.random() - 0.5) * 0.2; }
                else { const t = Math.random(); y = (t - 0.5) * height; const angle = t * Math.PI * 2 * turns; const mix = (Math.random() * 2) - 1; x = mix * Math.cos(angle) * helixRadius; z = mix * Math.sin(angle) * helixRadius; x += (Math.random() - 0.5) * 0.2; z += (Math.random() - 0.5) * 0.2; }
            } else if (type === 'cube') {
                const size = 12; x = (Math.random() - 0.5) * size; y = (Math.random() - 0.5) * size; z = (Math.random() - 0.5) * size;
            } else if (type === 'sphere') {
                const r = 8; const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1); x = r * Math.sin(phi) * Math.cos(theta); y = r * Math.sin(phi) * Math.sin(theta); z = r * Math.cos(phi); const fuzz = 1 + (Math.random() * 0.2); x *= fuzz; y *= fuzz; z *= fuzz;
            } else if (type === 'torus') {
                const u = Math.random() * Math.PI * 2; const v = Math.random() * Math.PI * 2; const R = 8; const r = 3; x = (R + r * Math.cos(v)) * Math.cos(u); y = (R + r * Math.cos(v)) * Math.sin(u); z = r * Math.sin(v); const tempY = y; y = z; z = tempY;
            }
            this.positions[i3] = x; this.positions[i3 + 1] = y; this.positions[i3 + 2] = z;
        }
    }

    cycleShape() {
        this.currentShapeIndex = (this.currentShapeIndex + 1) % this.shapeList.length;
        this.setTemplate(this.shapeList[this.currentShapeIndex]);
    }

    cycleColor() {
        this.currentColorIndex = (this.currentColorIndex + 1) % this.colorList.length;
        this.setColor(this.colorList[this.currentColorIndex]);
    }

    processText() {
        const input = document.getElementById('text-input');
        const text = input.value.trim();
        if (text) { this.customText = text; this.setTemplate('text'); input.value = ''; input.blur(); }
    }

    setTemplate(type) {
        this.currentTemplate = type; this.generateShape(type);
        document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('active', 'border-white/40', 'bg-white/20'));
        const btn = document.querySelector(`button[onclick="app.setTemplate('${type}')"]`);
        if(btn) btn.classList.add('active', 'border-white/40', 'bg-white/20');
    }

    setColor(hex) { this.targetColor.setHex(hex); }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;
        this.clock.getDelta();

        let factor = 1;
        let targetScaleX = 1.0;
        let targetScaleY = 1.0;
        let isClapping = false;

        // --- 2 HAND LOGIC ---
        if (this.handCount === 2) {
            targetScaleX = Math.max(0.5, this.handDx * 3.0); 
            targetScaleY = Math.max(0.5, this.handDy * 4.0); 
            if (this.handSeparation < 0.15) { isClapping = true; }
        } 
        else if (this.handCount === 1) {
            factor = 0.5 + (this.handOpenness * 2.5);
        } 
        else {
            factor = 1 + Math.sin(this.time * 2) * 0.3;
        }

        // Blast Intensity
        let targetBlast = isClapping ? 1.0 : 0.0;
        this.blastIntensity += (targetBlast - this.blastIntensity) * 0.1;

        this.currentScaleX += (targetScaleX - this.currentScaleX) * 0.1;
        this.currentScaleY += (targetScaleY - this.currentScaleY) * 0.1;
        this.particles.scale.set(this.currentScaleX, this.currentScaleY, 1.0);

        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;

        let physX = 9999, physY = 9999;
        if (this.handCount === 1) {
            physX = (this.handPosition.x - 0.5) * 30;
            physY = -(this.handPosition.y - 0.5) * 30;
        } else if (this.handCount === 0) {
            physX = this.mouse.x * 15;
            physY = this.mouse.y * 15;
        }
        
        let isAttracting = (this.handCount === 1 && this.handOpenness < 0.2);

        for(let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const tx = this.positions[i3];
            const ty = this.positions[i3+1];
            const tz = this.positions[i3+2];

            let expansion = factor;
            if (this.currentTemplate === 'fireworks') { expansion = factor * (1 + Math.sin(this.time + i * 0.01) * 0.2); }

            let targetX = tx * expansion;
            let targetY = ty * expansion;
            let targetZ = tz * expansion;

            // BLAST SCATTER
            let scatterX = Math.sin(i * 34.12) * 40 * this.blastIntensity;
            let scatterY = Math.cos(i * 12.34) * 40 * this.blastIntensity;
            let scatterZ = Math.sin(i * 56.78) * 40 * this.blastIntensity;

            targetX += scatterX;
            targetY += scatterY;
            targetZ += scatterZ;

            // Physics
            let px = positions[i3];
            let py = positions[i3+1];
            let dist = Math.sqrt((px - physX)**2 + (py - physY)**2);
            
            let forceX = 0, forceY = 0;

            if (isAttracting) {
                let pullStrength = 0.1;
                forceX = (physX - px) * pullStrength;
                forceY = (physY - py) * pullStrength;
                targetX = px + forceX;
                targetY = py + forceY;
                targetZ = targetZ * 0.9; 
            } else {
                let repelRadius = 5.0;
                if (dist < repelRadius) {
                    let force = (repelRadius - dist) / repelRadius; 
                    let angle = Math.atan2(py - physY, px - physX);
                    forceX = Math.cos(angle) * force * 5.0;
                    forceY = Math.sin(angle) * force * 5.0;
                }
            }

            let speed = isAttracting ? 0.05 : 0.2;
            if (this.blastIntensity > 0.1) speed = 0.4;

            positions[i3] += ((targetX + forceX) - positions[i3]) * speed;
            positions[i3+1] += ((targetY + forceY) - positions[i3+1]) * speed;
            positions[i3+2] += (targetZ - positions[i3+2]) * speed;

            colors[i3] += (this.targetColor.r - colors[i3]) * 0.05;
            colors[i3+1] += (this.targetColor.g - colors[i3+1]) * 0.05;
            colors[i3+2] += (this.targetColor.b - colors[i3+2]) * 0.05;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.color.needsUpdate = true;

        // Rotation
        let targetRotY = 0, targetRotX = 0;
        if (this.handCount === 1) {
            targetRotY = (this.handPosition.x - 0.5) * 2;
            targetRotX = (this.handPosition.y - 0.5) * 2;
        } else if (this.handCount === 0) {
            targetRotY = this.mouse.x;
            targetRotX = this.mouse.y;
        }

        this.particles.rotation.y += (targetRotY - this.particles.rotation.y) * 0.1;
        this.particles.rotation.x += (targetRotX - this.particles.rotation.x) * 0.1;

        if (this.handCount === 1 && this.hasPreviousAngle) {
            let delta = this.handAngle - this.lastHandAngle;
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            this.particles.rotation.z += delta;
            this.rotationalVelocity = this.rotationalVelocity * 0.5 + delta * 0.5;
        } else {
            this.particles.rotation.z += this.rotationalVelocity;
            this.rotationalVelocity *= 0.96; 
        }

        this.lastHandAngle = this.handAngle;
        this.hasPreviousAngle = (this.handCount === 1);

        this.composer.render();
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initMediaPipe() {
        const videoElement = document.getElementById('video-input');
        const canvasElement = document.getElementById('camera-feed');
        const canvasCtx = canvasElement.getContext('2d');
        const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        hands.onResults((results) => {
            canvasCtx.save(); canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                this.handCount = results.multiHandLandmarks.length;
                for (const landmarks of results.multiHandLandmarks) {
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
                    drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
                }
                if (this.handCount === 1) {
                    this.processOneHand(results.multiHandLandmarks[0]);
                    document.getElementById('status-text').innerText = "1 Hand: Control";
                } else if (this.handCount === 2) {
                    this.processTwoHands(results.multiHandLandmarks[0], results.multiHandLandmarks[1]);
                    document.getElementById('status-text').innerText = "2 Hands: Rubber Band";
                }
                document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
            } else {
                this.handCount = 0;
                document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
                document.getElementById('status-text').innerText = "Waiting for hands...";
            }
            canvasCtx.restore();
        });
        const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({image: videoElement}); }, width: 640, height: 480 });
        camera.start().then(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => { document.getElementById('loading-screen').style.display = 'none'; }, 1000);
        }).catch(err => { console.error(err); alert("Camera access denied."); document.getElementById('loading-screen').style.display = 'none'; });
    }

    processOneHand(landmarks) {
        const wrist = landmarks[0]; const tip = landmarks[12];
        const distanceY = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
        let openness = (distanceY - 0.2) * 2.5; openness = Math.max(0, Math.min(1, openness)); 
        this.handOpenness = openness; this.handPosition = { x: wrist.x, y: wrist.y };
        const dy = tip.y - wrist.y; const dx = tip.x - wrist.x;
        this.handAngle = Math.atan2(dy, dx) + (Math.PI / 2);

        // --- 1. ROCK SIGN DETECTION (Shape Switch) ---
        const isIndexUp = landmarks[8].y < landmarks[6].y;
        const isPinkyUp = landmarks[20].y < landmarks[18].y;
        const isMiddleDown = landmarks[12].y > landmarks[10].y;
        const isRingDown = landmarks[16].y > landmarks[14].y;

        const isRockSign = isIndexUp && isPinkyUp && isMiddleDown && isRingDown;

        if (isRockSign) {
            if (!this.isShapeGestureActive) {
                this.cycleShape();
                this.isShapeGestureActive = true;
            }
        } else {
            this.isShapeGestureActive = false;
        }

        // --- 2. PEACE SIGN (Color Switch) ---
        const isPeaceSign = (landmarks[8].y < landmarks[6].y) && (landmarks[12].y < landmarks[10].y) && (landmarks[16].y > landmarks[14].y) && (landmarks[20].y > landmarks[18].y);
        
        if (isPeaceSign) {
            if (!this.isColorGestureActive) {
                this.cycleColor();
                this.isColorGestureActive = true;
            }
        } else {
            this.isColorGestureActive = false;
        }
    }

    processTwoHands(hand1, hand2) {
        const x1 = hand1[0].x; const y1 = hand1[0].y;
        const x2 = hand2[0].x; const y2 = hand2[0].y;
        this.handDx = Math.abs(x2 - x1);
        this.handDy = Math.abs(y2 - y1);
        this.handSeparation = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        this.handPosition = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    }
}
const app = new ParticleApp();