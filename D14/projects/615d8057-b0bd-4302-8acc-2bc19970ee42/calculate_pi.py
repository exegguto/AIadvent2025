import random

def calculate_pi(num_samples: int) -> float:
    inside_circle = 0

    for _ in range(num_samples):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x**2 + y**2 <= 1:
            inside_circle += 1

    return round((inside_circle / num_samples) * 4, 5)

if __name__ == "__main__":
    num_samples = 1000000  # Число случайных точек
    pi_value = calculate_pi(num_samples)
    print(f"Приближенное значение π: {pi_value}")