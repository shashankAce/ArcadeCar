// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

export enum SIGNAL {
    GREEN,
    RED
}

@ccclass
export default class GameController extends cc.Component {
    signal: SIGNAL = SIGNAL.RED;

    protected onLoad(): void {
        cc.director.getPhysicsManager().enabled = true;

    }

    onStart() {
        this.signal = SIGNAL.GREEN;
    }

}
