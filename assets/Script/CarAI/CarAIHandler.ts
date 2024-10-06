import { clientEvent } from "../EventMechanism/ClientEvent";
import { EventName } from "../EventMechanism/EventNames";
import { SIGNAL } from "../GameController";

const { ccclass, property } = cc._decorator;

enum Surface {
    NONE,
    OIL,
    SAND,
    GRASS,
}

@ccclass
export default class CarAIHandler extends cc.Component {

    private rotationAngle = 0;

    public accelerationFactor = 50;
    public turnFactor = 300;
    public driftMagnitude = 0.98;
    private maxSpeed = 100;

    private accelerationInput: number = 1;  // AI will always accelerate forward
    private steeringInput: number = 0;
    private friction = 3;

    private body: cc.RigidBody = null;

    public forwardVelocity = cc.v2();
    public rightVelocity = cc.v2();

    private surface = Surface.NONE;

    @property(cc.Node)
    waypointsNode: cc.Node = null;

    waypoints: cc.Node[] = [];  // List of waypoints for the AI car to follow

    private currentWaypointIndex: number = 0;  // The index of the current waypoint

    @property
    waypointThreshold: number = 10;  // Distance to switch to the next waypoint

    @property
    stuckVelocityThreshold: number = 5;  // Threshold velocity to detect if the car is stuck

    @property
    reverseDuration: number = 0.5;  // How long the car should reverse when stuck (in seconds)

    private reversing: boolean = false;
    private reverseTimer: number = 0;

    private waypointsCompleted: boolean = false;  // Flag to check if all waypoints are finished

    @property
    reverseSpeedFactor: number = 0.5;  // Reverse speed limit (half of the forward speed)

    signal = SIGNAL.RED;
    onLoad() {
        this.body = this.node.getComponent(cc.RigidBody);
        this.waypoints = this.waypointsNode.children;

        clientEvent.on(EventName.OnGameStart, () => {
            this.signal = SIGNAL.GREEN;
        })
    }

    update(dt: number) {
        if (this.signal == SIGNAL.RED)
            return;
        if (this.currentWaypointIndex >= this.waypoints.length) {
            this.accelerationInput = 0; // Stop the car if all waypoints are finished
            return;
        }

        const targetWaypoint = this.waypoints[this.currentWaypointIndex];
        const distanceToWaypoint = this.node.position.sub(targetWaypoint.position).mag();

        if (distanceToWaypoint < 5) {  // Adjust this threshold as needed
            this.currentWaypointIndex++; // Move to the next waypoint
            if (this.currentWaypointIndex >= this.waypoints.length) {
                this.accelerationInput = 0; // Stop the car if all waypoints are finished
                return;
            }
        }

        this.applyForce(dt);
        this.applySteering(dt);
        this.forwardVelocity = this.calculateForce();
        this.rightVelocity = this.calculateSteerForce();
        this.killOrthogonalVelocity();
        this.limitCarSpeed();  // Limiting the speed

        this.updateWaypoint();
    }

    // update(dt: number) {
    //     if (this.waypoints.length === 0 || this.waypointsCompleted) {
    //         this.accelerationInput = 0;  // Stop the car if no waypoints or waypoints are completed
    //         return;
    //     }

    //     if (this.reversing) {
    //         this.reverseTimer -= dt;
    //         if (this.reverseTimer <= 0) {
    //             this.reversing = false;  // Stop reversing after timer ends
    //             this.accelerationInput = 1;  // Go forward again
    //         }
    //     } else {
    //         // Check if the car is stuck and should reverse
    //         if (this.body.linearVelocity.mag() < this.stuckVelocityThreshold) {
    //             this.startReversing();
    //         }
    //     }

    //     this.applyForce(dt);
    //     this.applySteering(dt);
    //     this.forwardVelocity = this.calculateForce();
    //     this.rightVelocity = this.calculateSteerForce();
    //     this.killOrthogonalVelocity();
    //     this.limitCarSpeed();  // Limiting the speed

    //     this.updateWaypoint();
    // }

    startReversing() {
        this.reversing = true;
        this.reverseTimer = this.reverseDuration;
        this.accelerationInput = -1;  // Briefly reverse
    }

    updateWaypoint() {
        if (this.reversing) {
            return;  // Skip waypoint logic when reversing
        }

        // Get the current waypoint position
        const currentWaypoint = this.waypoints[this.currentWaypointIndex].position;

        // Calculate the direction vector towards the waypoint
        const direction = currentWaypoint.sub(this.node.position).normalize();

        // Calculate the forward vector of the car
        const forward = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));

        // Dot product to determine how aligned the car is with the waypoint direction
        const dotProduct = forward.dot(cc.v2(direction));
        const crossProduct = forward.cross(cc.v2(direction));

        // Steer the car towards the waypoint
        if (crossProduct > 0) {
            this.steeringInput = 1;  // Turn left
        } else {
            this.steeringInput = -1;  // Turn right
        }

        // Check if AI car is close enough to switch to the next waypoint
        const distanceToWaypoint = this.node.position.sub(currentWaypoint).mag();
        if (distanceToWaypoint < this.waypointThreshold) {
            if (this.currentWaypointIndex < this.waypoints.length - 1) {
                // Switch to the next waypoint
                this.currentWaypointIndex++;
            } else {
                // Stop the car when all waypoints are completed
                this.waypointsCompleted = true;
                this.accelerationInput = 0;
            }
        }

        // Ensure the car only moves forward towards the waypoint
        if (dotProduct < 0) {
            // If the car is facing away from the waypoint, limit backward movement by reducing speed
            this.accelerationInput = 0;
        }
    }

    applyForce(dt) {
        // Apply linear damping and control acceleration input
        if (this.accelerationInput == 0) {
            this.body.linearDamping = this.friction;
        } else {
            this.body.linearDamping = 0;
        }

        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let direction = cc.v2(Math.cos(radian), Math.sin(radian));
        let force = direction.mul(this.accelerationInput * this.accelerationFactor);
        this.body.applyForceToCenter(force, true);
    }

    applySteering(dt: number) {
        let velocityMag = this.body.linearVelocity.mag();
        let speedFactor = cc.misc.clampf(velocityMag / this.maxSpeed, 0, 1);

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

        // Check if the car is reversing
        let forwardDirection = cc.v2(Math.cos(cc.misc.degreesToRadians(this.node.angle)), Math.sin(cc.misc.degreesToRadians(this.node.angle)));
        let dotProduct = this.body.linearVelocity.dot(forwardDirection);
        let isReversing = dotProduct < 0;

        // Set speed limit based on whether the car is moving forward or reversing
        let speedLimit = isReversing ? this.maxSpeed * this.reverseSpeedFactor : this.maxSpeed;

        // Limit the speed
        if (currentSpeed > speedLimit) {
            const limitedVelocity = currentVelocity.normalize().multiplyScalar(speedLimit);
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

    private calculateForce(): cc.Vec2 {
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return forward.multiplyScalar(cc.Vec2.dot(this.body.linearVelocity, forward));
    }

    private calculateSteerForce(): cc.Vec2 {
        let radian = -cc.misc.degreesToRadians(-this.node.angle);
        let forward = cc.v2(Math.cos(radian), Math.sin(radian));
        return forward.multiplyScalar(cc.Vec2.dot(this.body.linearVelocity, forward));
    }
}
