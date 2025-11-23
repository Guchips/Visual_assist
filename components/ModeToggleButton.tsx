
import React from 'react';

const VideoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 10.5V7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.5l4 4v-11l-4 4z"/>
    </svg>
);

const MicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
    </svg>
);


interface ModeToggleButtonProps {
    mode: 'video' | 'audio';
    onToggle: () => void;
}

export const ModeToggleButton: React.FC<ModeToggleButtonProps> = ({ mode, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className="text-high-contrast-accent focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-full p-1 transition-transform transform active:scale-90"
            aria-label={mode === 'video' ? "Переключиться в режим 'только аудио'" : "Переключиться в режим 'видео и аудио'"}
        >
            {mode === 'video' ? <MicIcon /> : <VideoIcon />}
        </button>
    );
};
