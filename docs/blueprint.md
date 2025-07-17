# **App Name**: Audio Transcription

## Core Features:

- Instant Recording: Integrated voice recorder for immediate audio capture and transcription, triggering the Gemini transcription function when recording completes.
- Dynamic Transcription: Display transcription text in a dynamic text area using Genkit to interact with Gemini.
- Copy Transcription: Implement a button to copy the transcription to clipboard.
- AI-Powered Punctuation: Tool to utilize a generative AI model (Gemini) to punctuate the transcript for enhanced readability, employing conditional logic to decide whether to incorporate punctuation, potentially triggered via a prompt or dedicated settings.
- Transcription History (optional): Store previous transcriptions in Firestore with timestamps.
- Better State Management: Improved state management (React Hooks / Zustand). Clear states: recording, processing, ready, copied.
- Genkit Integration (Gemini): Genkit Integration (Gemini). Create two distinct functions: transcribeAudio(blob): string, punctuateTranscript(rawText): string. Allows for modularity and reuse in future functions (e.g., translation).

## Style Guidelines:

- Primary color: HSL 210, 82%, 54% (RGB Hex: #3898F1) - A vibrant blue to represent reliability and speed.
- Background color: HSL 210, 15%, 95% (RGB Hex: #F0F5FA) - A light, desaturated blue-tinted background to keep focus on the transcribed text.
- Accent color: HSL 180, 59%, 47% (RGB Hex: #30BF9D) - A contrasting cyan-leaning blue that highlights primary action buttons and key UI elements, complementing the overall speed and precision theme.
- Body and headline font: 'Inter' (sans-serif) for a modern, neutral, and readable interface.
- Maintain a clean, intuitive layout for ease of use. Prioritize the record button and the dynamic transcription text field. Ensure all interactive elements are easily accessible and clearly visible.
- Incorporate subtle animations to provide feedback, such as a pulsating effect on the record button when active and a brief highlight when text is copied.