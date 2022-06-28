from time import sleep
import keyboard
import sys


def main():
    print("starting in 3 seconds")
    sleep(3)

    start = int(sys.argv[1])
    end = int(sys.argv[2])
    for i in range(start, end + 1):
        print(i)
        keyboard.write(f".info {i}")
        keyboard.press_and_release("enter")
        sleep(6)


if __name__ == "__main__":
    main()
