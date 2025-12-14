lucide.createIcons();

class ParticleApp {
    constructor() {
        this.scene = null; this.camera = null; this.renderer = null; this.composer = null; this.particles = null;
        this.count = 25000; 
        this.positions = []; 
        this.targetColor = new THREE.Color(0xff3366);
        
        // Textures
        this.dotTexture = this.createDotTexture();
        this.heartTexture = this.createHeartTexture();
        
        // Interaction
        this.handCount = 0; this.handOpenness = 0; this.handPosition = { x: 0, y: 0 };
        this.handAngle = 0; this.lastHandAngle = 0; this.rotationalVelocity = 0; this.hasPreviousAngle = false;
        this.handDx = 0; this.handDy = 0; this.handSeparation = 0; 
        this.currentScaleX = 1.0; this.currentScaleY = 1.0; 
        
        // Destruction & Sequence
        this.blastIntensity = 0;
        this.isDoubleFist = false;
        this.isHeartBroken = false;
        this.isRainMode = false;
        this.isMerging = false;
        this.sequenceTimer = 0; 
        this.lastDestructionTime = -10;
        this.gestureCooldown = 0;
        
        // Gestures
        this.isShapeGestureActive = false; 
        this.isColorGestureActive = false; 
        this.isHeartGestureActive = false;
        
        // Audio
        this.audioContext = null; this.analyser = null; this.dataArray = null;
        this.isAudioActive = false; this.simulatedAudio = false;
        
        // SHAPE LIST
        this.shapeList = ['sphere', 'saturn', 'flowers', 'fireworks', 'dna', 'cube', 'torus', 'flower_pot', 'heart'];
        this.currentShapeIndex = 0;
        
        // NEON PALETTE
        this.colorList = [
            0xff0055, // Neon Red
            0x00ffff, // Cyan
            0x39ff14, // Green
            0xbc13fe, // Purple
            0xffea00, // Yellow
            0xff5e00, // Orange
            0xffffff  // White
        ];
        this.currentColorIndex = 0;
        this.currentTemplate = 'sphere'; 
        this.customText = "";
        
        this.clock = new THREE.Clock();
        this.time = 0;
        this.mouse = new THREE.Vector2();

        this.initThree();
        this.initParticles();
        document.getElementById('start-btn').classList.remove('hidden');
    }

    async startApp() {
        document.getElementById('loading-screen').style.display = 'none';
        this.initMediaPipe();
        this.initAudio(); 
        this.animate();
        this.setupResize();
    }

    initAudio() {
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.85;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.isAudioActive = true;
        })
        .catch(err => {
            console.warn("Microphone denied.");
            this.isAudioActive = false;
            this.simulatedAudio = true;
        });
        const bg = document.getElementById('bg-music');
        if(bg) bg.play().catch(e=>{});
    }

    toggleAudio() {
        const audio = document.getElementById('bg-music');
        if (audio.paused) {
            audio.play();
            if(this.audioContext) this.audioContext.resume();
            document.getElementById('audio-icon').setAttribute('data-lucide', 'volume-2');
        } else {
            audio.pause();
            document.getElementById('audio-icon').setAttribute('data-lucide', 'volume-x');
        }
        lucide.createIcons();
    }

    initThree() {
        const container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);
        
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.0; bloomPass.strength = 2.0; bloomPass.radius = 0.5;
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    // 1. ORIGINAL DOT TEXTURE
    createDotTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 32, 32);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // 2. TINY HEART TEXTURE
    createHeartTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64; 
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath();
        const x = 32, y = 32;
        ctx.moveTo(x, y + 20);
        ctx.bezierCurveTo(x + 22, y + 8, x + 22, y - 14, x, y - 6);
        ctx.bezierCurveTo(x - 22, y - 14, x - 22, y + 8, x, y + 20);
        ctx.fill();
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    initParticles() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(this.count * 3);
        const col = new Float32Array(this.count * 3);
        for(let i=0; i<this.count*3; i++) { pos[i] = (Math.random()-0.5)*50; col[i] = 1; }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        
        // Default Material (Dot)
        const mat = new THREE.PointsMaterial({ 
            size: 0.35, 
            map: this.dotTexture, 
            transparent: true, 
            opacity: 0.9, 
            vertexColors: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false 
        });
        
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
        this.currentPositions = this.particles.geometry.attributes.position.array;
        this.generateShape('sphere');
    }

    // --- ANIMATION LOOP (REVERTED HEARTBREAK) ---
    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;
        this.clock.getDelta();
        if(this.gestureCooldown > 0) this.gestureCooldown--;

        this.blastIntensity *= 0.92; 

        let bassFactor = 0;
        let freqData = [];
        if (this.isAudioActive && this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
            freqData = this.dataArray; 
            let sum = 0; for(let i=0; i<10; i++) sum += this.dataArray[i];
            let avg = sum / 10;
            if (avg > 50) bassFactor = (avg - 50) / 100;
        } else {
            bassFactor = Math.sin(this.time * 2) * 0.1;
        }

        let isHeartMode = (this.currentTemplate === 'heart');
        let isFlowerMode = (this.currentTemplate === 'flower_pot');
        let isTextMode = (this.currentTemplate === 'text');
        
        let factor = 1.0;
        let scaleX = 1.0, scaleY = 1.0;
        
        if (isHeartMode || isTextMode) {
            factor = 1.0 + (bassFactor * 1.5); 
            if(isHeartMode && !this.isHeartBroken && !this.isRainMode) this.targetColor.setHex(0xff0000); 
        } 
        else if (isFlowerMode) { factor = 1.0 + (bassFactor * 0.2); }
        else {
            factor = 1.0 + bassFactor * 2.0; 
            if (this.handCount === 2) {
                scaleX = Math.max(0.5, this.handDx * 3.0); 
                scaleY = Math.max(0.5, this.handDy * 4.0); 
            } else if (this.handCount === 1) {
                factor += (this.handOpenness * 1.5);
            } else {
                factor = 1.2;
            }
        }

        // --- SEQUENCE LOGIC ---
        
        // 1. Rain to Heart Sequence
        if (this.isRainMode) {
            let elapsed = this.time - this.lastDestructionTime;
            // Heavy Rain of Hearts for 4 seconds
            if (elapsed > 4.0 && !this.isMerging) {
                this.isMerging = true;
                this.generateShape('heart'); 
                this.updateStatus("❤️ FORMING LOVE");
            }
            // Merge finishes at 6 seconds
            if (elapsed > 6.0) {
                this.isRainMode = false;
                this.isMerging = false;
                this.setTemplate('heart');
                this.updateStatus("❤️ POUR TOI");
            }
        }

        // 2. Heartbreak to Flower
        if (this.isHeartBroken) {
            if (this.time - this.lastDestructionTime > 2.0) { 
                this.isHeartBroken = false; 
                this.setTemplate('flower_pot'); 
                this.updateStatus("🌹 FOR YOU");
            }
        }

        if (!this.isHeartBroken && !this.isRainMode) {
            this.currentScaleX += (scaleX - this.currentScaleX) * 0.2; 
            this.currentScaleY += (scaleY - this.currentScaleY) * 0.2;
            this.particles.scale.set(this.currentScaleX, this.currentScaleY, 1.0);
        }

        const positions = this.particles.geometry.attributes.position.array;
        const colors = this.particles.geometry.attributes.color.array;

        let physX = (this.handCount === 1) ? (this.handPosition.x - 0.5) * 30 : this.mouse.x * 15;
        let physY = (this.handCount === 1) ? -(this.handPosition.y - 0.5) * 30 : this.mouse.y * 15;
        let isAttracting = (this.handCount === 1 && this.handOpenness < 0.2 && !isHeartMode && !isFlowerMode && !this.isRainMode && !isTextMode);

        for(let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            
            // 1. RAIN MODE (RAIN OF HEARTS)
            if (this.isRainMode) {
                if (this.isMerging) {
                    let tx = this.positions[i3];
                    let ty = this.positions[i3+1];
                    let tz = this.positions[i3+2];
                    let mergeSpeed = 0.12; 
                    positions[i3] += (tx - positions[i3]) * mergeSpeed;
                    positions[i3+1] += (ty - positions[i3+1]) * mergeSpeed;
                    positions[i3+2] += (tz - positions[i3+2]) * mergeSpeed;
                    colors[i3] += (1.0 - colors[i3]) * 0.1;
                    colors[i3+1] += (0.0 - colors[i3+1]) * 0.1;
                    colors[i3+2] += (0.0 - colors[i3+2]) * 0.1;
                } else {
                    let speed = 0.2 + (Math.random() * 0.4);
                    positions[i3+1] -= speed + (bassFactor * 0.5); 
                    
                    if (positions[i3+1] < -25) { 
                        positions[i3+1] = 25; 
                        positions[i3] = (Math.random()-0.5) * 200; 
                        positions[i3+2] = (Math.random()-0.5) * 80; 
                    }
                    
                    if(i % 3 === 0) { colors[i3]=1.0; colors[i3+1]=0.2; colors[i3+2]=0.6; } 
                    else if (i % 3 === 1) { colors[i3]=1.0; colors[i3+1]=0.8; colors[i3+2]=0.8; } 
                    else { colors[i3]=1.0; colors[i3+1]=1.0; colors[i3+2]=1.0; }
                }
                continue; 
            }

            // 2. HEARTBREAK (SADNESS) - REVERTED TO ORIGINAL
            else if (this.isHeartBroken) {
                positions[i3+1] -= 0.3; 
                if (positions[i3] < 0) positions[i3] -= 0.05; else positions[i3] += 0.05;
                if (i % 2 === 0) { colors[i3]=0.5; colors[i3+1]=0.5; colors[i3+2]=0.5; } 
                else { colors[i3]=0.8; colors[i3+1]=0.8; colors[i3+2]=0.9; }
                colors[i3] *= 0.95; colors[i3+1] *= 0.95; colors[i3+2] *= 0.95;
                continue; 
            }

            // --- STANDARD MODES ---
            let tx = this.positions[i3];
            let ty = this.positions[i3+1];
            let tz = this.positions[i3+2];

            // 3. FLOWER COLORS
            if (isFlowerMode) {
                const flowerLimit = this.count * 0.7;
                if (i < flowerLimit) {
                    if (ty > 7.5) { this.targetColor.setRGB(1.0, 0.0, 0.2); if(Math.random()>0.95) this.targetColor.setRGB(1,0.8,0.8); } 
                    else if (ty > 0.5) { this.targetColor.setRGB(0.1, 0.8, 0.1); } 
                    else { this.targetColor.setRGB(0.7, 0.35, 0.1); } 
                } else {
                    this.targetColor.setRGB(1.0, 1.0, 1.0); 
                }
            }

            // 4. EQ & TURBULENCE
            let freqIndex = Math.floor((i % 512)); 
            let eqVal = 0;
            if(freqData[freqIndex]) eqVal = freqData[freqIndex] / 255.0;
            let stability = (isHeartMode || isFlowerMode || isTextMode) ? 0.2 : 4.0;
            let eqPush = 1.0 + (eqVal * stability);
            tx *= eqPush * factor; ty *= eqPush * factor; tz *= eqPush * factor;

            if (!isHeartMode && !isFlowerMode) {
                let noise = Math.sin(this.time * 5 + i) * 0.2; 
                tx += noise; ty += noise; tz += noise;
            }

            // 5. BOMB BLAST
            if (this.blastIntensity > 0.1) {
                let scatter = this.blastIntensity * 50;
                tx += (Math.random()-0.5) * scatter; 
                ty += (Math.random()-0.5) * scatter; 
                tz += (Math.random()-0.5) * scatter;
            }

            // 6. PHYSICS
            let forceX = 0, forceY = 0;
            if (!isHeartMode && !isFlowerMode && !isTextMode && !this.isDoubleFist) {
                let px = positions[i3], py = positions[i3+1];
                let dist = Math.sqrt((px - physX)**2 + (py - physY)**2);
                if (isAttracting) {
                    let s = 0.15;
                    forceX = (physX - px) * s; forceY = (physY - py) * s;
                    tx = px + forceX; ty = py + forceY; 
                } else if (dist < 5.0) {
                    let f = (5.0 - dist) / 5.0;
                    let a = Math.atan2(py - physY, px - physX);
                    forceX = Math.cos(a) * f * 5.0; forceY = Math.sin(a) * f * 5.0;
                }
            }

            // --- SPEED CONTROL ---
            // Kept the faster formation speed as that wasn't part of the heartbreak effect itself
            let speed = (isAttracting ? 0.08 : 0.4);
            if (isHeartMode) speed = 0.85; 
            if (this.blastIntensity > 1.0) speed = 0.5;

            if(!isHeartMode && !isFlowerMode && !isTextMode) { tx += (Math.random()-0.5)*0.2; ty += (Math.random()-0.5)*0.2; }

            positions[i3] += ((tx + forceX) - positions[i3]) * speed;
            positions[i3+1] += ((ty + forceY) - positions[i3+1]) * speed;
            positions[i3+2] += (tz - positions[i3+2]) * speed;

            // Color
            colors[i3] += (this.targetColor.r - colors[i3]) * 0.1;
            colors[i3+1] += (this.targetColor.g - colors[i3+1]) * 0.1;
            colors[i3+2] += (this.targetColor.b - colors[i3+2]) * 0.1;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.color.needsUpdate = true;

        // Rotation
        if (isHeartMode || isFlowerMode || this.isRainMode || isTextMode) {
            this.particles.rotation.x += (0 - this.particles.rotation.x) * 0.1;
            this.particles.rotation.y += (0 - this.particles.rotation.y) * 0.1;
            this.particles.rotation.z += (0 - this.particles.rotation.z) * 0.1;
            
            if(this.handCount === 1 && this.hasPreviousAngle) {
                 let d = this.handAngle - this.lastHandAngle;
                 if(d>Math.PI) d-=Math.PI*2; if(d<-Math.PI) d+=Math.PI*2;
                 this.particles.rotation.z += d;
            }

        } else {
            let targetRotY = (this.handCount === 1) ? (this.handPosition.x - 0.5) * 2 : this.mouse.x;
            let targetRotX = (this.handCount === 1) ? (this.handPosition.y - 0.5) * 2 : this.mouse.y;
            this.particles.rotation.y += (targetRotY - this.particles.rotation.y) * 0.1;
            this.particles.rotation.x += (targetRotX - this.particles.rotation.x) * 0.1;
            
            if (this.handCount === 1 && this.hasPreviousAngle) {
                let d = this.handAngle - this.lastHandAngle;
                if (d > Math.PI) d -= Math.PI * 2;
                if (d < -Math.PI) d += Math.PI * 2;
                this.particles.rotation.z += d;
            }
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

    updateStatus(msg) {
        document.getElementById('status-text').innerText = msg;
    }

    sampleTextCoordinates(text, offsetX = 0, offsetY = 0) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1000; canvas.height = 300; 
        ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; 
        ctx.font = 'bold 100px Arial'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);
        
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const coords = [];
        for (let y = 0; y < canvas.height; y += 4) {
            for (let x = 0; x < canvas.width; x += 4) {
                if (data[(y * canvas.width + x) * 4] > 128) {
                    coords.push({
                        x: (x - canvas.width/2)*0.08 + offsetX, 
                        y: -(y - canvas.height/2)*0.08 + offsetY
                    });
                }
            }
        }
        return coords;
    }

    generateShape(type) {
        this.positions = new Float32Array(this.count * 3);
        if (type === 'rain_mode') return; 

        let textCoords = [];
        let leftText = [], rightText = [];
        
        if (type === 'text') {
            textCoords = this.sampleTextCoordinates(this.customText, 0, 0);
        } else if (type === 'flower_pot') {
            leftText = this.sampleTextCoordinates("POUR", -25, 0);
            rightText = this.sampleTextCoordinates("TOI", 25, 0);
        }

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            let x, y, z;
            
            if (type === 'text') {
                if (textCoords.length > 0) {
                    let pt = textCoords[i % textCoords.length];
                    x = pt.x; y = pt.y; z = (Math.random()-0.5) * 1.5; 
                } else { x=0;y=0;z=0; }
                if(i > this.count * 0.8) { x = (Math.random()-0.5)*60; y=(Math.random()-0.5)*30; z=(Math.random()-0.5)*30; }
            }
            else if (type === 'flower_pot') {
                const flowerLimit = this.count * 0.7; 
                if (i < flowerLimit) {
                    let fi = i; let fCount = flowerLimit;
                    const fHead = fCount * 0.30;
                    const fStem = fCount * 0.20;
                    const fLeaf = fCount * 0.15;
                    
                    if (fi < fHead) { 
                        const u = Math.random() * Math.PI * 2; const v = Math.random() * Math.PI;
                        let r = 3.5 + 1.5 * Math.sin(6 * u) * Math.sin(v);
                        x = r * Math.sin(v) * Math.cos(u); z = r * Math.sin(v) * Math.sin(u); y = r * Math.cos(v) + 9;
                        x+=(Math.random()-0.5); z+=(Math.random()-0.5);
                    } else if (fi < fHead + fStem) { 
                        const t = Math.random(); y = (t * 8) + 0.5; 
                        x = Math.sin(t * Math.PI) * 1.2 + (Math.random()-0.5)*0.5; z = Math.cos(t * Math.PI) * 0.6 + (Math.random()-0.5)*0.5;
                    } else if (fi < fHead + fStem + fLeaf) { 
                        const leafWhich = i % 2; const t = Math.random(); 
                        let attachY = (leafWhich===0)?3:5; let dirX = (leafWhich===0)?1:-1;
                        let width = Math.sin(t * Math.PI) * 1.8 * (Math.random()*0.6+0.4);
                        x = (dirX * t * 4.5) + (Math.random()-0.5) * width; z = (Math.random()-0.5) * width * 0.5; y = attachY + (t * 0.5) - (t*t*1.2);
                    } else { 
                        let h = 9; let yNorm = Math.random();
                        y = (yNorm * h) - 9.5; 
                        let r = 4.5 + (yNorm * 2.0) * (0.85 + 0.15*Math.random()); 
                        let ang = Math.random()*Math.PI*2;
                        x = Math.cos(ang)*r; z = Math.sin(ang)*r;
                    }
                } else {
                    let remaining = i - flowerLimit;
                    let totalText = this.count - flowerLimit;
                    if (remaining < totalText / 2) {
                        if(leftText.length > 0) { let pt = leftText[remaining % leftText.length]; x = pt.x; y = pt.y; z = 0; } else { x=0;y=0;z=0; }
                    } else {
                        if(rightText.length > 0) { let pt = rightText[remaining % rightText.length]; x = pt.x; y = pt.y; z = 0; } else { x=0;y=0;z=0; }
                    }
                }
            }
            else if (type === 'heart') {
                const t = Math.random() * Math.PI * 2; const r = 10 * Math.sqrt(Math.random()); 
                x = r * 16 * Math.pow(Math.sin(t), 3); y = r * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                z = (Math.random() - 0.5) * r * 5; x *= 0.05; y *= 0.05; z *= 0.05; y += 0.2; 
            }
            else if (type === 'sphere') {
                let r=8, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
                x=r*Math.sin(p)*Math.cos(t); y=r*Math.sin(p)*Math.sin(t); z=r*Math.cos(p);
                let f = 1 + Math.random()*0.2; x*=f; y*=f; z*=f;
            } else if (type === 'saturn') {
                if(Math.random()>0.3) { let a=Math.random()*Math.PI*2, r=8+Math.random()*4; x=Math.cos(a)*r; z=Math.sin(a)*r; y=(Math.random()-0.5)*0.2; }
                else { let t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1), r=4; x=r*Math.sin(p)*Math.cos(t); y=r*Math.sin(p)*Math.sin(t); z=r*Math.cos(p); }
            } else if (type === 'flowers') {
                let r = 0.3*Math.sqrt(i), t = i * (Math.PI * (3 - Math.sqrt(5)));
                x = r*Math.cos(t); z = r*Math.sin(t); y = Math.sqrt(r)*1.5 - 5;
            } else if (type === 'dna') {
                let t = (i/(this.count*0.7)), h = 24; y = (t-0.5)*h;
                if (i < this.count*0.7) {
                    let ang = t*Math.PI*2*3, off = (i%2===0)?0:Math.PI;
                    x = Math.cos(ang+off)*5; z = Math.sin(ang+off)*5;
                } else {
                    let ang = Math.random()*Math.PI*2*3, m = (Math.random()*2)-1;
                    x = m*Math.cos(ang)*5; z = m*Math.sin(ang)*5; y = (Math.random()-0.5)*h;
                }
            } else if (type === 'cube') {
                x=(Math.random()-0.5)*12; y=(Math.random()-0.5)*12; z=(Math.random()-0.5)*12;
            } else if (type === 'torus') {
                let u=Math.random()*Math.PI*2, v=Math.random()*Math.PI*2, R=8, r=3;
                x=(R+r*Math.cos(v))*Math.cos(u); y=(R+r*Math.cos(v))*Math.sin(u); z=r*Math.sin(v);
            } else if (type === 'fireworks') {
                let r=15*Math.cbrt(Math.random()), t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
                x=r*Math.sin(p)*Math.cos(t); y=r*Math.sin(p)*Math.sin(t); z=r*Math.cos(p);
            }
            this.positions[i3] = x; this.positions[i3+1] = y; this.positions[i3+2] = z;
        }
    }

    cycleShape() { 
        // SAFE CYCLE
        const safeShapes = ['sphere', 'saturn', 'flowers', 'fireworks', 'dna', 'cube', 'torus'];
        
        let currentSafeIndex = safeShapes.indexOf(this.currentTemplate);
        if (currentSafeIndex === -1) currentSafeIndex = 0; 

        let nextShape = safeShapes[(currentSafeIndex + 1) % safeShapes.length];
        this.setTemplate(nextShape); 
    }
    
    cycleColor() { this.currentColorIndex=(this.currentColorIndex+1)%this.colorList.length; this.setColor(this.colorList[this.currentColorIndex]); }
    processText() { const t=document.getElementById('text-input').value.trim(); if(t){ this.customText=t; this.setTemplate('text'); } }
    
    setTemplate(type) {
        this.currentTemplate = type;
        const idx = this.shapeList.indexOf(type);
        if (idx !== -1) this.currentShapeIndex = idx;
        
        // RESET SPECIAL STATES
        this.isHeartBroken = false;
        
        if (type !== 'rain_mode') {
            this.isRainMode = false;
            // SWITCH TEXTURE: Use Dot for normal shapes
            this.particles.material.map = this.dotTexture;
            this.particles.material.size = 0.35;
        } else {
            // SWITCH TEXTURE: Use Heart for Rain
            this.particles.material.map = this.heartTexture;
            this.particles.material.size = 1.2;
        }
        
        this.isMerging = false;
        this.isDoubleFist = false;
        this.isHeartGestureActive = false;
        
        if(type !== 'rain_mode') this.generateShape(type);
        
        document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('active', 'border-white/40', 'bg-white/20'));
        const btn = document.getElementById('btn-' + type);
        if(btn) btn.classList.add('active', 'border-white/40', 'bg-white/20');
        if (type !== 'heart' && type !== 'flower_pot' && type !== 'rain_mode') { 
            this.setColor(this.colorList[this.currentColorIndex]); 
        }
        this.updateStatus("SHAPE: " + type.toUpperCase());
    }

    setColor(hex) { this.targetColor.setHex(hex); }

    calculateOpenness(landmarks) {
        const w=landmarks[0], t=landmarks[12];
        const d = Math.sqrt(Math.pow(t.x-w.x,2)+Math.pow(t.y-w.y,2));
        return Math.max(0, Math.min(1, (d - 0.2)*2.5));
    }

    initMediaPipe() {
        const video = document.getElementById('video-input');
        const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        
        hands.onResults((results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                this.handCount = results.multiHandLandmarks.length;
                if (this.handCount === 1) this.processOneHand(results.multiHandLandmarks[0]);
                else if (this.handCount === 2) this.processTwoHands(results.multiHandLandmarks[0], results.multiHandLandmarks[1]);
                document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                document.getElementById('status-text').innerText = "Hands Connected";
            } else {
                this.handCount = 0;
                document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
                document.getElementById('status-text').innerText = "Waiting for hands...";
            }
        });

        const camera = new Camera(video, { onFrame: async () => { await hands.send({image: video}); }, width: 640, height: 480 });
        camera.start();
    }

    processOneHand(lm) {
        const w=lm[0], t=lm[12];
        this.handOpenness = this.calculateOpenness(lm);
        this.handPosition = { x: w.x, y: w.y };
        const dy=t.y-w.y, dx=t.x-w.x;
        this.handAngle = Math.atan2(dy, dx) + Math.PI/2;

        if (this.gestureCooldown > 0) return;

        // PINCH GUARD
        const thumbTip = lm[4];
        const middleTip = lm[12];
        const pinchDist = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
        if (pinchDist < 0.06) return; 

        const isRock = (lm[8].y<lm[6].y && lm[20].y<lm[18].y && lm[12].y>lm[10].y && lm[16].y>lm[14].y);
        if (isRock) {
            this.cycleShape(); 
            this.updateStatus("🤘 ROCK: NEXT SHAPE");
            this.gestureCooldown = 20; 
            return;
        }

        const isPeace = (lm[8].y<lm[6].y && lm[12].y<lm[10].y && lm[16].y>lm[14].y && lm[20].y>lm[18].y);
        if (isPeace) {
            this.cycleColor(); 
            this.updateStatus("✌️ PEACE: NEXT COLOR");
            this.gestureCooldown = 20;
        }
    }

    // --- TWO HANDS LOGIC (REVERTED HEARTBREAK) ---
    processTwoHands(h1, h2) {
        const x1=h1[0].x, y1=h1[0].y, x2=h2[0].x, y2=h2[0].y;
        this.handDx = Math.abs(x2-x1); this.handDy = Math.abs(y2-y1);
        this.handSeparation = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
        this.handPosition = { x: (x1+x2)/2, y: (y1+y2)/2 };

        if(this.gestureCooldown > 0) return;

        // 1. HEART DETECTION
        const idxDist = Math.sqrt(Math.pow(h1[8].x - h2[8].x, 2) + Math.pow(h1[8].y - h2[8].y, 2));
        const thmDist = Math.sqrt(Math.pow(h1[4].x - h2[4].x, 2) + Math.pow(h1[4].y - h2[4].y, 2));
        const midDist = Math.sqrt(Math.pow(h1[12].x - h2[12].x, 2) + Math.pow(h1[12].y - h2[12].y, 2));
        const leftPinkyDown = h1[20].y > h1[18].y;
        const rightPinkyDown = h2[20].y > h2[18].y;

        // Strict Heart check
        if (idxDist < 0.06 && thmDist < 0.06 && leftPinkyDown && rightPinkyDown) {
            this.isHeartGestureActive = true; 

            if (this.currentTemplate !== 'heart') {
                this.setTemplate('heart');
                this.setColor(0xff0000); 
                this.updateStatus("❤️ LOVE DETECTED");
                this.gestureCooldown = 30;
            }
            return; 
        } else if (idxDist > 0.15) {
            this.isHeartGestureActive = false; 
        }

        // 2. HEARTBREAK LOGIC (REVERTED TO ORIGINAL)
        // It is easier to break now (0.25 distance) and can break while holding the gesture.
        const verticalDiff = Math.abs(h1[0].y - h2[0].y);
        if (this.currentTemplate === 'heart' && this.handSeparation > 0.25 && verticalDiff < 0.15 && !this.isHeartBroken) {
            this.isHeartBroken = true;
            this.lastDestructionTime = this.time; 
            this.updateStatus("💔 HEARTBROKEN");
            this.gestureCooldown = 30;
            return;
        }

        // 3. DOUBLE FIST LOGIC
        const leftFist = h1[8].y > h1[6].y && h1[12].y > h1[10].y;
        const rightFist = h2[8].y > h2[6].y && h2[12].y > h2[10].y;
        
        if (leftFist && rightFist && !this.isHeartGestureActive) {
            if(!this.isDoubleFist) {
                this.isDoubleFist = true;
                
                if (this.currentTemplate === 'flower_pot') {
                    if (!this.isRainMode) {
                        this.isRainMode = true;
                        this.setTemplate('rain_mode'); 
                        this.lastDestructionTime = this.time; 
                        this.updateStatus("🌧️ LOVE RAIN");
                    }
                } else {
                    this.blastIntensity = 5.0; 
                    this.updateStatus("💥 BANG! REFORMING...");
                }
            }
        } else {
            this.isDoubleFist = false;
        }
    }
}
const app = new ParticleApp();