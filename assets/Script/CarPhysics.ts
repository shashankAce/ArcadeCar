import CarInput from "./CarInput";
import { clientEvent } from "./EventMechanism/ClientEvent";
import { EventName } from "./EventMechanism/EventNames";
import { SIGNAL } from "./GameController";
import { PopupId } from "./PopupManager";

const { ccclass, property } = cc._decorator;

enum Surface {
    NONE,
    SAND,
    GRASS,
    OIL
}

@ccclass
export default class CarPhysics extends CarInput {

    protected rotationAngle = 0;

    protected accelerationFactor = 200;
    protected turnFactor = 8;    // turn speed
    protected driftMagnitude = 0.9;   // specify drift value
    protected maxSpeed = 300;     // max speed

    protected accelerationInput: number = 0;
    protected steeringInput: number = 0;
    protected friction = 3;

    protected body: cc.RigidBody = null;

    protected forwardVelocity = cc.v2()
    protected rightVelocity = cc.v2();

    protected surface = Surface.NONE;
    protected signal = SIGNAL.RED;

    onLoad() {
        super.onLoad();
        this.body = this.node.getComponent(cc.RigidBody);
        cc.director.getPhysicsManager().enabled = true;
        cc.view.enableAutoFullScreen(true);

        clientEvent.on(EventName.OnGameStart, () => {
            this.signal = SIGNAL.GREEN;
        });

        let frameRate = 61;
        cc.game.setFrameRate(frameRate);
        // this.schedule(this.carUpdate.bind(this), 1 / frameRate);

    }

    protected lateUpdate(dt: number): void {
        this.carUpdate(dt);
    }

    carUpdate(dt) {
        if (this.signal == SIGNAL.RED)
            return;
        this.applyForce(dt);
        this.applySteering(dt);
        this.forwardVelocity = this.calculateForce();
        this.rightVelocity = this.calculateSteerForce();
        this.killOrthogonalVelocity();
        this.limitCarSpeed();
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // cc.log("Begin Contact with:", otherCollider.node.name);
        // return;
        switch (otherCollider.node.name) {
            case 'Intro':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.INTRO, true);
                break;
            case 'Education':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.EDUCATION, true);
                break;
            case 'Experience':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.EXPERIENCE, true);
                break;
            case 'Projects':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.PROJECTS, true);
                break;
            case 'Skills':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.SKILLS, true);
                break;
            default:
                break;
        }

        /* switch (otherCollider.node.name) {
            case 'oil':
                this.surface = Surface.OIL;
                break;
            case 'sand':
                this.surface = Surface.OIL;
                break;
            case 'grass':
                this.surface = Surface.OIL;
                break;
            default:
                break;
        } */
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // cc.log("End Contact with:", otherCollider.node.name);
        switch (otherCollider.node.name) {
            case 'Intro':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.INTRO, false);
                break;
            case 'Education':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.EDUCATION, false);
                break;
            case 'Experience':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.EXPERIENCE, false);
                break;
            case 'Projects':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.PROJECTS, false);
                break;
            case 'Skills':
                clientEvent.dispatchEvent(EventName.OnShowPopup, PopupId.SKILLS, false);
                break;
            default:
                break;
        }
        this.surface = Surface.NONE;
    }

    applyForce(dt) {
        // linear damping
        if (this.accelerationInput == 0) {
            // this.body.linearDamping = this.friction * (1 - this.driftMagnitude);
            this.body.linearDamping = this.friction;
        } else {
            this.body.linearDamping = 0;
        }
        // switch (this.surface) {
        //     case Surface.OIL:
        //         this.body.linearDamping = 0;
        //         break;
        //     case Surface.SAND:
        //         this.body.linearDamping = this.friction * 1.5 * (1 - this.driftMagnitude);
        //         break;
        //     case Surface.GRASS:
        //         this.body.linearDamping = this.friction * 0.8 * (1 - this.driftMagnitude);
        //         break;

        //     default:
        //         break;
        // }

        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let direction = cc.v2(Math.cos(radian), Math.sin(radian));
        let force = direction.mul(this.accelerationInput * this.accelerationFactor);
        this.body.applyForceToCenter(force, true);
    }

    applySteering(dt: number) {
        let velocityMag = this.body.linearVelocity.mag(); // Get the car's current speed
        let speedFactor = cc.misc.clampf(velocityMag / this.maxSpeed, 0, 1); // Adjust the lower limit as needed (e.g., 0.3)

        let forwardDirection = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));
        let dotProduct = this.body.linearVelocity.dot(forwardDirection);
        let isMovingForward = dotProduct > 0;
        let steeringDir = isMovingForward ? -this.steeringInput : this.steeringInput;

        this.rotationAngle -= steeringDir * this.turnFactor * speedFactor;
        const rotationRadians = cc.misc.degreesToRadians(this.rotationAngle);
        this.node.angle = cc.misc.radiansToDegrees(rotationRadians);
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
        let mag = this.rightVelocity.mag();
        let normal = this.rightVelocity.normalize();

        let driftForceMagnitude = mag * this.driftMagnitude;
        let driftForce = normal.mul(driftForceMagnitude);

        const newVelocity = this.forwardVelocity.add(driftForce);
        this.body.linearVelocity = newVelocity;
    }

    isTireScreeching() {

        let fv = this.calcForwardVelocity();
        if (this.accelerationInput > 0 && fv < this.accelerationFactor) {
            return true;
        }
        if (this.accelerationInput < 0 && fv > 10) {
            return true;
        }
        if (this.rightVelocity.mag() > 20.0) {
            return true;
        }
        return false;
    }

    protected calcForwardVelocity() {
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return cc.Vec2.dot(this.body.linearVelocity, forward);
    }

    protected calculateForce(): cc.Vec2 {
        // Assuming forward direction is along the y-axis in Cocos Creator
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return forward.multiplyScalar(cc.Vec2.dot(this.body.linearVelocity, forward));
    }

    protected calculateSteerForce(): cc.Vec2 {
        // Assuming right direction is along the x-axis in Cocos Creator
        // Assuming forward direction is along the y-axis in Cocos Creator
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        let right = cc.v2(-forward.y, forward.x);
        return right.multiplyScalar(cc.Vec2.dot(this.body.linearVelocity, right));
    }
}