class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        let m = this.mag();
        if (m !== 0) this.mult(1 / m);
        return this;
    }
}

class Perlin {
    constructor() {
        this.p = new Uint8Array(512);
        this.permutation = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(Math.random() * 256);
        }
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i % 256];
        }
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y, z) {
        let h = hash & 15;
        let u = h < 8 ? x : y;
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    noise(x, y, z) {
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;
        let Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        let u = this.fade(x), v = this.fade(y), w = this.fade(z);
        let A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
        let B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
            this.grad(this.p[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                this.grad(this.p[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                    this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
    }
}

class FluidAmbient {
    constructor() {
        this.canvas = document.getElementById('ambient-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.perlin = new Perlin();
        this.zOff = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.render();
    }
    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.cols = Math.floor(this.width / 45);
        this.rows = Math.floor(this.height / 45);
    }
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#080607';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        let yOff = 0;
        for (let y = 0; y < this.rows; y++) {
            let xOff = 0;
            for (let x = 0; x < this.cols; x++) {
                let angle = this.perlin.noise(xOff, yOff, this.zOff) * Math.PI * 4;
                let v = new Vector(Math.cos(angle), Math.sin(angle));
                let px = x * 45;
                let py = y * 45;
                let intensity = (this.perlin.noise(xOff + 10, yOff + 10, this.zOff) + 1) / 2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(px, py);
                this.ctx.lineTo(px + v.x * 35 * intensity, py + v.y * 35 * intensity);
                
                let isLunaZone = py > this.height * 0.6;
                if(isLunaZone) {
                    this.ctx.strokeStyle = `rgba(100,124,232, ${intensity * 0.15})`;
                } else {
                    this.ctx.strokeStyle = `rgba(123,43,54, ${intensity * 0.15})`;
                }
                
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                xOff += 0.06;
            }
            yOff += 0.06;
        }
        this.zOff += 0.0015;
        requestAnimationFrame(() => this.render());
    }
}

class TiltCards {
    constructor() {
        // Manyetik 3D efekti SADECE en üstteki ana portfolio balonuna uyguluyoruz
        this.cards = document.querySelectorAll('.profile-bubble.interact-card');
        this.cards.forEach(card => this.bindEvents(card));
    }
    bindEvents(card) {
        card.addEventListener('mousemove', (e) => {
            let rect = card.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            let cx = rect.width / 2;
            let cy = rect.height / 2;
            let rx = (cy - y) / 35;
            let ry = (x - cx) / 35;
            card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.01, 1.01, 1.01)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    }
}

class TextScrambler {
    constructor() {
        this.elements = document.querySelectorAll('.scramble-text');
        this.chars = '!<>-_\\/[]{}—=+*^?#_ЖЗЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
        this.elements.forEach(el => {
            el.addEventListener('mouseenter', () => this.scramble(el));
            setTimeout(() => this.scramble(el), 500);
        });
    }
    scramble(element) {
        const original = element.getAttribute('data-value');
        let queue = [];
        for (let i = 0; i < original.length; i++) {
            let start = Math.floor(Math.random() * 15);
            let end = start + Math.floor(Math.random() * 15);
            queue.push({ char: original[i], start, end });
        }
        
        let frame = 0;
        const update = () => {
            let output = '';
            let complete = 0;
            for (let i = 0; i < queue.length; i++) {
                let { char, start, end } = queue[i];
                if (frame >= end) {
                    complete++;
                    output += char;
                } else if (frame >= start) {
                    output += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    output += char;
                }
            }
            element.innerText = output;
            if (complete === queue.length) return;
            frame++;
            requestAnimationFrame(update);
        };
        update();
    }
}

class SpotifyWave {
    constructor() {
        this.canvas = document.getElementById('spotify-wave-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.bars = [];
        this.time = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initBars();
        this.render();
    }
    resize() {
        let rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
        this.initBars();
    }
    initBars() {
        this.bars = [];
        let numBars = Math.floor(this.width / 9);
        for (let i = 0; i < numBars; i++) {
            this.bars.push({
                x: i * 9 + 3,
                w: 5,
                h: 5,
                tH: 5,
                speed: Math.random() * 0.1 + 0.05
            });
        }
    }
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.time += 0.04;
        
        for (let i = 0; i < this.bars.length; i++) {
            let b = this.bars[i];
            let noise = Math.sin(i * 0.2 + this.time) * Math.cos(i * 0.1 - this.time * 0.5);
            b.tH = Math.abs(noise) * (this.height - 15) + 5;
            b.h += (b.tH - b.h) * b.speed;
            
            let y = (this.height - b.h) / 2;
            let grad = this.ctx.createLinearGradient(b.x, y, b.x, y + b.h);
            grad.addColorStop(0, '#b44a58');
            grad.addColorStop(1, '#47242b');
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.roundRect(b.x, y, b.w, b.h, 2.5);
            this.ctx.fill();
        }
        requestAnimationFrame(() => this.render());
    }
}

class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.fade-in');
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
        
        this.elements.forEach(el => this.observer.observe(el));
    }
}

const app = {
    init() {
        this.ambient = new FluidAmbient();
        this.tilts = new TiltCards(); 
        this.scrambler = new TextScrambler();
        this.wave = new SpotifyWave();
        this.reveal = new ScrollReveal();
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());
