from random import random, uniform


def gen_next_value(current_point, min_value, max_value):
    trend = 'up'
    one_percent = (max_value - min_value) / 100
    if random() < abs((current_point - min_value) / (max_value - min_value)) * 1.05:
        trend = 'up' if trend == 'down' else 'down'
    if trend == 'up':
        current_point = uniform(current_point, current_point + one_percent * 5)
    elif trend == 'down':
        current_point = uniform(current_point - one_percent * 5, current_point)
    return current_point


def generate_history(min_value, max_value, counter):
    result = []
    current_point = uniform(min_value, max_value)
    result.append(current_point)
    for _ in range(counter - 1):
        current_point = gen_next_value(current_point, min_value, max_value)
        result.append(current_point)
    return result
