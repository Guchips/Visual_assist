import React, { useEffect, useRef } from 'react';

interface StatusDisplayProps {
    status: 'idle' | 'connecting' | 'active' | 'error';
    transcription: string;
    error: string | null;
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

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, transcription, error }) => {
    const messageRef = useRef<HTMLParagraphElement>(null);

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
    
    const message = getMessage();

    useEffect(() => {
        if (messageRef.current) {
            const element = messageRef.current;
            // Вызываем плавную прокрутку с длительностью 500 мс (полсекунды)
            smoothScrollTo(element, element.scrollHeight, 1000);
        }
    }, [message]);


    return (
        <div className="w-full h-20 landscape:h-16 p-2 bg-black bg-opacity-70 rounded-lg text-center flex items-center justify-center">
            <p 
                ref={messageRef}
                className="text-lg text-high-contrast-fg font-medium break-words max-h-full overflow-y-auto no-scrollbar"
            >
                {message}
            </p>
        </div>
    );
};