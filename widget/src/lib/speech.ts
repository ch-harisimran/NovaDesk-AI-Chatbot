// Thin wrapper around the browser-native Web Speech API (SpeechRecognition).
// No backend involved -- purely client-side speech-to-text.

type SpeechRecognitionCtor = new () => SpeechRecognition;

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function createRecognizer(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void): SpeechRecognition | null {
  const Ctor: SpeechRecognitionCtor | undefined = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    onResult(transcript, isFinal);
  };
  recognition.onend = onEnd;
  recognition.onerror = onEnd;

  return recognition;
}
