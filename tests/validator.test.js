/**
 * @file tests/validator.test.js — Тесты для validator.js
 * @see src/js/utils/validator.js
 */

import { describe, it, expect } from 'vitest';
import { validator } from '../src/js/utils/validator.js';

describe('validator.email', () => {
  it('должен принимать валидный email', () => {
    expect(validator.email('test@example.com').valid).toBe(true);
    expect(validator.email('user.name@domain.cz').valid).toBe(true);
  });

  it('должен отклонять пустой email', () => {
    const result = validator.email('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять email без @', () => {
    const result = validator.email('invalid.email');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Некорректный');
  });

  it('должен отклонять email без домена', () => {
    const result = validator.email('test@');
    expect(result.valid).toBe(false);
  });

  it('должен отклонять слишком длинный email', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = validator.email(longEmail);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('длинный');
  });
});

describe('validator.phone', () => {
  it('должен принимать валидный телефон', () => {
    expect(validator.phone('+420 123 456 789').valid).toBe(true);
    expect(validator.phone('+1 555 123 4567').valid).toBe(true);
    expect(validator.phone('1234567890').valid).toBe(true);
  });

  it('должен отклонять пустой телефон', () => {
    const result = validator.phone('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять телефон с менее чем 10 цифрами', () => {
    const result = validator.phone('12345');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('10-15 цифр');
  });

  it('должен отклонять телефон с более чем 15 цифрами', () => {
    const result = validator.phone('1234567890123456');
    expect(result.valid).toBe(false);
  });
});

describe('validator.name', () => {
  it('должен принимать валидное имя', () => {
    expect(validator.name('Иван Иванов').valid).toBe(true);
    expect(validator.name('Jan Novak').valid).toBe(true);
  });

  it('должен отклонять пустое имя', () => {
    const result = validator.name('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязательно');
  });

  it('должен отклонять имя короче 2 символов', () => {
    const result = validator.name('А');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('минимум 2 символа');
  });

  it('должен отклонять имя длиннее 100 символов', () => {
    const longName = 'a'.repeat(101);
    const result = validator.name(longName);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('100 символов');
  });
});

describe('validator.address', () => {
  it('должен принимать валидный адрес', () => {
    expect(validator.address('Прага, ул. Примерная, д. 1').valid).toBe(true);
  });

  it('должен отклонять пустой адрес', () => {
    const result = validator.address('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять адрес короче 5 символов', () => {
    const result = validator.address('abc');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('минимум 5 символов');
  });
});

describe('validator.password', () => {
  it('должен принимать валидный пароль', () => {
    expect(validator.password('password123').valid).toBe(true);
  });

  it('должен отклонять пустой пароль', () => {
    const result = validator.password('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять пароль короче minLength', () => {
    const result = validator.password('abc', { minLength: 6 });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('минимум 6 символов');
  });

  it('должен требовать сложный пароль при requireComplex: true', () => {
    const result = validator.password('простой', { requireComplex: true });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('заглавные буквы, строчные буквы и цифры');
  });

  it('должен принимать сложный пароль', () => {
    const result = validator.password('Password123!', { requireComplex: true });
    expect(result.valid).toBe(true);
  });
});

describe('validator.cardNumber', () => {
  it('должен принимать валидный номер карты (Luhn algorithm)', () => {
    // Тестовая карта Visa
    expect(validator.cardNumber('4111111111111111').valid).toBe(true);
    // Тестовая карта Mastercard
    expect(validator.cardNumber('5500000000000004').valid).toBe(true);
  });

  it('должен отклонять пустой номер карты', () => {
    const result = validator.cardNumber('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять номер с неправильной контрольной суммой', () => {
    const result = validator.cardNumber('4111111111111112');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Некорректный');
  });

  it('должен отклонять слишком короткий номер', () => {
    const result = validator.cardNumber('411111111111');
    expect(result.valid).toBe(false);
  });

  it('должен отклонять неподдерживаемую платёжную систему', () => {
    const result = validator.cardNumber('9999999999999999');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Некорректный');
  });
});

describe('validator.cardExpiry', () => {
  it('должен принимать валидный срок действия', () => {
    // Будущая дата
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const expiry = `${String(future.getMonth() + 1).padStart(2, '0')}/${String(future.getFullYear()).slice(-2)}`;
    expect(validator.cardExpiry(expiry).valid).toBe(true);
  });

  it('должен отклонять пустой срок', () => {
    const result = validator.cardExpiry('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять истёкшую карту', () => {
    const result = validator.cardExpiry('01/20'); // 2020
    expect(result.valid).toBe(false);
    expect(result.message).toContain('истекла');
  });

  it('должен отклонять неправильный формат', () => {
    const result = validator.cardExpiry('1/25');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('ММ/ГГ');
  });
});

describe('validator.cvv', () => {
  it('должен принимать валидный CVV', () => {
    expect(validator.cvv('123').valid).toBe(true);
    expect(validator.cvv('1234').valid).toBe(true);
  });

  it('должен отклонять пустой CVV', () => {
    const result = validator.cvv('');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('обязателен');
  });

  it('должен отклонять CVV не из цифр', () => {
    const result = validator.cvv('12a');
    expect(result.valid).toBe(false);
  });

  it('должен отклонять слишком короткий CVV', () => {
    const result = validator.cvv('12');
    expect(result.valid).toBe(false);
  });
});

describe('validator.validateForm', () => {
  it('должен валидировать форму целиком', () => {
    const data = {
      email: 'test@example.com',
      name: 'Иван',
    };

    const rules = {
      email: (value) => validator.email(value),
      name: (value) => validator.name(value),
    };

    const result = validator.validateForm(data, rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('должен возвращать ошибки для невалидной формы', () => {
    const data = {
      email: 'invalid',
      name: '',
    };

    const rules = {
      email: (value) => validator.email(value),
      name: (value) => validator.name(value),
    };

    const result = validator.validateForm(data, rules);
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.name).toBeDefined();
  });
});
