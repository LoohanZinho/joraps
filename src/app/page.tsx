import AudioRecorder from '@/components/audio-recorder';
import DynamicHeader from '@/components/dynamic-header';
import { Provider as BalancerProvider } from 'react-wrap-balancer';

export default function Home() {
  return (
    <BalancerProvider>
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="container mx-auto max-w-4xl">
          <DynamicHeader />
          <AudioRecorder />
          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>Desenvolvido com Firebase Genkit e Google Gemini</p>
          </footer>
        </div>
      </div>
    </BalancerProvider>
  );
}
