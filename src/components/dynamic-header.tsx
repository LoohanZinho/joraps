"use client";

import Balancer from "react-wrap-balancer";

export default function DynamicHeader() {

  return (
    <header
      className="mb-8 text-center"
    >
      <h1 
        className="font-headline text-4xl font-bold tracking-tight sm:text-5xl text-foreground" 
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
