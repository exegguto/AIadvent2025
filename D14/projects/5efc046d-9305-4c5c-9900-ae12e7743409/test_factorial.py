import factorial

def test_factorial():
    assert factorial.factorial(1) == 1
    assert factorial.factorial(5) == 120
    assert factorial.factorial(10) == 3628800

def test_factorial_errors():
    with pytest.raises(ValueError):
        factorial.factorial(-1)
    with pytest.raises(ValueError):
        factorial.factorial(1.5)