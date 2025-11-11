import React, { useRef, useState } from 'react';
import { useVisionAssistant } from './hooks/useVisionAssistant';
import { ActionButton } from './components/ActionButton';
import { StatusDisplay } from './components/StatusDisplay';
import { SettingsScreen } from './components/SettingsScreen';

const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { 
        status, 
        startSession, 
        stopSession, 
        transcription, 
        errorMessage,
        sessionTime,
    } = useVisionAssistant(videoRef);
    
    const handleAction = () => {
        if (status === 'active') {
            stopSession();
        } else {
            const apiKey = localStorage.getItem('gemini-api-key');
            if (!apiKey) {
                setIsSettingsOpen(true);
                return;
            }
            startSession();
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    if (isSettingsOpen) {
        return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
    }

    return (
        <div className="bg-high-contrast-bg text-high-contrast-fg w-full h-screen flex flex-col p-2 gap-2 touch-none">
            
            {/* Header - Always on top */}
            <header className="w-full text-center py-2 relative flex-shrink-0">
                <h1 className="text-2xl md:text-3xl font-bold text-high-contrast-accent">Ассистент</h1>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="absolute top-1/2 -translate-y-1/2 right-0 p-2 text-gray-400 hover:text-white transition-colors z-20"
                    aria-label="Открыть настройки"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col landscape:flex-row gap-2 overflow-hidden">
                
                {/* Video Container */}
                <div className="h-[55%] w-full flex items-center justify-center overflow-hidden landscape:w-[45%] landscape:h-full">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full max-h-full object-contain"
                    ></video>
                </div>
                
                {/* Controls Container */}
                <div className="h-[45%] w-full flex flex-col items-center landscape:w-[55%] landscape:h-full landscape:justify-center landscape:gap-2">
                    <main className="flex-grow flex flex-col items-center justify-center landscape:flex-grow-0">
                        <ActionButton
                            status={status}
                            onClick={handleAction}
                        />
                        {(status === 'active' || status === 'connecting') && (
                            <div className="mt-2 text-center">
                                <p className="text-lg text-high-contrast-accent font-mono" aria-live="off">
                                    {formatTime(sessionTime)}
                                </p>
                            </div>
                        )}
                    </main>
                    <footer className="w-full flex-shrink-0">
                        <StatusDisplay
                            status={status}
                            transcription={transcription}
                            error={errorMessage}
                        />
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default App;