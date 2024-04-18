const { ccclass, property } = cc._decorator;

@ccclass
export default class CarPhysics extends cc.Component {

    @property
    public accelerationFactor = 100;
    @property
    public turnFactor = 300;    // turn speed
    @property
    public driftMagnitude = 0;   // specify drift value
    @property
    private maxSpeed = 100;     // max speed
    private magnitude = 100;    // turn / speed magnitude

    private moveInput: number = 0;
    private rotateInput: number = 0;
    private accelerationInput = 0;
    private steeringInput = 0;
    private rotationAngle = 0;

    private body: cc.RigidBody = null;

    public forwardVelocity = cc.v2()
    public rightVelocity = cc.v2();


    onLoad() {
        this.body = this.node.getComponent(cc.RigidBody);
        cc.director.getPhysicsManager().enabled = true;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        cc.view.enableAutoFullScreen(true);
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

    setInputVector() {
        this.accelerationInput = this.moveInput;
        this.steeringInput = this.rotateInput;
        if (this.accelerationInput < 0) {
            this.steeringInput = -this.rotateInput;
        }
    }

    update(dt: number) {
        this.forwardVelocity = this.calculateForce();
        this.rightVelocity = this.calculateSteerForce();

        this.applyForce(dt);
        this.applySteering(dt);
        this.killOrthogonalVelocity();
        this.limitCarSpeed();
    }

    applyForce(dt) {

        // linear damping
        if (this.accelerationInput == 0) {
            this.body.linearDamping = cc.misc.lerp(this.body.linearDamping, 3, dt * 3);
        } else
            this.body.linearDamping = 0;

        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        // Calculate movement direction
        let direction = cc.v2(Math.cos(radian), Math.sin(radian));
        let force = direction.mul(this.accelerationInput * this.accelerationFactor);

        // Apply force to move the car
        this.body.applyForceToCenter(force, true);
    }

    applySteering(dt) {
        let minSpeedAllowed = this.body.linearVelocity.mag() / this.magnitude;
        minSpeedAllowed = cc.misc.clamp01(minSpeedAllowed);

        this.rotationAngle -= this.steeringInput * this.turnFactor * minSpeedAllowed * dt;
        const rotationRadians = this.rotationAngle * Math.PI / 180;
        let degree = -cc.misc.radiansToDegrees(rotationRadians);
        this.node.angle = degree;
    }

    limitCarSpeed() {
        const currentVelocity = this.body.linearVelocity;
        const currentSpeed = currentVelocity.mag();
        if (currentSpeed > this.maxSpeed) {
            const limitedVelocity = currentVelocity.normalize().multiplyScalar(this.maxSpeed);
            this.body.linearVelocity = limitedVelocity;
        }
    }

    killOrthogonalVelocity() {
        // let driftForce = this.rightVelocity.mul(this.driftFactor);
        // const newVelocity = this.forwardVelocity.add(driftForce);
        // this.body.linearVelocity = newVelocity;

        let driftForceMagnitude = this.rightVelocity.mag() * this.driftMagnitude;
        let driftForce = this.rightVelocity.normalize().multiplyScalar(driftForceMagnitude);
        const newVelocity = this.forwardVelocity.add(driftForce);
        this.body.linearVelocity = newVelocity;
    }

    isTireScreeching() {

        let fv = this.calcForwardVelocity();
        if (this.accelerationInput < 0 && fv > 10) {
            return true;
        }

        if (this.rightVelocity.mag() > 20.0) {
            return true;
        }

        return false;

    }

    private calcForwardVelocity() {
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return cc.Vec2.dot(this.body.linearVelocity, forward);
    }

    private calculateForce(): cc.Vec2 {
        // Assuming forward direction is along the y-axis in Cocos Creator
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return forward.multiplyScalar(cc.Vec2.dot(this.body.linearVelocity, forward));
    }

    private calculateSteerForce(): cc.Vec2 {
        // Assuming right direction is along the x-axis in Cocos Creator
        // Assuming forward direction is along the y-axis in Cocos Creator
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        let right = cc.v2(-forward.y, forward.x);
        return right.multiplyScalar(cc.Vec2.dot(this.body.linearVelocity, right));
    }
}