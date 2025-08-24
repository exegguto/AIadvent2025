def factorial(n):
    if not isinstance(n, int) or n < 0:
        raise ValueError("Factorial is undefined for non-integers and negative numbers")
    
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result