import unittest
from calculate_pi import calculate_pi

class TestCalculatePi(unittest.TestCase):
    def test_calculate_pi_valid_results(self):
        """Test calculate_pi function with different precision levels"""
        
        # Test calculate_pi() for precision 5
        result = calculate_pi(5)
        self.assertEqual(result, '3.14159', f"Expected '3.14159', got '{result}'")
        
        # Test calculate_pi() for precision 3
        result = calculate_pi(3)
        self.assertEqual(result, '3.142', f"Expected '3.142', got '{result}'")
        
        # Test calculate_pi() for precision 1
        result = calculate_pi(1)
        self.assertEqual(result, '3.1', f"Expected '3.1', got '{result}'")
    
    def test_calculate_pi_type(self):
        """Test that calculate_pi returns a string"""
        result = calculate_pi(2)
        self.assertIsInstance(result, str, f"Expected string, got {type(result)}")
    
    def test_calculate_pi_format(self):
        """Test that result contains a decimal point"""
        result = calculate_pi(3)
        self.assertIn('.', result, "Result should contain a decimal point")

if __name__ == "__main__":
    unittest.main()
