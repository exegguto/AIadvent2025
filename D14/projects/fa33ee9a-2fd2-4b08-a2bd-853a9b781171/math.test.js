const { add, multiply } = require('./math.js');

describe('Math Functions', () => {

  test('add() should add two numbers', () => {
    expect(add(1, 1)).toBe(2);
    expect(add(-1, 2)).toBe(1);
    expect(add(0, 0)).toBe(0);
  });

  test('multiply() should multiply two numbers', () => {
    expect(multiply(1, 1)).toBe(1);
    expect(multiply(-1, 2)).toBe(-2);
    expect(multiply(0, 1)).toBe(0);
  });

});