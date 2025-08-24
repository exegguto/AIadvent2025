def calculate_pi(precision: int = 5) -> str:
    """
    Calculate pi using the Chudnovsky algorithm
    Returns pi as a string with specified precision
    """
    q, r, t, k, n, l = 1, 0, 1, 1, 3, 3
    counter = 0
    result = []
    
    while counter < precision + 1:
        if 4*q+r-t < n*t:
            result.append(str(n))
            if counter == 0:
                result.append('.')
            counter += 1
            nr = 10*(r-n*t)
            n = ((10*(3*q+r))//t)-10*n
            q *= 10
            r = nr
        else:
            nr = (2*q+r)*l
            nn = (q*(7*k+2)+r*l)//(t*l)
            q *= k
            t *= l
            l += 2
            k += 1
            n = nn
            r = nr
    
    return ''.join(result)

# Test the function
if __name__ == "__main__":
    result = calculate_pi(5)
    print(f"Pi with 5 decimal places: {result}")
    print(f"Expected: 3.14159")
    print(f"Test passed: {result == '3.14159'}")
