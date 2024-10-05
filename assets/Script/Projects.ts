// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { clientEvent } from "./EventMechanism/ClientEvent";
import { EventName } from "./EventMechanism/EventNames";
import Popup from "./Popup";
import { VideoPlayerId } from "./VideoManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Projects extends Popup {

    onVideoSelect(button, data: string) {
        switch (data) {
            case "khelplay":
                clientEvent.dispatchEvent(EventName.OnShowVideo, VideoPlayerId.KPR);
                break;
            case "smashing":
                clientEvent.dispatchEvent(EventName.OnShowVideo, VideoPlayerId.SMASHING);
                break;
            case "pushpush":
                clientEvent.dispatchEvent(EventName.OnShowVideo, VideoPlayerId.PUSH_PUSH);
                break;
            case "stackball":
                clientEvent.dispatchEvent(EventName.OnShowVideo, VideoPlayerId.STACKBALL);
                break;
            case "slotgame":
                clientEvent.dispatchEvent(EventName.OnShowVideo, VideoPlayerId.SLOT_GAMES);
                break;
            case "wordle":
                clientEvent.dispatchEvent(EventName.OnShowVideo, VideoPlayerId.WORDLE);
                break;
            default:
                break;
        }
    }
}