import { describe, it, expect } from 'vitest';
import { parseMoneyToCents, centsToInput } from './money';
import { formatPhone, onlyDigits, isValidBrPhone } from './phone';

describe('dinheiro', () => {
  it('converte formatos brasileiros para centavos', () => {
    expect(parseMoneyToCents('80')).toBe(8000);
    expect(parseMoneyToCents('80,50')).toBe(8050);
    expect(parseMoneyToCents('1.234,56')).toBe(123456);
    expect(parseMoneyToCents('R$ 320,00')).toBe(32000);
    expect(parseMoneyToCents('12.5')).toBe(1250);
  });
  it('rejeita valores inválidos', () => {
    expect(parseMoneyToCents('')).toBeNull();
    expect(parseMoneyToCents('abc')).toBeNull();
    expect(parseMoneyToCents('10,999')).toBeNull();
  });
  it('mostra centavos no campo', () => expect(centsToInput(32000)).toBe('320,00'));
});

describe('telefone', () => {
  it('formata celular e fixo', () => {
    expect(formatPhone('41991234567')).toBe('(41) 99123-4567');
    expect(formatPhone('(41) 99123-4567')).toBe('(41) 99123-4567');
    expect(formatPhone('4133224455')).toBe('(41) 3322-4455');
  });
  it('limpa e valida', () => {
    expect(onlyDigits('(41) 99123-4567')).toBe('41991234567');
    expect(isValidBrPhone('(41) 99123-4567')).toBe(true);
    expect(isValidBrPhone('123')).toBe(false);
  });
});
