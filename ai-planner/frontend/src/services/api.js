/**
 * API Client для общения с backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Базовая функция для запросов
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'API request failed',
        response.status,
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Network error or server unavailable',
      0,
      error.message
    );
  }
}

/**
 * Разбиение шаблона на чанки
 * @param {Object} template
 * @returns {Promise<Object>}
 */
export async function chunkTemplate(template) {
  return fetchAPI('/api/chunk', {
    method: 'POST',
    body: JSON.stringify({ template })
  });
}

/**
 * Индексация чанков
 * @param {Array} chunks
 * @param {string} templateId
 * @returns {Promise<Object>}
 */
export async function indexChunks(chunks, templateId) {
  return fetchAPI('/api/index', {
    method: 'POST',
    body: JSON.stringify({ chunks, templateId })
  });
}

/**
 * Семантический поиск
 * @param {string} query
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function searchChunks(query, options = {}) {
  return fetchAPI('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, ...options })
  });
}

/**
 * Задать вопрос AI
 * @param {string} question
 * @param {Object} context
 * @returns {Promise<Object>}
 */
export async function askQuestion(question, context = {}) {
  return fetchAPI('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ question, context })
  });
}

/**
 * Автозаполнение поля
 * @param {Object} field
 * @param {Object} formData
 * @param {Array} templateChunks
 * @returns {Promise<Object>}
 */
export async function autoFillField(field, formData = {}, templateChunks = []) {
  return fetchAPI('/api/autofill', {
    method: 'POST',
    body: JSON.stringify({ field, formData, templateChunks })
  });
}

/**
 * Удалить индекс шаблона
 * @param {string} templateId
 * @returns {Promise<Object>}
 */
export async function deleteTemplateIndex(templateId) {
  return fetchAPI(`/api/index/${templateId}`, {
    method: 'DELETE'
  });
}

/**
 * Health check
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
  return fetchAPI('/api/health');
}

/**
 * Процесс загрузки и индексации большого шаблона
 * @param {Object} template
 * @param {Function} onProgress
 * @returns {Promise<Object>}
 */
export async function processLargeTemplate(template, onProgress) {
  try {
    // Шаг 1: Chunking
    onProgress?.({ step: 'chunking', progress: 0, message: 'Разбиение на чанки...' });
    const chunkResult = await chunkTemplate(template);

    onProgress?.({ step: 'chunking', progress: 33, message: `Создано ${chunkResult.stats.totalChunks} чанков` });

    // Шаг 2: Indexing
    onProgress?.({ step: 'indexing', progress: 66, message: 'Индексация чанков...' });
    const indexResult = await indexChunks(
      chunkResult.template.chunks,
      template.id || 'default'
    );

    onProgress?.({ step: 'complete', progress: 100, message: 'Готово!' });

    return {
      success: true,
      template: chunkResult.template,
      stats: chunkResult.stats,
      indexed: indexResult.indexed
    };
  } catch (error) {
    onProgress?.({ step: 'error', progress: 0, message: error.message });
    throw error;
  }
}

export { APIError };
