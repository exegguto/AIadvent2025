import unittest
from circle_area import circle_area

class TestCircleArea(unittest.TestCase):
    def test_circle_area_positive(self):
        """Тест на положительный радиус"""
        self.assertAlmostEqual(circle_area(1), 3.14159, places=5)
        self.assertAlmostEqual(circle_area(0), 0, places=5)
        self.assertAlmostEqual(circle_area(2), 12.56637, places=5)
    
    def test_circle_area_negative(self):
        """Тест на отрицательный радиус"""
        with self.assertRaises(ValueError):
            circle_area(-1)

if __name__ == '__main__':
    unittest.main()