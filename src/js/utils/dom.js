// src/js/utils/dom.js

/**
 * Безопасно создаёт элемент с текстом (без XSS)
 * @param {string} tag - HTML тег
 * @param {string} text - Текстовое содержание
 * @param {Object} attributes - Атрибуты элемента
 * @returns {HTMLElement}
 */
export function createElementWithText(tag, text = '', attributes = {}) {
    const element = document.createElement(tag);
    if (text) element.textContent = text; // ТОЛЬКО textContent, не innerHTML!

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    return element;
}

/**
 * Вставляет элементы используя DocumentFragment (оптимизация)
 * @param {HTMLElement} parent - Родительский элемент
 * @param {HTMLElement[]} elements - Массив элементов для вставки
 */
export function appendElements(parent, elements) {
    const fragment = document.createDocumentFragment();
    elements.forEach(el => fragment.appendChild(el));
    parent.appendChild(fragment);
}

/**
 * Показывает элемент
 * @param {HTMLElement} element
 */
export function show(element) {
    if (element) element.classList.remove('hidden');
}

/**
 * Скрывает элемент
 * @param {HTMLElement} element
 */
export function hide(element) {
    if (element) element.classList.add('hidden');
}

/**
 * Переключает видимость
 * @param {HTMLElement} element
 */
export function toggle(element) {
    if (element) element.classList.toggle('hidden');
}

/**
 * Удаляет класс со всех элементов и добавляет на один
 * @param {HTMLElement[]} elements
 * @param {HTMLElement} target
 * @param {string} className
 */
export function setActiveElement(elements, target, className) {
    elements.forEach(el => el.classList.remove(className));
    target.classList.add(className);
}
