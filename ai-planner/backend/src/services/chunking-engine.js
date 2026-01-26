/**
 * Chunking Engine - разбиение больших шаблонов на части
 *
 * Основная задача: разделить шаблон на 5000+ строк на логические чанки
 * размером ~500 строк каждый для удобной работы и AI-обработки
 */

class ChunkingEngine {
  constructor(config = {}) {
    this.maxChunkSize = config.maxChunkSize || 500; // строк JSON
    this.minChunkSize = config.minChunkSize || 100;
    this.overlapSize = config.overlapSize || 50; // overlap для контекста
    this.targetTokensPerChunk = config.targetTokensPerChunk || 2000;
  }

  /**
   * Главная функция: разбиение шаблона на чанки
   * @param {Object} template - Исходный шаблон
   * @returns {Object} Шаблон с разбитыми чанками
   */
  chunkTemplate(template) {
    console.log(`📦 Chunking template: ${template.name}`);
    console.log(`   Sections: ${template.sections?.length || 0}`);

    const chunks = [];
    let currentChunk = this.createNewChunk(0);
    let currentLineCount = 0;

    // Обрабатываем каждую секцию
    for (let i = 0; i < template.sections.length; i++) {
      const section = template.sections[i];
      const sectionLines = this.estimateLines(section);

      console.log(`   Processing section ${i + 1}: "${section.name}" (${sectionLines} lines)`);

      // Если секция влезает в текущий chunk
      if (currentLineCount + sectionLines <= this.maxChunkSize) {
        currentChunk.content.sections.push(section);
        currentChunk.tags = [...new Set([...currentChunk.tags, ...(section.tags || [])])];
        currentLineCount += sectionLines;

        if (!currentChunk.title) {
          currentChunk.title = section.name;
        }
      }
      // Если секция слишком большая - разбиваем её
      else if (sectionLines > this.maxChunkSize) {
        // Сохраняем текущий chunk, если есть данные
        if (currentChunk.content.sections.length > 0) {
          currentChunk.endLine = currentChunk.startLine + currentLineCount - 1;
          chunks.push(currentChunk);
          console.log(`   ✅ Chunk ${currentChunk.id} completed (${currentLineCount} lines)`);
        }

        // Разбиваем большую секцию
        const subChunks = this.splitLargeSection(section, chunks.length);
        chunks.push(...subChunks);
        console.log(`   ⚡ Large section split into ${subChunks.length} sub-chunks`);

        // Начинаем новый chunk
        currentChunk = this.createNewChunk(chunks.length);
        currentLineCount = 0;
      }
      // Начинаем новый chunk
      else {
        currentChunk.endLine = currentChunk.startLine + currentLineCount - 1;
        chunks.push(currentChunk);
        console.log(`   ✅ Chunk ${currentChunk.id} completed (${currentLineCount} lines)`);

        currentChunk = this.createNewChunk(chunks.length);
        currentChunk.content.sections.push(section);
        currentChunk.title = section.name;
        currentChunk.tags = section.tags || [];
        currentLineCount = sectionLines;
      }
    }

    // Добавляем последний chunk
    if (currentChunk.content.sections.length > 0) {
      currentChunk.endLine = currentChunk.startLine + currentLineCount - 1;
      chunks.push(currentChunk);
      console.log(`   ✅ Final chunk ${currentChunk.id} completed (${currentLineCount} lines)`);
    }

    // Создаём индекс
    const index = this.buildIndex(chunks);

    const result = {
      ...template,
      metadata: {
        ...template.metadata,
        totalChunks: chunks.length,
        chunkSize: this.maxChunkSize,
        chunkedAt: new Date().toISOString()
      },
      chunks,
      index
    };

    console.log(`✅ Chunking complete: ${chunks.length} chunks created`);
    return result;
  }

  /**
   * Оценка количества строк JSON для секции
   * @param {Object} section
   * @returns {number}
   */
  estimateLines(section) {
    const jsonString = JSON.stringify(section, null, 2);
    return jsonString.split('\n').length;
  }

  /**
   * Разбиение большой секции на под-секции
   * @param {Object} section
   * @param {number} startIndex
   * @returns {Array}
   */
  splitLargeSection(section, startIndex) {
    const chunks = [];
    const fields = section.fields || [];

    // Вычисляем сколько полей на chunk
    const fieldsPerChunk = Math.ceil(
      fields.length /
      Math.ceil(this.estimateLines(section) / this.maxChunkSize)
    );

    let partNumber = 1;
    for (let i = 0; i < fields.length; i += fieldsPerChunk) {
      const subFields = fields.slice(i, i + fieldsPerChunk);

      const subSection = {
        ...section,
        id: `${section.id}-part-${partNumber}`,
        name: `${section.name} (часть ${partNumber})`,
        fields: subFields
      };

      const chunk = this.createNewChunk(startIndex + chunks.length);
      chunk.title = subSection.name;
      chunk.tags = section.tags || [];
      chunk.content.sections = [subSection];
      chunk.endLine = chunk.startLine + this.estimateLines(subSection) - 1;

      chunks.push(chunk);
      partNumber++;
    }

    return chunks;
  }

  /**
   * Создание нового chunk
   * @param {number} index
   * @returns {Object}
   */
  createNewChunk(index) {
    const startLine = index === 0 ? 1 : null; // Будет пересчитано позже

    return {
      id: `chunk-${String(index + 1).padStart(3, '0')}`,
      title: '',
      startLine: startLine || 1,
      endLine: 0,
      tags: [],
      embedding: null, // Будет заполнено при индексации
      content: {
        sections: []
      }
    };
  }

  /**
   * Построение индекса для быстрого поиска
   * @param {Array} chunks
   * @returns {Object}
   */
  buildIndex(chunks) {
    const byTag = {};
    const bySection = {};
    const byId = {};

    for (const chunk of chunks) {
      // Индекс по ID
      byId[chunk.id] = chunk;

      // Индекс по тегам
      for (const tag of chunk.tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(chunk.id);
      }

      // Индекс по названиям секций
      for (const section of chunk.content.sections) {
        if (!bySection[section.name]) bySection[section.name] = [];
        bySection[section.name].push(chunk.id);
      }
    }

    return { byTag, bySection, byId };
  }

  /**
   * Добавление overlap между чанками для контекста
   * @param {Array} chunks
   * @returns {Array}
   */
  addOverlap(chunks) {
    if (this.overlapSize === 0 || chunks.length < 2) {
      return chunks;
    }

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const currentChunk = chunks[i];

      // Берём последние N полей из предыдущего chunk
      const prevSections = prevChunk.content.sections;
      if (prevSections.length > 0) {
        const lastSection = prevSections[prevSections.length - 1];
        const fieldsToOverlap = lastSection.fields.slice(-Math.ceil(this.overlapSize / 10));

        if (fieldsToOverlap.length > 0) {
          // Добавляем в начало текущего chunk как "контекст"
          currentChunk.content.context = {
            from: prevChunk.id,
            fields: fieldsToOverlap
          };
        }
      }
    }

    return chunks;
  }

  /**
   * Статистика по чанкам
   * @param {Array} chunks
   * @returns {Object}
   */
  getStatistics(chunks) {
    const stats = {
      totalChunks: chunks.length,
      avgLinesPerChunk: 0,
      minLines: Infinity,
      maxLines: 0,
      totalSections: 0,
      totalFields: 0
    };

    let totalLines = 0;

    for (const chunk of chunks) {
      const lines = chunk.endLine - chunk.startLine + 1;
      totalLines += lines;
      stats.minLines = Math.min(stats.minLines, lines);
      stats.maxLines = Math.max(stats.maxLines, lines);

      stats.totalSections += chunk.content.sections.length;

      for (const section of chunk.content.sections) {
        stats.totalFields += section.fields?.length || 0;
      }
    }

    stats.avgLinesPerChunk = Math.round(totalLines / chunks.length);

    return stats;
  }
}

module.exports = ChunkingEngine;
