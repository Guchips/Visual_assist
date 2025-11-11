
import React, { useState, useEffect } from 'react';

interface SettingsScreenProps {
    onClose: () => void;
    onSave: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini-api-key') || '';
        setApiKey(storedKey);
    }, []);

    const handleSave = () => {
        localStorage.setItem('gemini-api-key', apiKey);
        onSave();
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-high-contrast-bg border-2 border-high-contrast-accent rounded-lg p-6 w-full max-w-md text-high-contrast-fg relative">
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 text-high-contrast-accent text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-full w-8 h-8 flex items-center justify-center"
                    aria-label="Закрыть настройки"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-high-contrast-accent mb-4">Настройки API-ключа</h2>
                <p className="mb-4">
                    Пожалуйста, введите ваш API-ключ для Gemini. Вы можете получить его на{' '}
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline text-yellow-300 hover:text-yellow-400"
                    >
                        странице Google AI Studio
                    </a>.
                </p>
                <div className="mb-6">
                    <label htmlFor="api-key-input" className="block text-sm font-medium mb-1">
                        Ваш API-ключ:
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-black border-2 border-high-contrast-accent rounded-md p-2 text-high-contrast-fg placeholder-gray-500 focus:ring-yellow-300 focus:border-yellow-300"
                        placeholder="Введите ваш ключ..."
                    />
                </div>
                <button
                    onClick={handleSave}
                    className="w-full bg-high-contrast-accent text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-300 transition-colors"
                >
                    Сохранить и закрыть
                </button>
            </div>
        </div>
    );
};
