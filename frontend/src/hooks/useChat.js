import { useState, useCallback } from 'react';

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = useCallback(async (message) => {
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

            const data = await response.json();

            if (data.success) {
                const botMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: data.response,
                    timestamp: data.timestamp,
                    statistics: data.statistics,
                    contextUsed: data.context_used
                };

                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
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
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        isLoading,
        sendMessage,
        clearMessages
    };
};