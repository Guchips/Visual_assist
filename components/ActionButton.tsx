
import React from 'react';

interface ActionButtonProps {
    status: 'idle' | 'connecting' | 'active' | 'error';
    onClick: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ status, onClick }) => {
    const getButtonText = () => {
        switch (status) {
            case 'active':
                return 'СТОП';
            case 'connecting':
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
        if (status === 'connecting') {
            return 'animate-spin';
        }
        return '';
    };

    return (
        <button
            onClick={onClick}
            disabled={status === 'connecting'}
            className={`
                w-48 h-48 md:w-64 md:h-64 
                rounded-full 
                border-8 border-high-contrast-accent 
                bg-black bg-opacity-50
                text-high-contrast-accent text-4xl md:text-5xl font-bold
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
