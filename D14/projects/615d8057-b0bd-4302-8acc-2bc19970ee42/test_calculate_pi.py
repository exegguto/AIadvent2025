import pytest
from calculate_pi import calculate_pi

def test_calculate_pi():
    assert isinstance(calculate_pi(1000), float)
    assert 3.14 <= calculate_pi(100000) <= 3.15  # Проверяем, что результат близок к известному значению π

if __name__ == "__main__":
    pytest.main()