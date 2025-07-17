import AudioRecorder from '@/components/audio-recorder';
import DynamicHeader from '@/components/dynamic-header';
import { Provider as BalancerProvider } from 'react-wrap-balancer';

export default function Home() {
  return (
    <BalancerProvider>
      <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4 sm:p-8">
        <div className="w-full max-w-2xl" style={{ perspective: "1000px" }}>
          <DynamicHeader />
          <AudioRecorder />
          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>Desenvolvido com Firebase Genkit e Google Gemini</p>
          </footer>
        </div>
      </main>
    </BalancerProvider>
  );
}
