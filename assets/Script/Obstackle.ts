// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    protected onLoad(): void {
        let rigidBody = this.node.getComponent(cc.RigidBody);
        rigidBody.enabledContactListener = true;
        // rigidBody.onBeginContact = this.onBeginContact;
        // rigidBody.onBeginContact((contact, selfCollider)=>{

        // })
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        console.log("Begin Contact with:", otherCollider.node.name);

        // Example: Check if the other collider is of a specific node
        if (otherCollider.node.name === 'TargetNode') {
            // Handle collision logic with TargetNode
            // this.handleCollisionWithTarget(otherCollider.node);
        }
    }
}
