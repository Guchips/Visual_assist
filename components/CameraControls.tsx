
import React from 'react';
import { CameraCapabilities } from '../hooks/useVisionAssistant';

const FlashlightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const MinusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
);


interface CameraControlsProps {
    capabilities: CameraCapabilities;
    isFlashlightOn: boolean;
    currentZoom: number;
    onToggleFlashlight: () => void;
    onChangeZoom: (direction: 'in' | 'out') => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
    capabilities,
    isFlashlightOn,
    currentZoom,
    onToggleFlashlight,
    onChangeZoom
}) => {
    // Добавляем небольшой допуск для сравнения чисел с плавающей запятой
    const isZoomInDisabled = !capabilities.zoom || currentZoom >= capabilities.maxZoom - 0.01;
    const isZoomOutDisabled = !capabilities.zoom || currentZoom <= capabilities.minZoom + 0.01;

    const baseButtonClass = `
        w-12 h-12 rounded-full flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-300
        transition-all transform active:scale-95
    `;

    return (
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            {capabilities.torch && (
                <button
                    onClick={onToggleFlashlight}
                    className={`
                        ${baseButtonClass}
                        ${isFlashlightOn ? 'bg-high-contrast-accent text-black' : 'bg-gray-700 bg-opacity-80 text-white'}
                    `}
                    aria-label={isFlashlightOn ? "Выключить фонарик" : "Включить фонарик"}
                >
                    <FlashlightIcon />
                </button>
            )}
            {capabilities.zoom && (
                <>
                    <button
                        onClick={() => onChangeZoom('in')}
                        disabled={isZoomInDisabled}
                        className={`
                            ${baseButtonClass}
                            bg-high-contrast-accent text-black
                            disabled:bg-gray-700 disabled:bg-opacity-80 disabled:text-white disabled:cursor-not-allowed
                        `}
                         aria-label="Приблизить"
                    >
                        <PlusIcon />
                    </button>
                    <button
                        onClick={() => onChangeZoom('out')}
                        disabled={isZoomOutDisabled}
                        className={`
                            ${baseButtonClass}
                            bg-high-contrast-accent text-black
                            disabled:bg-gray-700 disabled:bg-opacity-80 disabled:text-white disabled:cursor-not-allowed
                        `}
                         aria-label="Отдалить"
                    >
                        <MinusIcon />
                    </button>
                </>
            )}
        </div>
    );
};
