import unittest
from factorial import factorial

class TestFactorial(unittest.TestCase):
    def test_base_case(self):
        self.assertEqual(factorial(0), 1)

    def test_small_numbers(self):
        self.assertEqual(factorial(1), 1)
        self.assertEqual(factorial(5), 120)

    def test_large_number(self):
        self.assertEqual(factorial(10), 3628800)

if __name__ == '__main__':
    unittest.main()