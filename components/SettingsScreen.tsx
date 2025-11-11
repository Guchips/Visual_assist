
import React from 'react';

interface SettingsScreenProps {
    onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
    // Per coding guidelines, API key is managed via environment variables (process.env.API_KEY).
    // This component is no longer used for API key input.
    return null;
};
