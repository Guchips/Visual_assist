import React, { useState } from 'react';

interface SettingsScreenProps {
    onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini-api-key') || '');

    const handleSave = () => {
        localStorage.setItem('gemini-api-key', apiKey);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-high-contrast-accent">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-high-contrast-accent">Настройки API</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl" aria-label="Закрыть настройки">&times;</button>
                </div>
                <p className="text-gray-300 mb-4">
                    Пожалуйста, введите ваш API ключ для Google Gemini. Ключ будет сохранен локально в вашем браузере.
                </p>
                <div className="mb-6">
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">API Ключ</label>
                    <input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-high-contrast-accent"
                        placeholder="Введите ваш API ключ..."
                    />
                </div>
                <button
                    onClick={handleSave}
                    className="w-full bg-high-contrast-accent text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-300 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                    Сохранить и закрыть
                </button>
            </div>
        </div>
    );
};
