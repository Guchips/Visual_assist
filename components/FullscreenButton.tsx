
import React from 'react';

interface FullscreenButtonProps {
    isFullscreen: boolean;
    onClick: () => void;
}

const EnterFullscreenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6" />
        <path d="M21 3l-7 7M3 21l7-7" />
    </svg>
);

const ExitFullscreenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15v6h6M21 9V3h-6" />
        <path d="M9 15l-6 6M15 9l6-6" />
    </svg>
);

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ isFullscreen, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="text-high-contrast-accent focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-full p-1 transition-transform transform active:scale-90"
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Перейти в полноэкранный режим"}
        >
            {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
        </button>
    );
};
