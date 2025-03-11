// Utility function to return an array of GuiButtons with improved styling
function button_utility_script(inputArr, bindingClass, actionBindMode) {
    actionBindMode ||= 0;
    var button = ModAPI.reflect.getClassById("net.minecraft.client.gui.GuiButton").constructors.find(x => x.length === 6);
    var originalActionPerformed = ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(actionBindMode === 2 ? "net.minecraft.client.gui.GuiScreen" : bindingClass, "actionPerformed")];
    var originalInit = ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(bindingClass, "initGui")];

    var out = inputArr.flatMap(x => {
        var btn = button(x.uid, x.x, x.y, x.w, x.h, ModAPI.util.str(x.text));

        // Apply custom button styling
        ModAPI.util.setField(btn, "roundedCorners", true); // Attempt to round corners
        ModAPI.util.setField(btn, "shadow", true); // Add a subtle shadow
        ModAPI.util.setField(btn, "padding", 2); // Slight padding for sleekness

        return btn;
    });

    if (actionBindMode !== 1) {
        ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(actionBindMode === 2 ? "net.minecraft.client.gui.GuiScreen" : bindingClass, "actionPerformed")] = function (...args) {
            var id = ModAPI.util.wrap(args[1]).getCorrective().id;
            var jsAction = inputArr.find(x => x.uid === id);
            if (jsAction) {
                jsAction.click(ModAPI.util.wrap(args[0]));
            }
            return originalActionPerformed.apply(this, args);
        };
    }

    ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(bindingClass, "initGui")] = function (...args) {
        originalInit.apply(this, args);
        var gui = ModAPI.util.wrap(args[0]).getCorrective();
        out.forEach(guiButton => {
            gui.buttonList.add(guiButton);
        });
    };
}

(() => {
    ModAPI.require("player");
    var backlog = [];
    var delayState = false;

    const originalSend = WebSocket.prototype.send;
    Object.defineProperty(WebSocket.prototype, 'send', {
        configurable: true,
        enumerable: false,
        writable: false,
        value: function (data) {
            if (delayState) {
                backlog.push({ data: data, thisArg: this });
            } else {
                originalSend.call(this, data);
            }
        }
    });

    ModAPI.meta.title("Dupe Hunting");
    ModAPI.meta.description("⚠️Only works over WS, not local. May induce bans.⚠️");
    ModAPI.meta.credits("by ZXMushroom63");

    var dupeHuntButtons = [
        { text: "Silently Close", click: () => ModAPI.minecraft.displayGuiScreen(null), x: 0, y: 0, w: 110, h: 25, uid: 142715254 },
        { text: "Toggle Delay", click: () => {
            delayState = !delayState;
            alert(delayState ? "Delay On" : "Sending Packets...");
            if (!delayState) {
                backlog.forEach(backlogItem => originalSend.call(backlogItem.thisArg, backlogItem.data));
                backlog = [];
            }
        }, x: 0, y: 30, w: 110, h: 25, uid: 142715253 },
        { text: "Server Close", click: () => {
            var CloseWindow = ModAPI.reflect.getClassByName("C0DPacketCloseWindow").constructors[0];
            ModAPI.player.sendQueue.addToSendQueue(CloseWindow(ModAPI.player.openContainer.getCorrective().windowId));
        }, x: 0, y: 60, w: 110, h: 25, uid: 142715252 },
        { text: "Send & Disconnect", click: () => {
            delayState = false;
            backlog.forEach(backlogItem => originalSend.call(backlogItem.thisArg, backlogItem.data));
            backlog = [];
            ModAPI.mc.getNetHandler().getNetworkManager().doClientDisconnect(
                ModAPI.hooks._classMap[ModAPI.util.getCompiledName("net.minecraft.util.ChatComponentText")]
                    .constructors[0](ModAPI.util.str("Dupe Hunting Utils Disconnect"))
            );
        }, x: 0, y: 90, w: 110, h: 25, uid: 142715251 },
        { text: "Use Chat", click: () => {
            var p = window.prompt("Input chat/command:", "Hello World");
            if (p) ModAPI.player.sendChatMessage(ModAPI.util.str(p));
        }, x: 0, y: 120, w: 110, h: 25, uid: 142715250 }
    ];

    [
        "net.minecraft.client.gui.inventory.GuiInventory",
        "net.minecraft.client.gui.inventory.GuiContainerCreative",
        "net.minecraft.client.gui.inventory.GuiBeacon"
    ].forEach(ui => {
        button_utility_script(dupeHuntButtons, ui, 0);
    });
})();
