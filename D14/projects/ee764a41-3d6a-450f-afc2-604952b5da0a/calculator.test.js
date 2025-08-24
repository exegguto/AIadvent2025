// Must import the calculator module you've written
const calculator = require('./calculator');

// Now, we can write some test cases.

describe("Calculator tests", () => {

  test("Addition", () => {
    let result = calculator.add(1,2);
    expect(result).toBe(3);
  });

  test("Subtraction", () => {
    let result = calculator.sub(1,2);
    expect(result).toBe(-1);
  });

  test("Multiplication", () => {
    let result = calculator.mul(2,2);
    expect(result).toBe(4);
  });

  test("Division", () => {
    let result = calculator.div(2,2);
    expect(result).toBe(1);
  });

  test("Division by zero", () => {
    expect(() => {
      calculator.div(2,0)
    }).toThrow('Cannot divide by zero');
  });

});