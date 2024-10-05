
const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraControl extends cc.Component {

    @property(cc.Node)
    car: cc.Node = null;

    @property(cc.Node)
    followNodes: cc.Node[] = [];

    protected onLoad(): void {
        let targetPos = this.car.getPosition();
        targetPos.x = cc.misc.clampf(targetPos.x, -cc.winSize.width / 2, cc.winSize.width / 2);
        targetPos.y = cc.misc.clampf(targetPos.y, -cc.winSize.height / 2, cc.winSize.height / 2);
        this.node.setPosition(targetPos);
    }

    lateUpdate(dt) {
        this.follow(dt);
    }

    follow(dt) {
        let targetPos = this.car.getPosition();
        targetPos.x = cc.misc.clampf(targetPos.x, -cc.winSize.width / 2, cc.winSize.width / 2);
        targetPos.y = cc.misc.clampf(targetPos.y, -cc.winSize.height / 2, cc.winSize.height / 2);

        let currentPos = this.node.getPosition();
        currentPos.lerp(targetPos, 0.2, currentPos);
        this.node.setPosition(currentPos);

        this.followNodes.forEach(node=>{
            node.setPosition(currentPos);
        })
    }
}
