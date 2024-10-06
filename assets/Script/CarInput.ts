const { ccclass, property } = cc._decorator;

import { instance } from "./Joystick";

@ccclass
export default class CarInput extends cc.Component {

    protected accelerationInput: number = 0;
    protected steeringInput: number = 0;
    protected moveDirecion = cc.v2();

    onLoad() {

        // if (cc.sys.isMobile) {
        //     instance.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        //     instance.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        //     instance.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        // } else {
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        // }

    }

    onTouchStart() { }

    onTouchMove(event: cc.Event.EventTouch, data) {

        this.moveDirecion = data.moveDistance; // Joystick direction
        // Get the joystick angle in degrees
        let joystickAngle = cc.misc.radiansToDegrees(Math.atan2(this.moveDirecion.y, this.moveDirecion.x));

        // Normalize both angles to the range of 0-360 degrees
        let carAngle = this.node.angle;
        carAngle = (carAngle + 360) % 360;
        let noramlAngle = (joystickAngle + 360) % 360;

        // Calculate the difference between the car's angle and the joystick angle
        let angleDiff = (noramlAngle - carAngle + 360) % 360;

        // Determine acceleration input based on joystick direction
        if (angleDiff <= 90 || angleDiff >= 270) {
            // Joystick is pointing forward (same or similar direction as the car)
            this.accelerationInput = 1; // Accelerate forward
        } else {
            // Joystick is pointing backward (opposite direction of the car)
            this.accelerationInput = -1; // Brake or reverse
        }

        // Determine steering input based on angle difference
        if (angleDiff > 45 && angleDiff < 135) {
            // Joystick is pointing to the right relative to the car
            this.steeringInput = 1; // Steer right
        } else if (angleDiff > 215 && angleDiff < 315) {
            // Joystick is pointing to the left relative to the car
            this.steeringInput = -1; // Steer left
        } else {
            // Joystick is pointing directly forward or backward; no steering adjustment
            this.steeringInput = 0;
        }
    }

    onTouchEnd(event: cc.Event.EventTouch, data) {
        this.steeringInput = 0;
        this.accelerationInput = 0;
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.up:
                this.accelerationInput = 1;
                break;
            case cc.macro.KEY.down:
                this.accelerationInput = -1;
                break;
            case cc.macro.KEY.left:
                this.steeringInput = 1;
                break;
            case cc.macro.KEY.right:
                this.steeringInput = -1;
                break;
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.up:
            case cc.macro.KEY.down:
                this.accelerationInput = 0;
                break;
            case cc.macro.KEY.left:
            case cc.macro.KEY.right:
                this.steeringInput = 0;
                break;
        }
    }

    onDisable() {
        if (cc.sys.isMobile) {
            instance.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            instance.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            instance.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        }
    }
}