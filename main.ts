// ## SAS VBD Activity Fair Table Driver
//  Control L298 module for H bridge control of motors
//  Constants
let channel = 9
let motorApwm = AnalogPin.P0
let motorA1 = DigitalPin.P8
let motorA2 = DigitalPin.P9
let motorBpwm = AnalogPin.P1
let motorB1 = DigitalPin.P2
let motorB2 = DigitalPin.P16
//  Global vars
let x_recv = 0
let y_recv = 0
let enable = true
let joystick = true
function plot_single_bar(column: number, value: number, max_value: number) {
    let segment = max_value / 6
    for (let r = 0; r < 6; r++) {
        if (value > (r + 1) * segment) {
            led.plot(column, 4 - r)
        } else {
            led.unplot(column, 4 - r)
        }
        
    }
}

function motorA(val: number) {
    //  val: -255 to 255
    if (val == 0) {
        led.plot(0, 0)
        led.plot(0, 1)
        pins.digitalWritePin(motorA1, 1)
        pins.digitalWritePin(motorA2, 1)
    } else if (val < 0) {
        led.plot(0, 0)
        led.unplot(0, 1)
        pins.digitalWritePin(motorA1, 1)
        pins.digitalWritePin(motorA2, 0)
    } else {
        led.unplot(0, 0)
        led.plot(0, 1)
        pins.digitalWritePin(motorA1, 0)
        pins.digitalWritePin(motorA2, 1)
    }
    
    led.plotBrightness(0, 4, Math.abs(val))
    plot_single_bar(1, Math.abs(val), 255)
    pins.analogWritePin(motorApwm, Math.abs(val) * 4)
}

function motorB(val: number) {
    //  val: -255 to 255
    if (val == 0) {
        led.plot(4, 0)
        led.plot(4, 1)
        pins.digitalWritePin(motorB1, 1)
        pins.digitalWritePin(motorB2, 1)
    } else if (val < 0) {
        led.plot(4, 0)
        led.unplot(4, 1)
        pins.digitalWritePin(motorB1, 1)
        pins.digitalWritePin(motorB2, 0)
    } else {
        led.unplot(4, 0)
        led.plot(4, 1)
        pins.digitalWritePin(motorB1, 0)
        pins.digitalWritePin(motorB2, 1)
    }
    
    led.plotBrightness(4, 4, Math.abs(val))
    plot_single_bar(3, Math.abs(val), 255)
    pins.analogWritePin(motorBpwm, Math.abs(val) * 4)
}

function update_motor() {
    let x = -1 * x_recv
    let y = 1 * y_recv
    let v = (100 - Math.abs(x)) * Math.idiv(y, 100) + y
    let w = (100 - Math.abs(y)) * Math.idiv(x, 100) + x
    let r = (v + w) / -2
    let l = (v - w) / 2
    r *= -6.375
    l *= -6.375
    if (Math.abs(r) < 5) {
        r = 0
    }
    
    if (Math.abs(l) < 5) {
        l = 0
    }
    
    if (r > 254) {
        r = 254
    }
    
    if (l > 254) {
        l = 254
    }
    
    if (r < -254) {
        r = -254
    }
    
    if (l < -254) {
        l = -254
    }
    
    r = Math.trunc(r)
    l = Math.trunc(l)
    serial.writeLine("L" + ("" + l) + "\tR" + ("" + r) + "\n")
    // robotbit.motor_run_dual(robotbit.Motors.M2B, l, robotbit.Motors.M2A, r)
    motorA(l)
    motorB(r)
}

function kill() {
    let enable = false
    let x_recv = 0
    let y_recv = 0
    update_motor()
    basic.showString("X")
    while (true) {
        basic.pause(100)
    }
}

function on_forever() {
    
}

radio.setGroup(channel)
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    let joystick: boolean;
    
    //  serial.write_value(name,value)
    if (name == "X") {
        x_recv = value
        update_motor()
    } else if (name == "Y") {
        y_recv = value
        update_motor()
    } else if (name == "C") {
        // robotbit.motor_stop_all()
        x_recv = 0
        y_recv = 0
        update_motor()
    } else if (name == "D") {
        // robotbit.motor_run(robotbit.Motors.M2B, -200*value)
        motorB(value * -250)
    } else if (name == "F") {
        // robotbit.motor_run(robotbit.Motors.M2A, 200*value)
        motorA(value * 250)
    } else if (name == "E") {
        // robotbit.motor_run_dual(robotbit.Motors.M2B, -200*value, robotbit.Motors.M2A, 200*value)
        if (value == 1) {
            joystick = !joystick
            led.toggle(2, 0)
        }
        
    } else if (name == "A" || name == "B") {
        kill()
    }
    
})
// basic.forever(on_forever)
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    kill()
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    kill()
})
basic.showNumber(channel)
basic.pause(100)
basic.clearScreen()
serial.writeValue("START", 0)
//  serial.write_line("START\n")
update_motor()
