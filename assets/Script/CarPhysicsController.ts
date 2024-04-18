const { ccclass, property } = cc._decorator;

@ccclass
export default class CarController extends cc.Component {

    speed: number = 150;
    rotationSpeed: number = 10;

    private driftFactor = 1;

    private moveInput: number = 0;
    private rotateInput: number = 0;
    private body: cc.RigidBody = null;
    private magnitude = 50;

    onLoad() {
        this.body = this.node.getComponent(cc.RigidBody);
        cc.director.getPhysicsManager().enabled = true;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.schedule(this.fixedUpdate, 60 / 1000);

    }

    onDisable() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.up:
                this.moveInput = 1;
                break;
            case cc.macro.KEY.down:
                this.moveInput = -1;
                break;
            case cc.macro.KEY.left:
                this.rotateInput = 1;
                break;
            case cc.macro.KEY.right:
                this.rotateInput = -1;
                break;
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.up:
            case cc.macro.KEY.down:
                this.moveInput = 0;
                break;
            case cc.macro.KEY.left:
            case cc.macro.KEY.right:
                this.rotateInput = 0;
                break;
        }
    }

    // update(dt: number) {
    //     let body = this.node.getComponent(cc.RigidBody);

    //     // Apply rotation
    //     let rotation = this.node.rotation + this.rotateInput * this.rotationSpeed;
    //     this.node.rotation = rotation;

    //     // Convert rotation to radians
    //     let radian = -cc.misc.degreesToRadians(rotation);

    //     // Calculate movement direction
    //     let direction = cc.v2(Math.cos(radian), Math.sin(radian));

    //     // Apply force to move the car
    //     body.applyForceToCenter(direction.mul(this.speed * this.moveInput), true);

    //     // this.killOthogonalVelocity();
    // }

    fixedUpdate(dt: number) {
        // Calculate rotation based on the input

        let minSpeedAllowed = this.body.linearVelocity.mag() / this.magnitude;
        minSpeedAllowed = cc.misc.clamp01(minSpeedAllowed);

        let rotation = this.node.angle + this.rotateInput * this.rotationSpeed * minSpeedAllowed;

        // Convert rotation to radians
        let radian = cc.misc.degreesToRadians(rotation);

        // Calculate forward and right vectors based on the car's rotation
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        let right = cc.v2(-forward.y, forward.x);

        // Calculate velocity components in the forward and right directions
        let forwardVelocity = forward.mul(this.speed * this.moveInput);
        let rightVelocity = right.mul(this.speed * this.rotateInput * 0.5);

        // Calculate final velocity by combining forward and right velocities
        let finalVelocity = forwardVelocity.add(rightVelocity.mul(this.driftFactor));

        // Set the velocity of the rigid body
        this.body.applyForceToCenter(finalVelocity, true);

        // Update the rotation of the car
        this.node.angle = rotation;
    }
}