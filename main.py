### SAS VBD Activity Fair Table Driver
# Control L298 module for H bridge control of motors


# Constants
channel = 9
motorApwm = AnalogPin.P0
motorA1 = DigitalPin.P8
motorA2 = DigitalPin.P9
motorBpwm = AnalogPin.P1
motorB1 = DigitalPin.P2
motorB2 = DigitalPin.P16

# Global vars
x_recv = 0
y_recv = 0
enable = True
joystick = True

def plot_single_bar( column, value, max_value ):
    segment = max_value / 6
    for r in range(0,6):
        if (value > (r+1)*segment):
            led.plot(column, 4-r)
        else:
            led.unplot(column, 4-r)

def motorA( val ):
    # val: -255 to 255
    if val == 0:
        led.plot(0, 0)
        led.plot(0,1)
        pins.digital_write_pin(motorA1, 1)
        pins.digital_write_pin(motorA2, 1)

    elif val < 0:
        led.plot(0, 0)
        led.unplot(0,1)
        pins.digital_write_pin(motorA1, 1)
        pins.digital_write_pin(motorA2, 0)

    else:
        led.unplot(0, 0)
        led.plot(0,1)
        pins.digital_write_pin(motorA1, 0)
        pins.digital_write_pin(motorA2, 1)

    led.plot_brightness(0, 4, abs(val))
    plot_single_bar(1,abs(val),255)
    pins.analog_write_pin(motorApwm, abs(val)*4)

def motorB( val ):
    # val: -255 to 255
    if val == 0:
        led.plot(4, 0)
        led.plot(4,1)
        pins.digital_write_pin(motorB1, 1)
        pins.digital_write_pin(motorB2, 1)
    elif val < 0:
        led.plot(4, 0)
        led.unplot(4,1)
        pins.digital_write_pin(motorB1, 1)
        pins.digital_write_pin(motorB2, 0)
    else:
        led.unplot(4, 0)
        led.plot(4,1)
        pins.digital_write_pin(motorB1, 0)
        pins.digital_write_pin(motorB2, 1)
    led.plot_brightness(4, 4, abs(val))
    plot_single_bar(3,abs(val),255)
    pins.analog_write_pin(motorBpwm, abs(val)*4)


def update_motor():
    x = -1 * x_recv
    y = 1 * y_recv
    v = (100-abs(x))*(y//100)+y
    w = (100-abs(y))*(x//100)+x
    r = (v+w)/-2
    l = (v-w)/2
    r *= -6.375
    l *= -6.375
    if abs(r) < 5:
        r = 0
    if abs(l) < 5:
        l = 0
    if r > 254:
        r = 254
    if l > 254:
        l = 254
    if r < -254:
        r = -254
    if l < -254:
        l = -254
    r = int(r)
    l = int(l)
    serial.write_line("L" + str(l) + "\tR" + str(r) + "\n")
    #robotbit.motor_run_dual(robotbit.Motors.M2B, l, robotbit.Motors.M2A, r)
    motorA( l )
    motorB( r )

def kill():
    enable = False
    x_recv = 0
    y_recv = 0
    update_motor()
    basic.show_string("X")
    while(True):
        basic.pause(100)

def on_received_value(name, value):
    global x_recv, y_recv, enable
    # serial.write_value(name,value)
    if name == 'X':
        x_recv = value
        update_motor()
    elif name == 'Y':
        y_recv = value
        update_motor()
    elif name == 'C':
        #robotbit.motor_stop_all()
        x_recv = 0
        y_recv = 0
        update_motor()
    elif name == 'D':
        #robotbit.motor_run(robotbit.Motors.M2B, -200*value)
        motorB( value * -250 )
    elif name == 'F':
        #robotbit.motor_run(robotbit.Motors.M2A, 200*value)
        motorA( value * 250 )
    elif name == 'E':
        #robotbit.motor_run_dual(robotbit.Motors.M2B, -200*value, robotbit.Motors.M2A, 200*value)
        if value == 1:
            joystick = not joystick
            led.toggle(2, 0)
    elif name == 'A' or name == 'B':
        kill()


def on_forever():
    pass
def on_button_pressed_a():
    kill()
def on_button_pressed_b():
    kill()

radio.set_group(channel)
radio.on_received_value(on_received_value)
#basic.forever(on_forever)
input.on_button_pressed(Button.A, on_button_pressed_a)
input.on_button_pressed(Button.B, on_button_pressed_b)

basic.show_number(channel)
basic.pause(100)
basic.clear_screen()
serial.write_value("START", 0)
# serial.write_line("START\n")


update_motor()

