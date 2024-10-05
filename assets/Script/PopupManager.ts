// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { clientEvent } from "./EventMechanism/ClientEvent";
import { EventName } from "./EventMechanism/EventNames";
import Popup from "./Popup";
import VideoPlayer from "./VideoPlayer";

const { ccclass, property } = cc._decorator;

export enum PopupId {
    none,
    INTRO,
    EDUCATION,
    EXPERIENCE,
    SKILLS,
    PROJECTS
}

@ccclass('PopObject')
export class PopObject {
    @property({
        type: cc.Enum(PopupId)
    })
    name: PopupId = PopupId.none;

    @property({
        type: Popup
    })
    handler: Popup = null;
}

@ccclass
export default class PopupManager extends cc.Component {

    @property(PopObject)
    popupArr: PopObject[] = [];
    private maps: Map<PopupId, PopObject> = null;


    protected onLoad(): void {
        clientEvent.on(EventName.OnShowPopup, this.showPopup, this)
    }

    showPopup(popupId: PopupId, toshow: boolean) {
        let popup = this.getPopupObject(popupId);
        if (toshow) {
            popup.handler.show();
        }else{
            popup.handler.onClose();
        }
    }

    getPopupObject(name: PopupId) {
        if (!this.maps) {
            this.initMaps();
        }
        return this.maps.get(name);
    }

    initMaps() {
        this.maps = new Map<PopupId, PopObject>();
        this.popupArr.forEach((obj, i) => {
            this.maps.set(obj.name, obj);
        });
    }

}
