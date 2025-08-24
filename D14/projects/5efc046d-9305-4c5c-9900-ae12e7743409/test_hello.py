import unittest
from your_module import hello  # Импортируйте функцию hello из вашего модуля

class TestHello(unittest.TestCase):
    def test_hello(self):
        self.assertEqual(hello('World'), 'Hello, World!')

    def test_hello_with_none(self):
        with self.assertRaises(TypeError):
            hello(None)

    def test_hello_with_number(self):
        with self.assertRaises(TypeError):
            hello(123)


if __name__ == '__main__':
    unittest.main()