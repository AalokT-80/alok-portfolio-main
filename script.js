/**
 * Portfolio scripts
 * Canvas background + scroll animations
 * Started with way more effects, scaled back to this.
 */

(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ───────────────────────────────────────────────
    // Canvas Background
    // Just some floating dots. Nothing fancy.
    // ───────────────────────────────────────────────
    function initCanvas() {
        const canvas = document.getElementById('neural-canvas');
        if (!canvas || prefersReducedMotion) {
            if (canvas) canvas.style.display = 'none';
            return;
        }

        const ctx = canvas.getContext('2d');
        let animationId;
        let nodes = [];
        let mouse = { x: null, y: null };

        // 40 nodes was enough. More just looked busy.
        const nodeCount = 40;
        const connectionDistance = 120;
        const mouseRadius = 80;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createNodes() {
            nodes = [];
            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    radius: Math.random() * 1 + 0.5
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // lines between nearby nodes - bumped opacity slightly for visibility
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        const opacity = (1 - dist / connectionDistance) * 0.1;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(180, 180, 187, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            // the dots
            for (const node of nodes) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(180, 180, 187, 0.35)';
                ctx.fill();
            }
        }

        function update() {
            for (const node of nodes) {
                // gentle push away from cursor
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - node.x;
                    const dy = mouse.y - node.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < mouseRadius && dist > 0) {
                        const force = (mouseRadius - dist) / mouseRadius;
                        node.vx -= (dx / dist) * force * 0.01;
                        node.vy -= (dy / dist) * force * 0.01;
                    }
                }

                node.x += node.vx;
                node.y += node.vy;

                // friction
                node.vx *= 0.99;
                node.vy *= 0.99;

                // small random movement
                node.vx += (Math.random() - 0.5) * 0.006;
                node.vy += (Math.random() - 0.5) * 0.006;

                // stay in bounds
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

                node.x = Math.max(0, Math.min(canvas.width, node.x));
                node.y = Math.max(0, Math.min(canvas.height, node.y));
            }
        }

        function animate() {
            draw();
            update();
            animationId = requestAnimationFrame(animate);
        }

        // event listeners
        window.addEventListener('resize', () => {
            resize();
            createNodes();
        });

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        // pause when tab isn't visible — saves battery
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else {
                animate();
            }
        });

        resize();
        createNodes();
        animate();
    }

    // ───────────────────────────────────────────────
    // Decrypt effect on hero text
    // Could probably remove this, but it's a nice touch
    // ───────────────────────────────────────────────
    function initDecrypt() {
        if (prefersReducedMotion) return;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const elements = document.querySelectorAll('[data-decrypt]');

        elements.forEach((el, index) => {
            const original = el.textContent;
            const delay = parseInt(el.dataset.delay) || index * 100;

            setTimeout(() => {
                let progress = 0;
                const steps = 5; // kept it short

                const interval = setInterval(() => {
                    el.textContent = original
                        .split('')
                        .map((char, i) => {
                            if (char === ' ') return ' ';
                            if (i < progress) return original[i];
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join('');

                    progress += original.length / steps;

                    if (progress >= original.length) {
                        el.textContent = original;
                        clearInterval(interval);
                    }
                }, 30);
            }, delay);
        });
    }

    // ───────────────────────────────────────────────
    // Scroll reveal with IntersectionObserver
    // Simple fade-up on scroll into view
    // ───────────────────────────────────────────────
    function initScrollReveal() {
        if (prefersReducedMotion) {
            document.querySelectorAll('.reveal, .stagger').forEach(el => {
                el.classList.add('visible');
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        document.querySelectorAll('.reveal, .stagger').forEach(el => {
            observer.observe(el);
        });
    }

    // ───────────────────────────────────────────────
    // Smooth scroll for nav links
    // ───────────────────────────────────────────────
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && document.querySelector(href)) {
                    e.preventDefault();
                    document.querySelector(href).scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Escape key to unfocus
    function initKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.activeElement?.blur?.();
            }
        });
    }

    // kick it off
    document.addEventListener('DOMContentLoaded', () => {
        initCanvas();
        initDecrypt();
        initScrollReveal();
        initSmoothScroll();
        initKeyboard();
    });

})();
