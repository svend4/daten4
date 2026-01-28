/**
 * AI Assistant Component
 *
 * Компонент AI помощника для:
 * - Ответов на вопросы пользователей
 * - Автозаполнения полей
 * - Семантического поиска по шаблону
 */

import React, { useState } from 'react';
import { askQuestion, searchChunks } from '../services/api';

const AIAssistant = ({ template, formData, onAutoFill }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Быстрые вопросы
  const quickQuestions = [
    { icon: '💡', text: 'Какие поля обязательные?', query: 'Какие поля обязательные для заполнения?' },
    { icon: '✨', text: 'Помоги заполнить форму', query: 'Как правильно заполнить эту форму?' },
    { icon: '🔍', text: 'Найти раздел', query: '' }, // Откроет поиск
    { icon: '📚', text: 'Покажи примеры', query: 'Покажи примеры заполнения полей' }
  ];

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);

    try {
      const context = {
        templateId: template.id,
        templateName: template.name,
        templateDescription: template.description
      };

      const response = await askQuestion(question, context);

      const aiMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence
      };

      setMessages(prev => [...prev, aiMessage]);
      setQuestion('');
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Произошла ошибка. Попробуйте переформулировать вопрос или проверьте настройки API.',
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = async (quickQ) => {
    if (quickQ.icon === '🔍') {
      // Открыть режим поиска
      setSearchResults([]);
      return;
    }

    setQuestion(quickQ.query);
    setTimeout(() => handleAskQuestion(), 100);
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await searchChunks(query, {
        topK: 5,
        templateId: template.id
      });

      setSearchResults(response.results);
    } catch (error) {
      console.error('Search Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (confidence) => {
    const percent = Math.round(confidence * 100);
    if (percent >= 80) return `🟢 ${percent}%`;
    if (percent >= 60) return `🟡 ${percent}%`;
    return `🔴 ${percent}%`;
  };

  return (
    <div className="ai-assistant">
      {/* Плавающая кнопка */}
      <button
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all hover:scale-110 z-50 flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Помощник"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Чат панель */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-40">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-bold text-lg">AI Помощник</h3>
                <p className="text-xs opacity-90">Powered by Claude 3.5 Sonnet</p>
              </div>
            </div>
          </div>

          {/* Быстрые действия */}
          {messages.length === 0 && !searchResults && (
            <div className="p-4 bg-gray-50 border-b">
              <p className="text-sm text-gray-600 mb-3">Чем могу помочь?</p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                    onClick={() => handleQuickQuestion(q)}
                  >
                    <span className="mr-2">{q.icon}</span>
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !searchResults && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm">Задайте вопрос или выберите<br />быстрое действие выше</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.error
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs text-gray-600 mb-1">📚 Источники:</p>
                      {msg.sources.map((source, i) => (
                        <div key={i} className="text-xs text-gray-500">
                          • {source.title} ({Math.round(source.relevance * 100)}%)
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.confidence !== undefined && (
                    <div className="mt-2 text-xs text-gray-500">
                      Уверенность: {formatConfidence(msg.confidence)}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}

            {/* Результаты поиска */}
            {searchResults && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Результаты поиска:</p>
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{result.title}</h4>
                      <span className="text-xs text-gray-500">
                        {Math.round(result.relevance * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {result.content.slice(0, 100)}...
                    </p>
                  </div>
                ))}
                <button
                  className="text-sm text-purple-600 hover:text-purple-700"
                  onClick={() => setSearchResults(null)}
                >
                  ← Назад к чату
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Поле ввода */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={searchResults ? "Поиск по шаблону..." : "Задайте вопрос..."}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchResults ? handleSearch(question) : handleAskQuestion();
                  }
                }}
                disabled={loading}
              />
              <button
                className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={searchResults ? () => handleSearch(question) : handleAskQuestion}
                disabled={loading || !question.trim()}
              >
                {searchResults ? '🔍' : '📤'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI может делать ошибки. Проверяйте важную информацию.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
