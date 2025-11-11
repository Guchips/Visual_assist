
import React, { useRef, useState, useEffect } from 'react';
import { useVisionAssistant } from './hooks/useVisionAssistant';
import { ActionButton } from './components/ActionButton';
import { StatusDisplay } from './components/StatusDisplay';
import { SettingsScreen } from './components/SettingsScreen';

const GearIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const checkApiKey = () => {
        const key = localStorage.getItem('gemini-api-key');
        const hasKey = !!key && key.length > 0;
        setApiKeySelected(hasKey);
        return hasKey;
    };

    const handleApiKeyError = () => {
        localStorage.removeItem('gemini-api-key');
        setApiKeySelected(false);
        setShowSettings(true);
    };

    const { 
        status, 
        startSession, 
        stopSession, 
        transcription, 
        errorMessage,
        sessionTime,
    } = useVisionAssistant(videoRef, handleApiKeyError);

    useEffect(() => {
        checkApiKey();
    }, []);
    
    const handleAction = async () => {
        if (status === 'active') {
            stopSession();
        } else if (status === 'idle' || status === 'error') {
            if (checkApiKey()) {
                startSession();
            } else {
                setShowSettings(true);
            }
        }
    };

    const handleSaveKey = () => {
        checkApiKey();
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="bg-high-contrast-bg text-high-contrast-fg w-full h-screen flex flex-col p-2 gap-2 touch-none">
            
            {showSettings && (
                <SettingsScreen 
                    onClose={() => setShowSettings(false)}
                    onSave={handleSaveKey}
                />
            )}

            {/* Header - Always on top */}
            <header className="w-full text-center py-2 relative flex-shrink-0 flex justify-between items-center px-4">
                <div className="w-8 h-8"></div> {/* Spacer for centering title */}
                <h1 className="text-2xl md:text-3xl font-bold text-high-contrast-accent">Ассистент</h1>
                <button
                    onClick={() => setShowSettings(true)}
                    className="text-high-contrast-accent focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-full p-1 transition-transform transform active:scale-90"
                    aria-label="Настройки API ключа"
                >
                    <GearIcon />
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col landscape:flex-row gap-2 overflow-hidden">
                
                {/* Video Container */}
                <div className="h-[45%] w-full flex items-center justify-center overflow-hidden landscape:w-[55%] landscape:h-full">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full max-h-full object-contain"
                    ></video>
                </div>
                
                {/* Controls Container */}
                <div className="h-[55%] w-full flex flex-col items-center landscape:w-[45%] landscape:h-full landscape:justify-center landscape:gap-2">
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
                            apiKeySelected={apiKeySelected}
                        />
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default App;
