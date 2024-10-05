// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { clientEvent } from "./EventMechanism/ClientEvent";
import { EventName } from "./EventMechanism/EventNames";
import VideoPlayer from "./VideoPlayer";

const { ccclass, property } = cc._decorator;

export enum VideoPlayerId {
    none,
    KPR,
    PUSH_PUSH,
    SLOT_GAMES,
    SMASHING,
    STACKBALL,
    WORDLE
}

@ccclass('VideoObject')
export class VideoObject {
    @property({
        type: cc.Enum(VideoPlayerId)
    })
    name: VideoPlayerId = VideoPlayerId.none;

    @property({
        type: VideoPlayer
    })
    videoClip: VideoPlayer = null;
}

@ccclass
export default class VideoManager extends cc.Component {

    @property(VideoObject)
    videosArr: VideoObject[] = [];

    private maps: Map<VideoPlayerId, VideoObject> = null;

    protected onLoad(): void {
        clientEvent.on(EventName.OnShowVideo, this.showVideo, this);
    }

    showVideo(videoId: VideoPlayerId) {
        let video = this.getVideoObject(videoId);
        video.videoClip.show();
    }

    getVideoObject(name: VideoPlayerId) {
        if (!this.maps) {
            this.initMaps();
        }
        return this.maps.get(name);
    }

    initMaps() {
        this.maps = new Map<VideoPlayerId, VideoObject>();
        this.videosArr.forEach((obj, i) => {
            this.maps.set(obj.name, obj);
        });
    }

}
