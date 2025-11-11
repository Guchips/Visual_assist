
import React, { useRef } from 'react';
import { useVisionAssistant } from './hooks/useVisionAssistant';
import { ActionButton } from './components/ActionButton';
import { StatusDisplay } from './components/StatusDisplay';

const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

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
            // Fix: Per coding guidelines, API key is handled by `useVisionAssistant` hook using process.env.API_KEY.
            // No need to check for API key here or open settings.
            startSession();
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="bg-high-contrast-bg text-high-contrast-fg w-full h-screen flex flex-col p-2 gap-2 touch-none">
            
            {/* Header - Always on top */}
            <header className="w-full text-center py-2 relative flex-shrink-0">
                <h1 className="text-2xl md:text-3xl font-bold text-high-contrast-accent">Ассистент</h1>
                {/* Fix: Removed settings button as API key is now handled by environment variables. */}
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
                        />
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default App;