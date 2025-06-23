import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle,
    X,
    Send,
    Loader,
    Settings,
    Download,
    Minimize2,
    Maximize2
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatInterface = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef(null);

    // Configuration
    const [settings, setSettings] = useState({
        autoScroll: true,
        showTimestamps: true,
        showStatistics: true,
        darkMode: false
    });

    // Scroll vers le bas quand de nouveaux messages arrivent
    const scrollToBottom = () => {
        if (settings.autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(scrollToBottom, [messages, settings.autoScroll]);

    // Charger les suggestions au premier affichage
    useEffect(() => {
        if (isOpen && suggestions.length === 0) {
            fetchSuggestions();
        }
    }, [isOpen]);

    const fetchSuggestions = async () => {
        try {
            const response = await fetch('/api/chat/suggestions');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSuggestions(data.suggestions);
                }
            }
        } catch (error) {
            console.error('Erreur chargement suggestions:', error);
            // Suggestions par défaut si l'API n'est pas disponible
            setSuggestions([
                "Quelle est la température moyenne aujourd'hui ?",
                "Montre-moi les données d'humidité de la semaine",
                "Y a-t-il des tendances dans les températures récentes ?"
            ]);
        }
    };

    const sendMessage = async (message) => {
        if (!message.trim()) return;

        // Ajouter le message utilisateur
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    user_id: 'web_user'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Ajouter la réponse du bot
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: data.response || 'Réponse reçue',
                timestamp: data.timestamp || new Date().toISOString(),
                statistics: data.statistics,
                contextUsed: data.context_used
            };

            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Erreur envoi message:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    const clearChat = () => {
        setMessages([]);
    };

    const exportChat = () => {
        const chatData = {
            messages: messages,
            exportDate: new Date().toISOString(),
            totalMessages: messages.length
        };

        const dataStr = JSON.stringify(chatData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <>
            {/* Bouton flottant */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110 animate-bounce-subtle"
                    title="Ouvrir l'assistant météo"
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {/* Interface de chat */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 animate-slideIn transition-all duration-300 ${
                    isMinimized ? 'h-14' : 'h-[600px]'
                } ${settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

                    {/* Header */}
                    <div className={`p-4 rounded-t-lg flex justify-between items-center ${
                        settings.darkMode ? 'bg-gray-700 text-white' : 'bg-blue-500 text-white'
                    }`}>
                        <div className="flex items-center space-x-2">
                            <MessageCircle size={20} />
                            <h3 className="font-semibold">Assistant Météo</h3>
                            {messages.length > 0 && (
                                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {messages.length}
                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="text-blue-100 hover:text-white transition-colors"
                                title="Paramètres"
                            >
                                <Settings size={16} />
                            </button>
                            {messages.length > 0 && (
                                <button
                                    onClick={exportChat}
                                    className="text-blue-100 hover:text-white transition-colors"
                                    title="Exporter la conversation"
                                >
                                    <Download size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="text-blue-100 hover:text-white transition-colors"
                                title={isMinimized ? "Agrandir" : "Réduire"}
                            >
                                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-blue-100 hover:text-white transition-colors"
                                title="Fermer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Panneau des paramètres */}
                    {showSettings && !isMinimized && (
                        <div className={`p-3 border-b space-y-2 ${
                            settings.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                            <div className="flex justify-between items-center">
                <span className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Défilement automatique
                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.autoScroll}
                                    onChange={() => toggleSetting('autoScroll')}
                                    className="rounded"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                <span className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Afficher les timestamps
                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.showTimestamps}
                                    onChange={() => toggleSetting('showTimestamps')}
                                    className="rounded"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                <span className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Afficher les statistiques
                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.showStatistics}
                                    onChange={() => toggleSetting('showStatistics')}
                                    className="rounded"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={clearChat}
                                    className={`text-sm underline ${
                                        settings.darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                                    }`}
                                >
                                    Effacer la conversation
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {!isMinimized && (
                        <>
                            <div className={`flex-1 overflow-y-auto p-4 space-y-4 chat-messages ${
                                settings.darkMode ? 'bg-gray-800' : 'bg-gray-50'
                            }`}>
                                {messages.length === 0 && (
                                    <div className={`text-center py-8 ${
                                        settings.darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        <MessageCircle size={48} className={`mx-auto mb-4 ${
                                            settings.darkMode ? 'text-gray-600' : 'text-gray-300'
                                        }`} />
                                        <p className="mb-4">Bonjour ! Je peux vous aider à analyser les données météorologiques.</p>

                                        {/* Suggestions */}
                                        {suggestions.length > 0 && (
                                            <div className="space-y-2">
                                                <p className={`text-sm font-medium ${
                                                    settings.darkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                    Questions suggérées :
                                                </p>
                                                {suggestions.slice(0, 3).map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        className={`block w-full text-left p-2 text-sm rounded-lg border transition-colors ${
                                                            settings.darkMode
                                                                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                                                                : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        settings={settings}
                                    />
                                ))}

                                {isLoading && (
                                    <div className={`flex items-center space-x-2 ${
                                        settings.darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        <Loader size={16} className="animate-spin" />
                                        <span className="text-sm">L'assistant réfléchit...</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <ChatInput
                                onSendMessage={sendMessage}
                                disabled={isLoading}
                                darkMode={settings.darkMode}
                            />
                        </>
                    )}
                </div>
            )}
        </>
    );
};


export default ChatInterface;
