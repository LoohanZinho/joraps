import AudioRecorder from '@/components/audio-recorder';
import DynamicHeader from '@/components/dynamic-header';
import { Provider as BalancerProvider } from 'react-wrap-balancer';

export default function Home() {
  return (
    <BalancerProvider>
      <div className="container mx-auto max-w-4xl p-4">
          <DynamicHeader />
          <AudioRecorder />
          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>Desenvolvido com Firebase Genkit e Google Gemini</p>
          </footer>
      </div>
    </BalancerProvider>
  );
}
