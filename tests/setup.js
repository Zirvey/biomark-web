/**
 * @file tests/setup.js — Setup файл для тестов
 * @description Глобальные моки и утилиты
 */

import { afterEach } from 'vitest';

// Глобальные моки
global.fetch = vi.fn();

// Мок для window.matchMedia (нужен для некоторых библиотек)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для localStorage
const localStorageMock = {
  store: {},
  getItem: function (key) {
    return this.store[key] || null;
  },
  setItem: function (key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function (key) {
    delete this.store[key];
  },
  clear: function () {
    this.store = {};
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Очищать моки после каждого теста
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
