const { ccclass, property } = cc._decorator;

@ccclass
export default class CarController extends cc.Component {
    @property
    speed: number = 0;

    @property
    rotationSpeed: number = 0;

    private moveInput: number = 0;
    private rotateInput: number = 0;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
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
                this.rotateInput = -1;
                break;
            case cc.macro.KEY.right:
                this.rotateInput = 1;
                break;
        }
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
    }

    update(dt: number) {
        this.node.rotation += this.rotateInput * this.rotationSpeed * dt;

        let radian = -cc.misc.degreesToRadians(this.node.rotation);
        let direction = cc.v3(Math.cos(radian), Math.sin(radian));

        let distance = this.speed * this.moveInput * dt;
        this.node.position = this.node.position.add(direction.mul(distance));
    }
}
