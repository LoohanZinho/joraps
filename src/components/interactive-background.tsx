"use client";

import { useRef, useEffect } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  class Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    color: string;
    
    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number, color: string) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.size = Math.random() * 2 + 0.5; // Tamanhos variados para profundidade
      this.speed = Math.random() * 1.5 + 0.5; // Velocidades variadas
      this.color = color;
    }
    
    update() {
      // Movimento contínuo para baixo
      this.y += this.speed;
      
      // Se a partícula sair da tela, reseta sua posição no topo
      if (this.y > this.canvasHeight) {
        this.y = 0 - this.size;
        this.x = Math.random() * this.canvasWidth;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 1.5 + 0.5;
      }
    }
    
    draw() {
      this.ctx.fillStyle = this.color;
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const computedStyle = getComputedStyle(document.documentElement);
    const particleColor = `hsl(${computedStyle.getPropertyValue('--primary').trim()})`;

    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const initParticles = () => {
        particlesRef.current = [];
        let numberOfParticles = (canvas.width * canvas.height) / 5000; // Densidade ajustada
        for (let i = 0; i < numberOfParticles; i++) {
            particlesRef.current.push(new Particle(ctx, canvas.width, canvas.height, particleColor));
        }
    };

    const handleResize = () => {
        setCanvasDimensions();
        initParticles();
    };

    setCanvasDimensions();
    initParticles();
    
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-background" />;
}
