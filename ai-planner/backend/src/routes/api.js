/**
 * API Routes для AI-powered Планировщика
 */

const express = require('express');
const router = express.Router();
const ChunkingEngine = require('../services/chunking-engine');
const RAGEngine = require('../services/rag-engine');

// Инициализация сервисов
const chunker = new ChunkingEngine({
  maxChunkSize: 500,
  minChunkSize: 100,
  overlapSize: 50
});

const rag = new RAGEngine({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  collectionName: 'planner-chunks'
});

// Инициализация RAG при старте
rag.initialize().catch(err => {
  console.error('Failed to initialize RAG:', err);
});

/**
 * POST /api/chunk
 * Разбивает шаблон на чанки
 */
router.post('/chunk', async (req, res) => {
  try {
    const { template } = req.body;

    if (!template || !template.sections) {
      return res.status(400).json({
        error: 'Invalid template format. Required: { sections: [...] }'
      });
    }

    const chunkedTemplate = chunker.chunkTemplate(template);
    const stats = chunker.getStatistics(chunkedTemplate.chunks);

    res.json({
      success: true,
      template: chunkedTemplate,
      stats
    });
  } catch (error) {
    console.error('Chunking error:', error);
    res.status(500).json({
      error: 'Failed to chunk template',
      details: error.message
    });
  }
});

/**
 * POST /api/index
 * Индексирует чанки в векторную БД
 */
router.post('/index', async (req, res) => {
  try {
    const { chunks, templateId } = req.body;

    if (!chunks || !Array.isArray(chunks)) {
      return res.status(400).json({
        error: 'Invalid chunks format. Required: { chunks: [...], templateId: "..." }'
      });
    }

    const result = await rag.indexChunks(chunks, templateId || 'default');

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Indexing error:', error);
    res.status(500).json({
      error: 'Failed to index chunks',
      details: error.message
    });
  }
});

/**
 * POST /api/search
 * Семантический поиск по чанкам
 */
router.post('/search', async (req, res) => {
  try {
    const { query, topK = 3, templateId, tags } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const results = await rag.searchChunks(query, {
      topK,
      templateId,
      tags
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search',
      details: error.message
    });
  }
});

/**
 * POST /api/ask
 * Задать вопрос AI помощнику
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, context = {} } = req.body;

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    const result = await rag.answerQuestion(question, context);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      details: error.message
    });
  }
});

/**
 * POST /api/autofill
 * Автозаполнение поля
 */
router.post('/autofill', async (req, res) => {
  try {
    const { field, formData = {}, templateChunks = [] } = req.body;

    if (!field || !field.id) {
      return res.status(400).json({
        error: 'Field object with id is required'
      });
    }

    const value = await rag.autoFillField(field, formData, templateChunks);

    res.json({
      success: true,
      fieldId: field.id,
      value
    });
  } catch (error) {
    console.error('AutoFill error:', error);
    res.status(500).json({
      error: 'Failed to auto-fill field',
      details: error.message
    });
  }
});

/**
 * DELETE /api/index/:templateId
 * Удалить индекс шаблона
 */
router.delete('/index/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await rag.deleteTemplateIndex(templateId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Delete index error:', error);
    res.status(500).json({
      error: 'Failed to delete index',
      details: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      chunking: 'ready',
      rag: rag.collection ? 'ready' : 'initializing',
      chroma: process.env.CHROMA_URL || 'http://localhost:8000'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
