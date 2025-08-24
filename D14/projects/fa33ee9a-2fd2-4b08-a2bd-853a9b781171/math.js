function sum(a, b) {
  // Validate the inputs
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers')
  }
  return a + b;
}
module.exports = sum; // Export the function so it can be used in other files