/**
 * @file vitest.config.js — Конфигурация Vitest
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // Глобальные API (describe, it, expect, etc.)
    globals: true,
    
    // Среда выполнения (jsdom для DOM тестов)
    environment: 'jsdom',
    
    // Паттерн для поиска тестов
    include: ['**/*.test.{js,ts}'],
    
    // Покрытие кода
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/js/**/*.js'],
      exclude: ['src/js/**/*.test.js'],
    },
    
    // Setup файлы
    setupFiles: ['./tests/setup.js'],
    
    // Автосоздание моков
    mockReset: true,
    
    // Очищать моки между тестами
    clearMocks: true,
  },
});
