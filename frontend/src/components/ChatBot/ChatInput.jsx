import React, { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

const ChatInput = ({ onSendMessage, disabled = false, darkMode = false }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSendMessage(input);
            setInput('');
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`p-4 border-t rounded-b-lg ${
            darkMode
                ? 'border-gray-600 bg-gray-800'
                : 'border-gray-200 bg-white'
        }`}>
            <div className="flex space-x-2 items-end">
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Posez votre question sur la météo..."
                        disabled={disabled}
                        rows={1}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed transition-colors resize-none ${
                            darkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 disabled:bg-gray-800'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 disabled:bg-gray-100'
                        }`}
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={disabled || !input.trim()}
                    className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed transition-colors ${
                        darkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
                    }`}
                    title="Envoyer le message"
                >
                    <Send size={16} />
                </button>
            </div>
        </form>
    );
};

export default ChatInput;