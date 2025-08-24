import main

def test_string_to_upper():
    assert main.string_to_upper('hello') == 'HELLO'
    assert main.string_to_upper('Hello World!') == 'HELLO WORLD!'
    assert main.string_to_upper('123') == '123'