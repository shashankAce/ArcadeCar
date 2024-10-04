import CarPhysics from "./CarPhysics";
import Controller from "./Controller";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TrailEffect extends cc.Component {

    @property(cc.Prefab)
    public skidMarkPrefab: cc.Prefab = null;

    @property(cc.Node)
    skidLayer: cc.Node = null;

    @property(CarPhysics)
    car: CarPhysics = null;

    private skidMarkInterval = 5; // Interval between spawning skid marks
    private lastSkidMarkTime = 0;
    private fadingDuration: number = 1;
    private trailArray = [];

    start() {
        this.trailArray = [];
        this.lastSkidMarkTime = 0;
    }

    update(dt) {
        // Check if the car is skidding (e.g., by checking input or wheel traction)
        if (this.car.isTireScreeching()) {
            // Spawn skid marks at a regular interval
            if (Date.now() - this.lastSkidMarkTime > this.skidMarkInterval) {
                this.manageSkidMark();
                this.lastSkidMarkTime = Date.now();
            }
        } else {
            this.removeAllSkids();
        }
    }

    removeAllSkids() {
        // Fade out all active skid marks
        this.trailArray.forEach(skidMark => {
            skidMark.runAction(cc.sequence(
                cc.fadeOut(this.fadingDuration),
                cc.callFunc(() => {
                    skidMark.destroy(); // Destroy skid mark after fading out
                })
            ));
        });
        this.trailArray = [];
    }

    manageSkidMark() {

        let node = this.createSkidMark();
        this.trailArray.push(node);

        if (this.trailArray.length > 100) {
            let extra = this.trailArray.splice(0, 100);
            extra.forEach(skidMark => {
                skidMark.runAction(cc.sequence(
                    cc.fadeOut(this.fadingDuration),
                    cc.callFunc(() => {
                        skidMark.destroy(); // Destroy skid mark after fading out
                    })
                ));
            });
        }
    }

    createSkidMark() {
        let node = cc.instantiate(this.skidMarkPrefab);

        let node_pos = this.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let pos = this.car.node.parent.convertToNodeSpaceAR(node_pos);
        node.setPosition(pos);
        node.angle = this.car.node.angle;

        this.skidLayer.addChild(node);
        return node;
    }
}