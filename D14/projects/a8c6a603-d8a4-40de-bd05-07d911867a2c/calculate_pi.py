import math

def calculate_pi(precision=6):
    """
    Возвращает значение числа Pi с заданной точностью после запятой.
    """
    q, r, t, k, n, l = 1, 0, 1, 1, 3, 3
    decimal = 0
    counter = 0
    pi = ""
    while counter < precision + 1:
        if 4*q+r-t < n*t:
            pi += str(n)
            if counter == 0:
                pi += "."
            if decimal == 10:
                decimal = 0
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
    return pi