import unittest
from decimal import Decimal
from calculate_pi import calculate_pi

class TestCalculatePi(unittest.TestCase):

    def test_calculate_pi(self):
        result = calculate_pi()
        expected = round(Decimal(math.pi), 6)
        self.assertEqual(Decimal(result), expected)

if __name__ == "__main__":
    unittest.main()