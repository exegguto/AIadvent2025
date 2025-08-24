import unittest
from main import add_numbers

class TestAddNumbers(unittest.TestCase):
    
    def test_add_integers(self):
        self.assertEqual(add_numbers(1, 2), 3)
    
    def test_add_floats(self):
        self.assertEqual(add_numbers(1.5, 2.5), 4.0)
    
    def test_add_negative_numbers(self):
        self.assertEqual(add_numbers(-1, -1), -2)

    def test_add_zero(self):
        self.assertEqual(add_numbers(0, 0), 0)
        self.assertEqual(add_numbers(5, 0), 5)

if __name__ == '__main__':
    unittest.main()