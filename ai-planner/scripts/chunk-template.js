#!/usr/bin/env node
/**
 * CLI Script: Chunking Template
 *
 * Использование:
 * node scripts/chunk-template.js --input template.json --output template.chunks.json --chunk-size 500
 */

const fs = require('fs');
const path = require('path');
const ChunkingEngine = require('../backend/src/services/chunking-engine');

// Парсинг аргументов командной строки
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    output: null,
    chunkSize: 500,
    minChunkSize: 100,
    overlapSize: 50
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--chunk-size':
        options.chunkSize = parseInt(args[++i], 10);
        break;
      case '--min-chunk-size':
        options.minChunkSize = parseInt(args[++i], 10);
        break;
      case '--overlap':
        options.overlapSize = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
AI Planner - Template Chunking Script

Usage:
  node scripts/chunk-template.js [options]

Options:
  -i, --input <file>         Input template JSON file (required)
  -o, --output <file>        Output chunked JSON file (required)
  --chunk-size <number>      Maximum chunk size in lines (default: 500)
  --min-chunk-size <number>  Minimum chunk size in lines (default: 100)
  --overlap <number>         Overlap size for context (default: 50)
  -h, --help                 Show this help message

Examples:
  # Basic usage
  node scripts/chunk-template.js -i template.json -o template.chunks.json

  # Custom chunk size
  node scripts/chunk-template.js -i template.json -o output.json --chunk-size 1000

  # With overlap
  node scripts/chunk-template.js -i template.json -o output.json --overlap 100
`);
}

function validateOptions(options) {
  if (!options.input) {
    console.error('❌ Error: Input file is required (use --input or -i)');
    process.exit(1);
  }

  if (!options.output) {
    console.error('❌ Error: Output file is required (use --output or -o)');
    process.exit(1);
  }

  if (!fs.existsSync(options.input)) {
    console.error(`❌ Error: Input file not found: ${options.input}`);
    process.exit(1);
  }

  if (options.chunkSize < 50) {
    console.error('❌ Error: Chunk size must be at least 50 lines');
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 AI Planner - Template Chunking Tool\n');

  const options = parseArgs();
  validateOptions(options);

  try {
    // Читаем входной файл
    console.log(`📖 Reading template: ${options.input}`);
    const inputContent = fs.readFileSync(options.input, 'utf8');
    const template = JSON.parse(inputContent);

    console.log(`   Template: ${template.name || 'Unnamed'}`);
    console.log(`   Sections: ${template.sections?.length || 0}`);

    // Создаём chunking engine
    const chunker = new ChunkingEngine({
      maxChunkSize: options.chunkSize,
      minChunkSize: options.minChunkSize,
      overlapSize: options.overlapSize
    });

    console.log(`\n⚙️  Chunking configuration:`);
    console.log(`   Max chunk size: ${options.chunkSize} lines`);
    console.log(`   Min chunk size: ${options.minChunkSize} lines`);
    console.log(`   Overlap: ${options.overlapSize} lines`);
    console.log('');

    // Разбиваем на чанки
    const chunkedTemplate = chunker.chunkTemplate(template);

    // Добавляем overlap если нужно
    if (options.overlapSize > 0) {
      chunker.addOverlap(chunkedTemplate.chunks);
    }

    // Статистика
    const stats = chunker.getStatistics(chunkedTemplate.chunks);

    console.log('\n📊 Statistics:');
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Avg lines per chunk: ${stats.avgLinesPerChunk}`);
    console.log(`   Min lines: ${stats.minLines}`);
    console.log(`   Max lines: ${stats.maxLines}`);
    console.log(`   Total sections: ${stats.totalSections}`);
    console.log(`   Total fields: ${stats.totalFields}`);

    // Сохраняем результат
    console.log(`\n💾 Saving to: ${options.output}`);
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      options.output,
      JSON.stringify(chunkedTemplate, null, 2),
      'utf8'
    );

    console.log('✅ Done!\n');

    // Выводим список чанков
    console.log('📦 Chunks created:');
    for (const chunk of chunkedTemplate.chunks) {
      console.log(`   ${chunk.id}: ${chunk.title} (lines ${chunk.startLine}-${chunk.endLine})`);
    }

    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
