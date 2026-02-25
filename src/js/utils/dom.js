/**
 * @file dom.js — Безопасная работа с DOM
 * @description Защита от XSS, безопасный рендеринг
 */

// ============================================
// XSS ЗАЩИТА
// ============================================

/**
 * Sanitize HTML (базовая защита от XSS)
 * Удаляет все теги кроме разрешённых
 * 
 * @param {string} html - Входной HTML
 * @param {Object} options - Опции
 * @param {string[]} options.allowedTags - Разрешённые теги
 * @returns {string}
 */
export function sanitizeHTML(html, options = {}) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const {
        allowedTags = ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
    } = options;

    // Создаём временный элемент
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Рекурсивно удаляем запрещённые теги
    const sanitizeNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.cloneNode();
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            // Если тег запрещён - пропускаем его содержимое
            if (!allowedTags.includes(tagName)) {
                const fragment = document.createDocumentFragment();
                node.childNodes.forEach((child) => {
                    const sanitized = sanitizeNode(child);
                    if (sanitized) {
                        fragment.appendChild(sanitized);
                    }
                });
                return fragment;
            }

            // Создаём безопасный элемент
            const safeNode = document.createElement(tagName);

            // Копируем только безопасные атрибуты
            const allowedAttrs = {
                a: ['href', 'title', 'target', 'rel'],
                '*': ['class', 'id'],
            };

            const attrs = allowedAttrs[tagName] || allowedAttrs['*'] || [];

            Array.from(node.attributes).forEach((attr) => {
                const attrName = attr.name.toLowerCase();

                // Удаляем опасные атрибуты (onclick, onerror, etc.)
                if (attrName.startsWith('on')) {
                    return;
                }

                // Удаляем javascript: в href
                if (attrName === 'href' && attr.value.toLowerCase().startsWith('javascript:')) {
                    return;
                }

                if (attrs.includes(attrName) || attrs.includes('*')) {
                    safeNode.setAttribute(attrName, attr.value);
                }
            });

            // Рекурсивно обрабатываем детей
            node.childNodes.forEach((child) => {
                const sanitized = sanitizeNode(child);
                if (sanitized) {
                    safeNode.appendChild(sanitized);
                }
            });

            return safeNode;
        }

        return null;
    };

    const fragment = document.createDocumentFragment();
    temp.childNodes.forEach((child) => {
        const sanitized = sanitizeNode(child);
        if (sanitized) {
            fragment.appendChild(sanitized);
        }
    });

    const result = document.createElement('div');
    result.appendChild(fragment);

    return result.innerHTML;
}

/**
 * Безопасно установить text content
 * @param {Element} element
 * @param {string} text
 */
export function setTextContent(element, text) {
    if (!element) return;
    element.textContent = text ?? '';
}

/**
 * Безопасно установить HTML (с санитизацией)
 * @param {Element} element
 * @param {string} html
 * @param {Object} options
 */
export function setInnerHTML(element, html, options = {}) {
    if (!element) return;
    element.innerHTML = sanitizeHTML(html, options);
}

/**
 * Создать безопасный элемент
 * @param {string} tag - Тег
 * @param {Object} props - Свойства
 * @param {string|Element} [children] - Дочерние элементы
 * @returns {Element}
 */
export function createElement(tag, props = {}, children = null) {
    const element = document.createElement(tag);

    Object.entries(props).forEach(([key, value]) => {
        // Пропускаем опасные свойства
        if (key.startsWith('on') || key === 'innerHTML') {
            return;
        }

        if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'data' && typeof value === 'object') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (typeof value === 'string' || typeof value === 'number') {
            element.setAttribute(key, value);
        }
    });

    if (children) {
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof Element) {
            element.appendChild(children);
        }
    }

    return element;
}

// ============================================
// DOM УТИЛИТЫ
// ============================================

/**
 * Найти элемент с проверкой
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
export function safeQuerySelector(selector, context = document) {
    const element = context.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
    }
    return element;
}

/**
 * Найти все элементы с проверкой
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {NodeList}
 */
export function safeQuerySelectorAll(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * Добавить обработчик события с проверкой
 * @param {Element} element
 * @param {string} event
 * @param {Function} handler
 * @param {Object} options
 */
export function safeAddEventListener(element, event, handler, options = {}) {
    if (!element) {
        console.warn('Cannot add event listener to null element');
        return;
    }

    element.addEventListener(event, handler, options);
}

/**
 * Удалить обработчик события
 * @param {Element} element
 * @param {string} event
 * @param {Function} handler
 */
export function safeRemoveEventListener(element, event, handler) {
    if (!element) return;
    element.removeEventListener(event, handler);
}

// ============================================
// ЭКСПОРТЫ
// ============================================

export default {
    sanitizeHTML,
    setTextContent,
    setInnerHTML,
    createElement,
    safeQuerySelector,
    safeQuerySelectorAll,
    safeAddEventListener,
    safeRemoveEventListener,
};

// ============================================
// ЭКСПОРТЫ ДЛЯ СОВМЕСТИМОСТИ
// ============================================

/**
 * Создать элемент с текстом (для совместимости)
 * @param {string} tag
 * @param {Object} props
 * @param {string} text
 * @returns {Element}
 */
export function createElementWithText(tag, props, text) {
    return createElement(tag, props, text);
}

/**
 * Добавить элементы (для совместимости)
 * @param {Element} parent
 * @param {Element[]} children
 */
export function appendElements(parent, ...children) {
    if (!parent) return;
    children.forEach((child) => {
        if (child) parent.appendChild(child);
    });
}

/**
 * Установить активный элемент (для совместимости)
 * @param {Element} element
 * @param {boolean} active
 */
export function setActiveElement(element, active = true) {
    if (!element) return;
    element.classList.toggle('active', active);
}

/**
 * Toggle класс (для совместимости)
 * @param {Element} element
 * @param {string} className
 */
export function toggle(element, className) {
    if (!element) return;
    element.classList.toggle(className);
}
