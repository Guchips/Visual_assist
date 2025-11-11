
import React from 'react';

interface StatusDisplayProps {
    status: 'idle' | 'connecting' | 'active' | 'error';
    transcription: string;
    error: string | null;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, transcription, error }) => {
    const getMessage = () => {
        if (error) {
            return `Ошибка: ${error}`;
        }
        switch (status) {
            case 'idle':
                return 'Готов к работе. Нажмите СТАРТ.';
            case 'connecting':
                return 'Подключение...';
            case 'active':
                return transcription || '...';
            default:
                return '';
        }
    };

    return (
        <div className="w-full h-24 p-4 bg-black bg-opacity-70 rounded-lg text-center flex items-center justify-center">
            <p className="text-xl text-high-contrast-fg font-medium overflow-hidden whitespace-nowrap">
                {getMessage()}
            </p>
        </div>
    );
};
