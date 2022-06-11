from time import sleep
import keyboard


def main():
    print("starting in 3 seconds")
    sleep(3)

    start = 6061
    end = 15950
    for i in range(start, end + 1):
        print(i)
        keyboard.write(f".info {i}")
        keyboard.press_and_release("enter")
        sleep(6)


if __name__ == "__main__":
    main()
