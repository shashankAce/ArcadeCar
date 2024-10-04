const { ccclass, property } = cc._decorator;

@ccclass
export default class Controller extends cc.Component {

    public accelerationFactor = 50;
    public driftMagnitude = .9; //specify drift value (0 = no drift, 1 = full drift)

    private maxSpeed = 200; // max speed
    public turnFactor = 200; // turn speed
    public frictionFactor = 1; //(0 = no, 1 = full) Adjust this value to control grip

    private moveInput: number = 0;
    private rotateInput: number = 0;

    private accelerationInput = 0;
    private steeringInput = 0;

    private body: cc.RigidBody = null;
    private rotationAngle: number = 0;

    public forwardVelocity = cc.v2()
    public rightVelocity = cc.v2();

    protected onLoad(): void {
        this.body = this.node.getComponent(cc.RigidBody);
        this.resetPhysics();

        cc.director.getPhysicsManager().enabled = true;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    resetPhysics() {
        this.body.angularDamping = 0;
        this.body.linearDamping = 0;
        this.body.linearVelocity = cc.v2();
        this.body.angularVelocity = 0;
    }

    onDisable() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.w:
                this.moveInput = 1;
                break;
            case cc.macro.KEY.s:
                this.moveInput = -1;
                break;
            case cc.macro.KEY.a:
                this.rotateInput = 1;
                break;
            case cc.macro.KEY.d:
                this.rotateInput = -1;
                break;
        }
        this.setInputVector();
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.w:
            case cc.macro.KEY.s:
                this.moveInput = 0;
                break;
            case cc.macro.KEY.a:
            case cc.macro.KEY.d:
                this.rotateInput = 0;
                break;
        }
        this.setInputVector();
    }

    isTireScreeching() {
        let fv = this.calcForwardVelocity();
        if (this.accelerationInput > 0 && fv < this.accelerationFactor / 2) {
            return true;
        }
        if (this.accelerationInput < 0 && fv > 10) {
            return true;
        }
        let rightMag = this.rightVelocity.mag();
        if (rightMag > ((/* this.driftMagnitude + */ this.frictionFactor) * 10)) {
            return true;
        }
        return false;
    }

    private calcForwardVelocity() {
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return cc.Vec2.dot(this.body.linearVelocity, forward);
    }

    setInputVector() {
        this.accelerationInput = this.moveInput;
        this.steeringInput = this.rotateInput;
    }

    protected lateUpdate(dt: number): void {

        this.applyForce(dt);
        this.applySteering(dt);

        this.forwardVelocity = this.getForwardVelocity();
        this.rightVelocity = this.getRightVelocity();

        this.killOrthogonalVelocity();
        this.limitCarSpeed();
    }

    adjustFriction() {
        // Example: Adjust friction based on drift value
        if (this.driftMagnitude > 0) {
            // Example: Reduce friction during drifting
            this.body.linearDamping = this.frictionFactor * (1 - this.driftMagnitude);
        } else {
            // Restore default friction when not drifting
            this.body.linearDamping = this.frictionFactor;
        }
    }

    applyForce(dt: number) {
        // Apply force in the car's forward direction based on input

        if (this.accelerationInput == 0) {
            this.body.linearDamping = this.frictionFactor * (1 - this.driftMagnitude);
        } else {
            this.body.linearDamping = 0;
        }
        let radian = cc.misc.degreesToRadians(this.node.angle);
        let forwardDirection = cc.v2(Math.cos(radian), Math.sin(radian));
        let force = forwardDirection.mul(this.accelerationInput * this.accelerationFactor);

        // Apply force to move the car
        this.body.applyForceToCenter(force, true);
    }

    applySteering(dt: number) {
        let velocityMag = this.body.linearVelocity.mag(); // Get the car's current speed
        let speedFactor = cc.misc.clampf(velocityMag / this.maxSpeed, 0, 1); // Adjust the lower limit as needed (e.g., 0.3)

        let forwardDirection = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));
        let dotProduct = this.body.linearVelocity.dot(forwardDirection);
        let isMovingForward = dotProduct > 0;
        let steeringDir = isMovingForward ? -this.steeringInput : this.steeringInput;

        this.rotationAngle -= steeringDir * this.turnFactor * speedFactor * dt;
        const rotationRadians = cc.misc.degreesToRadians(this.rotationAngle);
        this.node.angle = cc.misc.radiansToDegrees(rotationRadians);
    }

    limitCarSpeed() {
        const currentVelocity = this.body.linearVelocity;
        const currentSpeed = currentVelocity.mag();

        if (currentSpeed > this.maxSpeed) {
            const limitedVelocity = currentVelocity.normalize().mul(this.maxSpeed);
            this.body.linearVelocity = limitedVelocity;
        }
    }

    // killOrthogonalVelocity() {
    //     let forwardVelocity = this.getForwardVelocity();
    //     let rightVelocity = this.getRightVelocity();

    //     // Apply drift factor to lateral movement
    //     let newVelocity = forwardVelocity.add(rightVelocity.mul(this.driftMagnitude));
    //     // let newVelocity = forwardVelocity.add(rightVelocity.mul(this.frictionFactor));
    //     this.body.linearVelocity = newVelocity;
    // }

    killOrthogonalVelocity() {
        let mag = this.rightVelocity.mag();
        let normal = this.rightVelocity.normalize();

        let driftForceMagnitude = mag * this.driftMagnitude;
        let driftForce = normal.mul(driftForceMagnitude);

        const newVelocity = this.forwardVelocity.add(driftForce);
        this.body.linearVelocity = newVelocity;
    }

    getForwardVelocity(): cc.Vec2 {
        let radian = cc.misc.degreesToRadians(this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return forward.mul(cc.Vec2.dot(this.body.linearVelocity, forward));
    }

    getRightVelocity(): cc.Vec2 {
        let radian = cc.misc.degreesToRadians(this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        let right = cc.v2(-forward.y, forward.x);
        return right.mul(cc.Vec2.dot(this.body.linearVelocity, right));
    }
}