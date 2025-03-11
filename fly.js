function button_utility_script(inputArr, bindingClass, actionBindMode) {
    actionBindMode ||= 0;
    var button = ModAPI.reflect.getClassById("net.minecraft.client.gui.GuiButton").constructors.find(x => x.length === 6);
    var originalActionPerformed = ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(actionBindMode === 2 ? "net.minecraft.client.gui.GuiScreen" : bindingClass, "actionPerformed")];
    var originalInit = ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(bindingClass, "initGui")];
    var out = inputArr.flatMap(x => {
        var btn = button(x.uid, x.x, x.y, x.w, x.h, ModAPI.util.str(x.text));
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
        }
    }
    ModAPI.hooks.methods[ModAPI.util.getMethodFromPackage(bindingClass, "initGui")] = function (...args) {
        originalInit.apply(this, args);
        var gui = ModAPI.util.wrap(args[0]).getCorrective();
        if (gui.buttonList) {
            out.forEach(guiButton => {
                gui.buttonList.add(guiButton);
            });
        }
    }
}

(() => {
    ModAPI.meta.title("Mob ESP & Flight");
    ModAPI.meta.description("Adds a toggle for Mob ESP and Flight Mode.");
    ModAPI.meta.credits("Modified by Lemon");

    let espEnabled = false;
    let flyEnabled = false;
    
    var buttons = [{
        text: "Toggle Mob ESP",
        click: () => {
            espEnabled = !espEnabled;
            alert(espEnabled ? "Mob ESP Enabled" : "Mob ESP Disabled");
        },
        x: 250, // Right top side
        y: 5,
        w: 120,
        h: 20,
        uid: 152715251
    },
    {
        text: "Toggle Fly",
        click: () => {
            flyEnabled = !flyEnabled;
            ModAPI.player.capabilities.allowFlying = flyEnabled;
            ModAPI.player.capabilities.isFlying = flyEnabled;
            ModAPI.player.sendPlayerAbilities();
            alert(flyEnabled ? "Flight Enabled" : "Flight Disabled");
        },
        x: 250, // Bottom right of options menu
        y: 150,
        w: 120,
        h: 20,
        uid: 152715252
    }];

    [
        "net.minecraft.client.gui.GuiOptions",
        "net.minecraft.client.gui.GuiIngameMenu"
    ].forEach(ui => {
        button_utility_script(buttons, ui, 0);
    });

    ModAPI.hooks.injectEvent("net.minecraft.client.renderer.entity.RenderManager", "renderEntity", (event) => {
        if (!espEnabled) return;
        var entity = event.args[0];
        if (entity && (entity.getClass().getSimpleName().includes("EntityLiving") || entity.getClass().getSimpleName().includes("EntityZombie"))) {
            ModAPI.render.renderEntityBoundingBox(entity, 0, 255, 0, 255); // Green ESP
            ModAPI.render.renderTracerToEntity(entity, 255, 0, 0, 255); // Red Tracer
        }
    });
})();
