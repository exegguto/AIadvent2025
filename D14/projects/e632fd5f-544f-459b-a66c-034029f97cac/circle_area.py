import math

def circle_area(radius):
    """
    Вычисляет площадь круга по заданному радиусу.

    :param radius: Радиус круга (должен быть неотрицательным числом)
    :return: Площадь круга
    :raises ValueError: Если радиус отрицательный
    """
    if radius < 0:
        raise ValueError("Радиус не может быть отрицательным")
    return math.pi * (radius ** 2)