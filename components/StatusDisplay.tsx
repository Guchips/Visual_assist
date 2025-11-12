
import React, { useEffect, useRef } from 'react';

interface StatusDisplayProps {
    status: 'idle' | 'connecting' | 'reconnecting' | 'active' | 'error';
    transcription: string;
    error: string | null;
    apiKeySelected: boolean;
}

const smoothScrollTo = (element: HTMLElement, to: number, duration: number) => {
    const start = element.scrollTop;
    const change = to - start;
    let startTime: number | null = null;

    const animateScroll = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;

        // Easing function: easeInOutQuad
        // t: current time, b: beginning value, c: change in value, d: duration
        const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        const newScrollTop = easeInOutQuad(timeElapsed, start, change, duration);
        element.scrollTop = newScrollTop;

        if (timeElapsed < duration) {
            requestAnimationFrame(animateScroll);
        } else {
            element.scrollTop = to;
        }
    };

    requestAnimationFrame(animateScroll);
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, transcription, error, apiKeySelected }) => {
    const messageRef = useRef<HTMLParagraphElement>(null);

    const getMessage = () => {
        if (error) {
            return `Ошибка: ${error}`;
        }
        if (!apiKeySelected && (status === 'idle' || status === 'error')) {
            return 'Для начала работы выберите API-ключ. Нажмите на значок ⚙️ в правом верхнем углу.';
        }
        switch (status) {
            case 'idle':
                return 'Готов к работе. Нажмите СТАРТ.';
            case 'connecting':
                return 'Подключение...';
            case 'reconnecting':
                return 'Восстановление связи...';
            case 'active':
                return transcription || '...';
            default:
                return '';
        }
    };
    
    const message = getMessage();

    useEffect(() => {
        if (messageRef.current) {
            const element = messageRef.current;
            // Вызываем плавную прокрутку с длительностью 1500 мс (1.5 секунды)
            smoothScrollTo(element, element.scrollHeight, 1500);
        }
    }, [message]);


    return (
        <div className="w-full h-24 p-2 bg-black bg-opacity-70 rounded-lg text-center flex items-center justify-center">
            <p 
                ref={messageRef}
                className="text-lg text-high-contrast-fg font-medium break-words max-h-full overflow-y-auto no-scrollbar"
            >
                {message}
            </p>
        </div>
    );
};
