// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class CarPhysics extends cc.Component {


    public accelerationFactor = 100;
    public turnFactor = 200;    // turn speed

    private magnitude = 100;    // turn / speed magnitude
    private driftFactor = 1;   // specify drift value
    // private maxSpeed = 100;     // max speed
    private maxForceMagnitude = 100;

    private moveInput: number = 0;
    private rotateInput: number = 0;
    private accelerationInput = 0;
    private steeringInput = 0;
    private rotationAngle = 0;

    private body: cc.RigidBody = null;

    public forwardVelocity = cc.v2()
    public rightVelocity = cc.v2();
    private isbraking: boolean = false;


    onLoad() {
        this.body = this.node.getComponent(cc.RigidBody);
        cc.director.getPhysicsManager().enabled = true;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);


        cc.view.enableAutoFullScreen(true);

        console.log(this.checkPan(191));

    }

    checkPan(num) {

        let value = 0;
        let original = num;
        while (num) {
            let rem = num % 10;
            value = value * 10 + rem;
            num = Math.floor(num / 10)
        }
        return value == original;
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

    update(dt: number) {
        this.forwardVelocity = this.calculateForce();
        this.rightVelocity = this.calculateSteerForce();

        this.applyForce(dt);
        this.killOtrthogonalVelocity();
        this.applySteering(dt);
    }

    setInputVector() {
        this.accelerationInput = this.moveInput;
        this.steeringInput = this.rotateInput;
        if (this.accelerationInput < 0) {
            this.steeringInput = -this.rotateInput;
        }
    }

    applyForce(dt) {

        // linear damping
        if (this.accelerationInput == 0) {
            this.body.linearDamping = cc.misc.lerp(this.body.linearDamping, 3, dt * 3);
        } else
            this.body.linearDamping = 0;



        const limitedForce = this.limitForceMagnitude(this.forwardVelocity.multiplyScalar(this.forwardVelocity.mag()), this.maxForceMagnitude);

        // max speed control
        // const forwardVelocity = this.forwardVelocity.mag();
        // if (forwardVelocity > this.maxSpeed && this.accelerationInput > 0) {//forward direction
        //     return;
        // }
        // if (forwardVelocity > this.maxSpeed * 0.5 && this.accelerationInput < 0) { //backward direction
        //     return;
        // }

        // const angularV = this.rightVelocity.mag();
        // if (angularV > this.maxSpeed && this.accelerationInput > 0) {//forward direction
        //     return;
        // }
        // if (angularV > this.maxSpeed * 0.5 && this.accelerationInput < 0) { //backward direction
        //     return;
        // }

        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        // Calculate movement direction
        let direction = cc.v2(Math.cos(radian), Math.sin(radian));
        let force = direction.mul(this.accelerationInput * this.accelerationFactor);

        // Apply force to move the car
        this.body.applyForceToCenter(force, true);
    }

    limitForceMagnitude(force: cc.Vec2, maxMagnitude: number): cc.Vec2 {
        const currentMagnitude = force.mag();
        if (currentMagnitude > maxMagnitude) {
            return force.normalize().multiplyScalar(maxMagnitude);
        }
        return force;
    }

    applySteering(dt) {
        let minSpeedAllowed = this.body.linearVelocity.mag() / this.magnitude;
        minSpeedAllowed = cc.misc.clamp01(minSpeedAllowed);

        this.rotationAngle -= this.steeringInput * this.turnFactor * minSpeedAllowed * dt;
        const rotationRadians = this.rotationAngle * Math.PI / 180;
        let degree = -cc.misc.radiansToDegrees(rotationRadians);
        this.node.angle = degree;
    }

    killOtrthogonalVelocity() {
        // Calculate the new velocity and set it to the rigid this.body
        let driftForce = this.rightVelocity.mul(this.driftFactor);
        const newVelocity = this.forwardVelocity.add(driftForce);
        this.body.linearVelocity = newVelocity;
    }

    isTireScreeching() {
        this.isbraking = false;

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