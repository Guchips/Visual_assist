
import React from 'react';

interface ActionButtonProps {
    status: 'idle' | 'connecting' | 'reconnecting' | 'active' | 'error';
    onClick: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ status, onClick }) => {
    const getButtonText = () => {
        switch (status) {
            case 'active':
                return 'СТОП';
            case 'connecting':
            case 'reconnecting':
                return '...';
            case 'idle':
            case 'error':
            default:
                return 'СТАРТ';
        }
    };

    const getAnimationClass = () => {
        if (status === 'active') {
            return 'animate-pulse-slow';
        }
        if (status === 'connecting' || status === 'reconnecting') {
            return 'animate-spin';
        }
        return '';
    };

    return (
        <button
            onClick={onClick}
            disabled={status === 'connecting' || status === 'reconnecting'}
            className={`
                w-40 h-40 landscape:w-36 landscape:h-36 md:w-48 md:h-48 
                rounded-full 
                border-8 border-high-contrast-accent 
                bg-black bg-opacity-50
                text-3xl md:text-4xl font-bold
                text-high-contrast-accent
                flex items-center justify-center
                focus:outline-none focus:ring-4 focus:ring-yellow-300
                transition-transform transform active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getAnimationClass()}
            `}
            aria-label={status === 'active' ? 'Остановить сессию' : 'Начать сессию'}
        >
            {getButtonText()}
        </button>
    );
};
