// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { clientEvent } from "./EventMechanism/ClientEvent";
import { EventName } from "./EventMechanism/EventNames";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Start extends cc.Component {

    isActive = false;
    isFading = false;

    tweenTime = 0.2;

    show() {
        if (this.isActive)
            return;
        if (this.isFading)
            return;
        this.node.active = true;
        this.node.opacity = 0;

        this.isFading = true;

        cc.tween(this.node)
            .to(this.tweenTime, { opacity: 255 })
            .call(() => {
                this.isFading = false;
            })
            .start();
    }

    onClose() {
        if (this.isFading)
            return;
        clientEvent.dispatchEvent(EventName.OnGameStart);
        this.isFading = true;
        cc.tween(this.node)
            .to(this.tweenTime, { opacity: 0 })
            .call(() => {
                this.node.active = false;
                this.isFading = false;
            })
            .start();
    }
}
