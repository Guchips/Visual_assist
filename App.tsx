
import React, { useRef, useState } from 'react';
import { useVisionAssistant } from './hooks/useVisionAssistant';
import { ActionButton } from './components/ActionButton';
import { StatusDisplay } from './components/StatusDisplay';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from './services/audioUtils';
import { SettingsScreen } from './components/SettingsScreen';

const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isAppUnlocked, setIsAppUnlocked] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { 
        status, 
        startSession, 
        stopSession, 
        transcription, 
        errorMessage,
    } = useVisionAssistant(videoRef);

    const playGreeting = async () => {
        const apiKey = localStorage.getItem('gemini-api-key');
        if (!apiKey) {
            console.error("API ключ не найден для приветствия.");
            setIsSettingsOpen(true);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: 'Я готова к работе. Нажми СТАРТ' }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
            }
        } catch (error) {
            console.error("Не удалось воспроизвести приветствие:", error);
        }
    };
    
    const handleUnlockApp = () => {
        if (isAppUnlocked) return;
        
        const apiKey = localStorage.getItem('gemini-api-key');
        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }

        setIsAppUnlocked(true);
        playGreeting();
    };

    const handleAction = () => {
        if (status === 'active') {
            stopSession();
        } else {
            startSession();
        }
    };

    if (isSettingsOpen) {
        return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
    }

    if (!isAppUnlocked) {
        return (
            <div 
                className="bg-high-contrast-bg text-high-contrast-fg w-full h-screen flex flex-col items-center justify-center p-4 touch-none relative"
            >
                <div 
                    className="text-center animate-pulse-slow w-full h-full flex flex-col items-center justify-center cursor-pointer"
                    onClick={handleUnlockApp}
                    role="button"
                    aria-label="Начать работу с ассистентом"
                    tabIndex={0}
                >
                    <h1 className="text-4xl font-bold text-high-contrast-accent mb-4">Ассистент</h1>
                    <p className="text-2xl">Нажмите, чтобы начать</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-high-contrast-bg text-high-contrast-fg w-full h-screen flex flex-col items-center p-4 touch-none">
            <header className="w-full max-w-lg mx-auto text-center py-4 relative">
                <h1 className="text-3xl font-bold text-high-contrast-accent">Ассистент</h1>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="absolute top-4 right-0 p-3 text-gray-400 hover:text-white transition-colors z-20"
                    aria-label="Открыть настройки"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </header>

            <div className="flex-grow w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden my-2">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="max-w-full max-h-full object-contain"
                ></video>
            </div>
            
            <div className="w-full max-w-lg mx-auto flex flex-col items-center">
                <main className="mb-4">
                    <ActionButton
                        status={status}
                        onClick={handleAction}
                    />
                </main>
                <footer className="w-full pb-4">
                    <StatusDisplay
                        status={status}
                        transcription={transcription}
                        error={errorMessage}
                    />
                </footer>
            </div>
        </div>
    );
};

export default App;
