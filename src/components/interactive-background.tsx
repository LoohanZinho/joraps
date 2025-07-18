"use client";

import { useRef, useEffect } from 'react';

// Classe para as ondas de choque criadas pelo clique
class Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  life: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 1;
    this.maxRadius = 150; // O quão longe a onda vai
    this.speed = 5;      // Velocidade de expansão da onda
    this.life = 1;       // Força da onda (diminui com o tempo)
  }

  update() {
    if (this.life > 0) {
      this.radius += this.speed;
      // A força da onda diminui à medida que ela se expande
      this.life -= 0.025; 
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(0, 0%, 100%, ${this.life * 0.2})`; // Efeito visual sutil da onda
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 100, // Raio de influência do mouse
  });

  class Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    color: string;
    baseX: number;
    baseY: number;
    density: number;
    
    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number, color: string) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.5;
      this.speed = Math.random() * 0.5 + 0.1;
      this.density = (Math.random() * 30) + 1;
      this.color = color;
    }
    
    update() {
      // Movimento contínuo de base
      this.baseY += this.speed;
      if (this.baseY > this.canvasHeight + this.size) {
        this.baseY = 0 - this.size;
        this.baseX = Math.random() * this.canvasWidth;
      }
      
      let targetX = this.baseX;
      let targetY = this.baseY;

      // Interação com o mouse
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRef.current.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
          const directionX = forceDirectionX * force * this.density;
          const directionY = forceDirectionY * force * this.density;
          
          targetX = this.x - directionX;
          targetY = this.y - directionY;
        }
      }
      
      // Interação com as ondas de choque
      shockwavesRef.current.forEach(wave => {
        if (wave.life > 0) {
          const dx = this.x - wave.x;
          const dy = this.y - wave.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Verifica se a partícula está perto o suficiente da onda para ser afetada
          if (distance < wave.radius && distance > wave.radius - 50) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            // A força é maior no início da vida da onda
            targetX += forceDirectionX * 10 * wave.life;
            targetY += forceDirectionY * 10 * wave.life;
          }
        }
      });

      // Move suavemente para a posição alvo
      this.x += (targetX - this.x) / 10;
      this.y += (targetY - this.y) / 10;
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
        let numberOfParticles = 1500; 
        for (let i = 0; i < numberOfParticles; i++) {
            particlesRef.current.push(new Particle(ctx, canvas.width, canvas.height, particleColor));
        }
    };

    const handleMouseMove = (event: globalThis.MouseEvent) => {
        mouseRef.current.x = event.x;
        mouseRef.current.y = event.y;
    };
    
    const handleMouseLeave = () => {
        mouseRef.current.x = null;
        mouseRef.current.y = null;
    };

    const handleClick = (event: globalThis.MouseEvent) => {
      shockwavesRef.current.push(new Shockwave(event.x, event.y));
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
      
      // Atualiza e desenha partículas
      particlesRef.current.forEach(p => {
        p.update();
        p.draw();
      });

      // Atualiza, desenha e remove ondas de choque "mortas"
      shockwavesRef.current = shockwavesRef.current.filter(wave => {
        wave.update();
        // wave.draw(ctx); // Descomente para ver o círculo da onda de choque
        return wave.life > 0;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-background" />;
}
