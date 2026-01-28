/**
 * RAG Engine (Retrieval-Augmented Generation)
 *
 * Система для:
 * 1. Индексации чанков (создание embeddings)
 * 2. Семантического поиска (поиск релевантных чанков)
 * 3. Генерации ответов (RAG с Claude)
 * 4. Автозаполнения полей
 */

const Anthropic = require('@anthropic-ai/sdk');
const { ChromaClient } = require('chromadb');

class RAGEngine {
  constructor(config) {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey
    });

    this.openaiApiKey = config.openaiApiKey;

    this.chroma = new ChromaClient({
      path: config.chromaUrl || 'http://localhost:8000'
    });

    this.collectionName = config.collectionName || 'planner-chunks';
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-large';
  }

  /**
   * Инициализация: создание коллекции в ChromaDB
   */
  async initialize() {
    try {
      console.log('🔧 Initializing RAG Engine...');
      this.collection = await this.chroma.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'Dynamic Planner template chunks' }
      });
      console.log('✅ RAG Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize RAG Engine:', error);
      throw error;
    }
  }

  /**
   * Индексация чанков: создание embeddings и сохранение в векторную БД
   * @param {Array} chunks - Массив чанков из шаблона
   * @param {string} templateId - ID шаблона
   */
  async indexChunks(chunks, templateId) {
    console.log(`📊 Indexing ${chunks.length} chunks for template ${templateId}...`);

    if (!this.collection) {
      await this.initialize();
    }

    const ids = [];
    const embeddings = [];
    const metadatas = [];
    const documents = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   Processing chunk ${i + 1}/${chunks.length}: ${chunk.id}`);

      // Преобразуем chunk в текст
      const chunkText = this.chunkToText(chunk);

      // Создаём embedding
      const embedding = await this.getEmbedding(chunkText);

      ids.push(`${templateId}:${chunk.id}`);
      embeddings.push(embedding);
      metadatas.push({
        templateId,
        chunkId: chunk.id,
        title: chunk.title,
        tags: chunk.tags.join(','),
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        sectionCount: chunk.content.sections.length
      });
      documents.push(chunkText);

      // Задержка для rate limiting
      if (i < chunks.length - 1) {
        await this.sleep(100);
      }
    }

    // Сохраняем всё в ChromaDB одним batch
    await this.collection.add({
      ids,
      embeddings,
      metadatas,
      documents
    });

    console.log(`✅ Successfully indexed ${chunks.length} chunks`);

    return {
      indexed: chunks.length,
      templateId,
      collectionName: this.collectionName
    };
  }

  /**
   * Преобразование chunk в текстовое представление для embedding
   * @param {Object} chunk
   * @returns {string}
   */
  chunkToText(chunk) {
    let text = `# ${chunk.title}\n\n`;

    if (chunk.tags && chunk.tags.length > 0) {
      text += `Теги: ${chunk.tags.join(', ')}\n\n`;
    }

    for (const section of chunk.content.sections) {
      text += `## ${section.name}\n`;

      if (section.description) {
        text += `${section.description}\n\n`;
      }

      if (section.fields && section.fields.length > 0) {
        text += `Поля:\n`;
        for (const field of section.fields) {
          text += `- **${field.label}** (${field.type})`;

          if (field.description) {
            text += `: ${field.description}`;
          }

          if (field.required) {
            text += ' [обязательное]';
          }

          if (field.aiHints && field.aiHints.length > 0) {
            text += `\n  Подсказка: ${field.aiHints[0]}`;
          }

          text += '\n';
        }
        text += '\n';
      }
    }

    return text.trim();
  }

  /**
   * Получение embedding от OpenAI
   * @param {string} text
   * @returns {Array<number>}
   */
  async getEmbedding(text) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }

  /**
   * Семантический поиск релевантных чанков
   * @param {string} query - Поисковый запрос
   * @param {Object} options - Опции поиска
   * @returns {Object}
   */
  async searchChunks(query, options = {}) {
    const {
      topK = 3,
      templateId = null,
      tags = null
    } = options;

    console.log(`🔍 Searching for: "${query}"`);

    if (!this.collection) {
      await this.initialize();
    }

    // Создаём embedding для запроса
    const queryEmbedding = await this.getEmbedding(query);

    // Фильтры
    const where = {};
    if (templateId) where.templateId = templateId;
    if (tags) where.tags = { $contains: tags };

    // Поиск
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: Object.keys(where).length > 0 ? where : undefined
    });

    console.log(`   Found ${results.ids[0].length} results`);

    return {
      query,
      results: results.ids[0].map((id, index) => ({
        id,
        chunkId: results.metadatas[0][index].chunkId,
        title: results.metadatas[0][index].title,
        distance: results.distances[0][index],
        relevance: this.distanceToRelevance(results.distances[0][index]),
        content: results.documents[0][index]
      }))
    };
  }

  /**
   * Ответ на вопрос пользователя (RAG)
   * @param {string} question - Вопрос
   * @param {Object} context - Контекст (шаблон, формы)
   * @returns {Object}
   */
  async answerQuestion(question, context = {}) {
    console.log(`💬 Answering question: "${question}"`);

    // 1. Находим релевантные чанки
    const searchResults = await this.searchChunks(question, {
      topK: 3,
      templateId: context.templateId
    });

    // 2. Собираем контекст из чанков
    const chunksContext = searchResults.results
      .map(r => `### ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    // 3. Формируем промпт для Claude
    const systemPrompt = `Ты - AI-помощник для системы "Динамический Планировщик".
Твоя задача - помогать пользователям работать с большими шаблонами и формами.

Правила:
- Отвечай чётко и конкретно на русском языке
- Если ответ касается заполнения полей, укажи точные инструкции
- Ссылайся на конкретные разделы документации
- Если не знаешь ответа - скажи об этом честно
- Используй эмодзи для лучшего восприятия`;

    const userPrompt = `Контекст из документации:

${chunksContext}

${context.templateName ? `Информация о текущем шаблоне:
- Название: ${context.templateName}
- Описание: ${context.templateDescription || 'Не указано'}
` : ''}

${context.currentSection ? `Текущий раздел: ${context.currentSection}` : ''}

Вопрос пользователя: ${question}

Дай полезный ответ:`;

    // 4. Получаем ответ от Claude
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const answer = response.content[0].text;

    console.log(`   ✅ Answer generated (${answer.length} chars)`);

    return {
      question,
      answer,
      sources: searchResults.results.map(r => ({
        chunkId: r.chunkId,
        title: r.title,
        relevance: r.relevance
      })),
      confidence: this.calculateConfidence(searchResults.results),
      usage: response.usage
    };
  }

  /**
   * Автозаполнение поля на основе контекста
   * @param {Object} field - Поле для заполнения
   * @param {Object} formData - Уже заполненные данные
   * @param {Array} templateChunks - Чанки шаблона
   * @returns {string}
   */
  async autoFillField(field, formData, templateChunks) {
    console.log(`✨ Auto-filling field: ${field.label}`);

    // Находим chunk, содержащий это поле
    const relevantChunk = templateChunks.find(chunk =>
      chunk.content.sections.some(s =>
        s.fields.some(f => f.id === field.id)
      )
    );

    // Собираем контекст
    const relatedFieldsData = this.getRelatedFieldsData(field, formData);
    const chunkContext = relevantChunk ? this.chunkToText(relevantChunk) : '';

    const systemPrompt = `Ты - AI-помощник для автозаполнения форм.
Твоя задача - сгенерировать подходящее значение для поля на основе контекста.

Правила:
- Верни ТОЛЬКО значение для поля, без объяснений
- Значение должно быть релевантным и полезным
- Используй информацию из уже заполненных полей
- Следуй указанным примерам и инструкциям
- Для текстовых полей: 1-3 предложения
- Для списков: выбери наиболее подходящий вариант`;

    const userPrompt = `Заполни поле в форме:

**Поле:** ${field.label}
**Тип:** ${field.type}
${field.description ? `**Описание:** ${field.description}` : ''}
${field.aiPrompt ? `**Инструкция:** ${field.aiPrompt}` : ''}

${field.aiExamples && field.aiExamples.length > 0 ? `**Примеры:**
${field.aiExamples.map(ex => `- ${ex}`).join('\n')}
` : ''}

${Object.keys(relatedFieldsData).length > 0 ? `**Уже заполненные связанные поля:**
${JSON.stringify(relatedFieldsData, null, 2)}
` : ''}

${chunkContext ? `**Контекст раздела:**
${chunkContext.slice(0, 1000)}...
` : ''}

Сгенерируй значение:`;

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const value = response.content[0].text.trim();

    console.log(`   ✅ Generated value: "${value.slice(0, 50)}..."`);

    return value;
  }

  /**
   * Получить данные связанных полей
   * @param {Object} field
   * @param {Object} formData
   * @returns {Object}
   */
  getRelatedFieldsData(field, formData) {
    if (!field.aiDependsOn) return {};

    const related = {};
    for (const fieldId of field.aiDependsOn) {
      if (formData[fieldId]) {
        related[fieldId] = formData[fieldId];
      }
    }
    return related;
  }

  /**
   * Преобразование distance в relevance (0-1)
   * @param {number} distance
   * @returns {number}
   */
  distanceToRelevance(distance) {
    // Cosine distance: 0 (идентичные) до 2 (противоположные)
    // Превращаем в relevance: 1 (отлично) до 0 (плохо)
    return Math.max(0, Math.min(1, 1 - distance / 2));
  }

  /**
   * Расчёт уверенности на основе релевантности результатов
   * @param {Array} results
   * @returns {number}
   */
  calculateConfidence(results) {
    if (!results || results.length === 0) return 0;

    const avgRelevance = results.reduce((sum, r) => sum + r.relevance, 0) / results.length;
    return avgRelevance;
  }

  /**
   * Удаление индексов шаблона
   * @param {string} templateId
   */
  async deleteTemplateIndex(templateId) {
    console.log(`🗑️ Deleting index for template: ${templateId}`);

    if (!this.collection) {
      await this.initialize();
    }

    const results = await this.collection.get({
      where: { templateId }
    });

    if (results.ids.length > 0) {
      await this.collection.delete({
        ids: results.ids
      });
      console.log(`   ✅ Deleted ${results.ids.length} chunks`);
    }

    return { deleted: results.ids.length };
  }

  /**
   * Задержка
   * @param {number} ms
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RAGEngine;
