import CarPhysics from "./CarPhysics";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TrailGraphics extends cc.Component {

    @property(cc.Graphics)
    graphics: cc.Graphics = null;  // Reference to the Graphics component

    @property(CarPhysics)
    car: CarPhysics = null;

    private previousPositions: cc.Vec2[] = [];
    private maxTrailLength: number = 500;  // Max number of trail points to store
    private trailWidth: number = 5;  // Width of the trail

    private skidMarkInterval = 5; // Interval between spawning skid marks
    private lastSkidMarkTime = 0;
    private fadingDuration: number = 1;

    update(dt: number) {
        if (this.car.isTireScreeching()) {

            // Spawn skid marks at a regular interval
            if (Date.now() - this.lastSkidMarkTime > this.skidMarkInterval) {

                let node_pos = this.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
                let position = this.car.node.parent.convertToNodeSpaceAR(node_pos);
                this.addPositionToTrail(cc.v2(position.x, position.y));
                this.drawTrailWithFade();

                this.lastSkidMarkTime = Date.now();
            }
        }
    }

    addPositionToTrail(position: cc.Vec2) {
        // Add the new position to the list of previous positions
        this.previousPositions.push(position);

        // Limit the number of positions to keep (this creates a fading effect)
        if (this.previousPositions.length > this.maxTrailLength) {
            this.previousPositions.shift();  // Remove the oldest point
        }
    }

    drawTrail() {
        // Clear previous drawing
        this.graphics.clear();

        // Begin drawing the trail
        this.graphics.lineWidth = this.trailWidth;
        this.graphics.strokeColor = cc.Color.WHITE;  // You can change this to any color

        // Move to the first point in the trail
        if (this.previousPositions.length > 0) {
            this.graphics.moveTo(this.previousPositions[0].x, this.previousPositions[0].y);
        }

        // Draw a line through each point in the trail
        for (let i = 1; i < this.previousPositions.length; i++) {
            this.graphics.lineTo(this.previousPositions[i].x, this.previousPositions[i].y);
        }

        // Apply the stroke to render the trail
        this.graphics.stroke();
    }

    drawTrailWithFade() {
        // Clear previous drawing
        this.graphics.clear();

        // Loop through each point in the trail
        for (let i = 1; i < this.previousPositions.length; i++) {
            // Calculate how transparent this segment should be
            let fadeFactor = i / this.previousPositions.length;  // Gradual fade from 0 to 1

            // Adjust the stroke color's opacity for each segment (0-255 scale)
            let alpha = Math.floor(255 * fadeFactor);  // Convert to 0-255 for opacity
            let fadeColor = new cc.Color(255, 255, 255, alpha);  // White color with varying opacity

            // Set line width and stroke color for each segment
            // this.graphics.lineWidth = this.trailWidth * fadeFactor;  // Make the trail thinner as it fades
            this.graphics.lineWidth = this.trailWidth;
            this.graphics.strokeColor = fadeColor;

            // Move to the previous position and draw to the current one
            this.graphics.moveTo(this.previousPositions[i - 1].x, this.previousPositions[i - 1].y);
            this.graphics.lineTo(this.previousPositions[i].x, this.previousPositions[i].y);

            // Draw the segment
            this.graphics.stroke();
        }
    }
}
