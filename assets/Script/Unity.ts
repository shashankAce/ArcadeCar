const { ccclass, property } = cc._decorator;

@ccclass
export default class Unity extends cc.Component {

    @property
    acceleration: number = 4;

    @property
    maxSpeed: number = 10;

    @property
    turnFactor: number = 2;

    @property
    driftFactor: number = 0.95;

    private carRigidBody: cc.RigidBody = null;
    private accelerationInput: number = 0;
    private steeringInput: number = 0;
    private rotationAngle: number = 0;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        this.carRigidBody = this.getComponent(cc.RigidBody);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDisable() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
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

    lateUpdate() {
        this.applyEngineForce();
        // this.killLateralVelocity();
        this.applySteering();
    }

    applyEngineForce() {
        if (this.accelerationInput === 0) {
            this.carRigidBody.linearDamping = cc.misc.lerp(this.carRigidBody.linearDamping, 2, 0.1);
        } else {
            this.carRigidBody.linearDamping = 0.1;
        }

        const velocityVsUp = this.carRigidBody.linearVelocity.dot(cc.v2(this.node.up.x, this.node.up.y));

        if (velocityVsUp > this.maxSpeed && this.accelerationInput > 0) {
            return;
        }

        const engineForceVector = this.node.up.mul(this.acceleration * this.accelerationInput);
        this.carRigidBody.applyForceToCenter(cc.v2(engineForceVector.x, engineForceVector.y), true);
    }

    applySteering() {
        this.rotationAngle += this.steeringInput * this.turnFactor;
        this.node.angle = this.rotationAngle;
    }

    killLateralVelocity() {
        // Forward velocity: movement in the direction the car is facing (transform.up equivalent)
        const forwardVelocity = this.node.up.mul(this.carRigidBody.linearVelocity.dot(cc.v2(this.node.up.x, this.node.up.y)));

        // Lateral velocity: movement to the side (transform.right equivalent)
        const rightVec = this.node.right;
        const lateralVelocity = rightVec.mul(this.carRigidBody.linearVelocity.dot(cc.v2(rightVec.x, rightVec.y)));

        // Adjust velocity by removing lateral velocity and applying drift factor
        let veloc = forwardVelocity.add(lateralVelocity.mul(this.driftFactor));
        this.carRigidBody.linearVelocity = cc.v2(veloc.x, veloc.y);
    }

}
