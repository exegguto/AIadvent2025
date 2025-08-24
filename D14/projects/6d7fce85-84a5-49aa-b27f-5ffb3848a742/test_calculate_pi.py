import unittest
from calculate_pi import calculate_pi

class TestCalculatePi(unittest.TestCase):
    def test_calculate_pi_with_default_precision(self):
        self.assertEqual(calculate_pi(), 3.14159)

    def test_calculate_pi_with_high_precision(self):
        self.assertEqual(calculate_pi(10), 3.1415926536)

    def test_calculate_pi_zero_precision(self):
        self.assertEqual(calculate_pi(0), 3)

if __name__ == '__main__':
    unittest.main()