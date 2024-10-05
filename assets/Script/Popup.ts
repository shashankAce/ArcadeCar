// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class Popup extends cc.Component {

    isActive = false;
    isFading = false;

    finalScale = 0.7;
    tweenTime = 0.25;

    show() {
        if (this.isActive)
            return;
        if (this.isFading)
            return;
        this.node.active = true;
        this.node.opacity = 0;
        this.node.scale = this.finalScale;

        this.isFading = true;

        cc.tween(this.node)
            .to(this.tweenTime, { opacity: 255, scale: 1 })
            .call(() => {
                this.isFading = false;
            })
            .start();
    }

    onClose() {
        if (this.isFading)
            return;
        this.isFading = true;
        cc.tween(this.node)
            .to(this.tweenTime, { opacity: 0, scale: this.finalScale })
            .call(() => {
                this.node.active = false;
                this.isFading = false;
            })
            .start();
    }
}
