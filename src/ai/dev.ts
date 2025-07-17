import { config } from 'dotenv';
config();

import '@/ai/flows/punctuate-transcript.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/expand-text.ts';
import '@/ai/flows/rewrite-text.ts';
