import React from 'react';
import { Bot, User, BarChart3, AlertCircle } from 'lucide-react';

const MessageBubble = ({ message, settings }) => {
    const isUser = message.type === 'user';
    const isError = message.isError;

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>

            {/* Avatar */}
            {!isUser && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isError
                        ? 'bg-red-100'
                        : settings?.darkMode
                            ? 'bg-blue-900'
                            : 'bg-blue-100'
                }`}>
                    {isError ? (
                        <AlertCircle size={16} className="text-red-600" />
                    ) : (
                        <Bot size={16} className={settings?.darkMode ? 'text-blue-300' : 'text-blue-600'} />
                    )}
                </div>
            )}

            {/* Message */}
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isUser
                    ? settings?.darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                    : isError
                        ? settings?.darkMode
                            ? 'bg-red-900 border border-red-700 text-red-200'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        : settings?.darkMode
                            ? 'bg-gray-700 border border-gray-600 text-gray-200'
                            : 'bg-white border border-gray-200 text-gray-800'
            }`}>

                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Statistiques pour les réponses du bot */}
                {message.statistics?.humidity && settings?.showStatistics && (
                    <div className={`mt-2 p-2 rounded text-xs border-t ${styles}`}>
                        <div className="flex items-center space-x-1 mb-1">
                            <BarChart3 size={12} />
                            <span className="font-medium">Humidité :</span>
                        </div>
                        <div>Moyenne: {message.statistics.humidity.average}%</div>
                        <div>Min: {message.statistics.humidity.minimum}%</div>
                        <div>Max: {message.statistics.humidity.maximum}%</div>
                    </div>
                )}


                {/* Timestamp */}
                {settings?.showTimestamps && (
                    <div className={`text-xs mt-2 ${
                        isUser
                            ? settings?.darkMode
                                ? 'text-blue-200'
                                : 'text-blue-100'
                            : settings?.darkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                    }`}>
                        {formatTimestamp(message.timestamp)}
                    </div>
                )}
            </div>

            {/* Avatar utilisateur */}
            {isUser && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    settings?.darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                    <User size={16} className={settings?.darkMode ? 'text-gray-300' : 'text-gray-600'} />
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
