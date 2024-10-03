const { ccclass, property } = cc._decorator;

@ccclass
export default class Controller extends cc.Component {

    public accelerationFactor = 200;
    public driftMagnitude = 0; //specify drift value (0 = no drift, 1 = full drift)

    private maxSpeed = 300; // max speed
    public turnFactor = 200; // turn speed
    public frictionFactor = 1; //(0 = no, 1 = full) Adjust this value to control grip

    private moveInput: number = 0;
    private rotateInput: number = 0;

    private accelerationInput = 0;
    private steeringInput = 0;

    private rigidBody: cc.RigidBody = null;
    private rotationAngle: number = 0;

    public rightVelocity = cc.v2();

    protected onLoad(): void {
        this.rigidBody = this.node.getComponent(cc.RigidBody);
        this.resetPhysics();

        cc.director.getPhysicsManager().enabled = true;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    resetPhysics() {
        this.rigidBody.angularDamping = 0;
        this.rigidBody.linearDamping = 0;
        this.rigidBody.linearVelocity = cc.v2();
        this.rigidBody.angularVelocity = 0;
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
        this.setInputVector();
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
        return cc.Vec2.dot(this.rigidBody.linearVelocity, forward);
    }

    setInputVector() {
        this.accelerationInput = this.moveInput;
        this.steeringInput = this.rotateInput;
    }

    protected lateUpdate(dt: number): void {
        this.rightVelocity = this.getRightVelocity();

        this.applyForce(dt);
        this.applySteering(dt);
        // this.killOrthogonalVelocity();
        this.limitCarSpeed();

        // Adjust friction based on current conditions
        this.adjustFriction();
    }

    adjustFriction() {
        // Example: Adjust friction based on drift value
        if (this.driftMagnitude > 0) {
            // Example: Reduce friction during drifting
            this.rigidBody.linearDamping = this.frictionFactor * (1 - this.driftMagnitude);
        } else {
            // Restore default friction when not drifting
            this.rigidBody.linearDamping = this.frictionFactor;
        }
    }

    // adjustFriction() {
    //     const speed = this.rigidBody.linearVelocity.mag();
    //     // Friction factor decreases with speed (1 = full grip, 0 = full drift)
    //     let frictionMultiplier = cc.misc.clampf(1 - (speed / this.maxSpeed), 0, 1); // Min: 0 (full drift), Max: 1 (full grip)
    //     // Ensure linearDamping is not set to 0
    //     const minDamping = 1;  // Minimum damping value to ensure the car can slow down
    //     // Calculate linear damping based on friction factor and multiplier, ensure it doesn't fall below minDamping
    //     let damping = Math.max(this.frictionFactor * frictionMultiplier, this.frictionFactor);
    //     this.rigidBody.linearDamping = damping;
    //     // Adjust the sideways drift directly based on the frictionMultiplier
    //     this.orthogonalVelocity(frictionMultiplier);
    // }


    // orthogonalVelocity(frictionMultiplier: number) {
    //     let forwardDirection = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));
    //     let rightDirection = cc.v2(-forwardDirection.y, forwardDirection.x); // Right vector orthogonal to forward

    //     // Calculate the right velocity (drift)
    //     let rightVelocity = rightDirection.mul(cc.Vec2.dot(this.rigidBody.linearVelocity, rightDirection));

    //     // Kill the sideways velocity based on the frictionMultiplier (1 = no drift, 0 = full drift)
    //     let driftReduction = rightVelocity.mul(frictionMultiplier);
    //     let newVelocity = this.rigidBody.linearVelocity.sub(rightVelocity).add(driftReduction);

    //     // Apply the new velocity back to the rigid body
    //     this.rigidBody.linearVelocity = newVelocity;
    // }


    applyForce(dt: number) {
        // Apply force in the car's forward direction based on input
        let radian = cc.misc.degreesToRadians(this.node.angle);
        let forwardDirection = cc.v2(Math.cos(radian), Math.sin(radian));
        let force = forwardDirection.mul(this.accelerationInput * this.accelerationFactor);

        // Apply force to move the car
        this.rigidBody.applyForceToCenter(force, true);
    }


    // applySteering(dt) {
    //     let minSpeedAllowed = this.rigidBody.linearVelocity.mag() / this.turnFactor;
    //     minSpeedAllowed = cc.misc.clamp01(minSpeedAllowed);

    //     let forwardDirection = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));
    //     let dotProduct = this.rigidBody.linearVelocity.dot(forwardDirection);
    //     let isMovingForward = dotProduct > 0; // True if moving forward
    //     let dir = isMovingForward ? this.steeringInput : -this.steeringInput;

    //     this.rotationAngle -= dir * this.turnFactor * minSpeedAllowed * dt;
    //     const rotationRadians = this.rotationAngle * Math.PI / 180;
    //     let degree = -cc.misc.radiansToDegrees(rotationRadians);
    //     this.node.angle = degree;
    // }

    applySteering(dt: number) {
        let velocityMag = this.rigidBody.linearVelocity.mag(); // Get the car's current speed
        let speedFactor = cc.misc.clampf(velocityMag / this.maxSpeed, 0, 1); // Adjust the lower limit as needed (e.g., 0.3)

        let forwardDirection = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));
        let dotProduct = this.rigidBody.linearVelocity.dot(forwardDirection);
        let isMovingForward = dotProduct > 0;
        let steeringDir = isMovingForward ? -this.steeringInput : this.steeringInput;

        this.rotationAngle -= steeringDir * this.turnFactor * speedFactor * dt;
        const rotationRadians = cc.misc.degreesToRadians(this.rotationAngle);
        this.node.angle = cc.misc.radiansToDegrees(rotationRadians);
    }

    limitCarSpeed() {
        const currentVelocity = this.rigidBody.linearVelocity;
        const currentSpeed = currentVelocity.mag();

        if (currentSpeed > this.maxSpeed) {
            const limitedVelocity = currentVelocity.normalize().mul(this.maxSpeed);
            this.rigidBody.linearVelocity = limitedVelocity;
        }
    }

    killOrthogonalVelocity() {
        let forwardVelocity = this.getForwardVelocity();
        let rightVelocity = this.getRightVelocity();

        // Apply drift factor to lateral movement
        let newVelocity = forwardVelocity.add(rightVelocity.mul(this.driftMagnitude));
        // let newVelocity = forwardVelocity.add(rightVelocity.mul(this.frictionFactor));
        this.rigidBody.linearVelocity = newVelocity;
    }

    getForwardVelocity(): cc.Vec2 {
        let radian = cc.misc.degreesToRadians(this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return forward.mul(cc.Vec2.dot(this.rigidBody.linearVelocity, forward));
    }

    getRightVelocity(): cc.Vec2 {
        let radian = cc.misc.degreesToRadians(this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        let right = cc.v2(-forward.y, forward.x);
        return right.mul(cc.Vec2.dot(this.rigidBody.linearVelocity, right));
    }

    private calculateSteerForce(): cc.Vec2 {
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        let right = cc.v2(-forward.y, forward.x);
        return right.multiplyScalar(cc.Vec2.dot(this.rigidBody.linearVelocity, right));
    }
}