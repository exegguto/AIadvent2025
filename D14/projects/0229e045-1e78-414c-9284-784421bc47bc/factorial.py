def factorial(n):
    """Вычисляет факториал числа n."""
    if not isinstance(n, int) or n < 0:
        raise ValueError("n должно быть неотрицательным целым числом.")
    
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)