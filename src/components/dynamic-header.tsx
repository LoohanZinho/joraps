"use client";

import { useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import Balancer from "react-wrap-balancer";

export default function DynamicHeader() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const gradientStyle = {
    backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary)), hsl(var(--accent)))`,
  };

  return (
    <header
      className="mb-8 text-center"
      onMouseMove={handleMouseMove}
    >
      <h1 
        className={cn(
          "font-headline text-4xl font-bold tracking-tight sm:text-5xl",
          "bg-clip-text text-transparent"
        )} 
        style={gradientStyle}
      >
        <Balancer>
          Transcrever áudio para texto
        </Balancer>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        <Balancer>
          Transcreva qualquer arquivo de áudio em texto preciso gratuitamente.
        </Balancer>
      </p>
    </header>
  );
}
