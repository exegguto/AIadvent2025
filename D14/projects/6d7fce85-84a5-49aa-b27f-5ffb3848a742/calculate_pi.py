def calculate_pi(precision=5):
    pi = 0
    k = 0
    
    while True:
        term = (1 / (16 ** k)) * (
            (4 / (8 * k + 1)) - 
            (2 / (8 * k + 4)) - 
            (1 / (8 * k + 5)) - 
            (1 / (8 * k + 6))
        )
        pi += term
        if abs(term) < 10**(-precision):
            break
        k += 1

    return round(pi, precision)

if __name__ == "__main__":
    pi_value = calculate_pi(5)
    print(f"Число π до 5 знаков: {pi_value}")