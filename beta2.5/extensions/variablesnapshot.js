(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('变量快照扩展需要在非沙箱模式下运行');
    }

    const runtime = Scratch.vm.runtime;

    class VariableSnapshot {
        constructor() {
            this.snapshots = new Map();
        }

        getInfo() {
            return {
                id: 'variablesnapshot',
                name: '变量快照',
                color1: '#75bcff',
                color2: '#ffffff',
                blockIconURI:'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIyNjIuNDYyOTQiIGhlaWdodD0iMjYyLjQ2Mjk0IiB2aWV3Qm94PSIwLDAsMjYyLjQ2Mjk0LDI2Mi40NjI5NCI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE4OC43Njg1MywtNDguNzY4NTMpIj48ZyBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiPjxnIGZpbGw9IiM5N2NkZmYiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIj48cGF0aCBkPSJNMjM2LjY1MzA0LDEzOC40NzUzOGMwLC0yLjQ1Njg0IDEuOTkxNjYsLTQuNDQ4NSA0LjQ0ODUxLC00LjQ0ODVoOC44OTcwMWMyLjIyNDI1LDAgMy4zMzYzOCwxLjExMjEzIDQuNDQ4NTEsMi4yMjQyNWw0LjQ0ODUsNC40NDg1YzEuMTEyMTMsMS4xMTIxMiAyLjIyNDI2LDIuMjI0MjUgNC40NDg1MSwyLjIyNDI1aDEzLjM0NTUxYzIuMjI0MjUsMCAzLjMzNjM4LC0xLjExMjEzIDQuNDQ4NSwtMi4yMjQyNWw0LjQ0ODUxLC00LjQ0ODVjMS4xMTIxMiwtMS4xMTIxMiAyLjIyNDI2LC0yLjIyNDI1IDQuNDQ4NTEsLTIuMjI0MjVoMTM4LjUzMDU1YzIuNDU2ODQsMCA0LjQ0ODUxLDEuOTkxNjYgNC40NDg1MSw0LjQ0ODV2NDQuNDg1MDVjMCwyLjQ1Njg0IC0xLjk5MTY2LDQuNDQ4NTEgLTQuNDQ4NTEsNC40NDg1MWgtMTM4LjUzMDU1Yy0yLjIyNDI1LDAgLTMuMzM2MzgsMS4xMTIxMyAtNC40NDg1MSwyLjIyNDI1bC00LjQ0ODUxLDQuNDQ4NWMtMS4xMTIxMiwxLjExMjEyIC0yLjIyNDI1LDIuMjI0MjUgLTQuNDQ4NSwyLjIyNDI1aC0xMy4zNDU1MWMtMi4yMjQyNSwwIC0zLjMzNjM4LC0xLjExMjEzIC00LjQ0ODUxLC0yLjIyNDI1bC00LjQ0ODUsLTQuNDQ4NWMtMS4xMTIxMiwtMS4xMTIxMiAtMi4yMjQyNSwtMi4yMjQyNSAtNC40NDg1MSwtMi4yMjQyNWgtOC44OTcwMWMtMi40NTY4NSwwIC00LjQ0ODUxLC0xLjk5MTY2IC00LjQ0ODUxLC00LjQ0ODUxeiIvPjxwYXRoIGQ9Ik0yOTQuNDgzNiwxNzguNTExOTJjLTIuNDU2ODQsMCAtNC40NDg1MSwtMS45OTE2NiAtNC40NDg1MSwtNC40NDg1MXYtMjYuNjkxMDNjMCwtMi40NTY4NCAxLjk5MTY2LC00LjQ0ODUxIDQuNDQ4NTEsLTQuNDQ4NTFoMTA5LjAwMjFjMi40NTY4NCwwIDQuNDQ4NTEsMS45OTE2NiA0LjQ0ODUxLDQuNDQ4NTF2MjYuNjkxMDNjMCwyLjQ1Njg0IC0xLjk5MTY2LDQuNDQ4NTEgLTQuNDQ4NTEsNC40NDg1MXoiLz48L2c+PGcgZmlsbD0iI2JhZGRmZiIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiPjxwYXRoIGQ9Ik0yMjIuMzMwOTUsMTUyLjc5NzQ3YzAsLTIuNDU2ODQgMS45OTE2NiwtNC40NDg1IDQuNDQ4NTEsLTQuNDQ4NWg4Ljg5NzAxYzIuMjI0MjUsMCAzLjMzNjM4LDEuMTEyMTMgNC40NDg1MSwyLjIyNDI1bDQuNDQ4NSw0LjQ0ODVjMS4xMTIxMywxLjExMjEyIDIuMjI0MjYsMi4yMjQyNSA0LjQ0ODUxLDIuMjI0MjVoMTMuMzQ1NTFjMi4yMjQyNSwwIDMuMzM2MzgsLTEuMTEyMTMgNC40NDg1LC0yLjIyNDI1bDQuNDQ4NTEsLTQuNDQ4NWMxLjExMjEyLC0xLjExMjEyIDIuMjI0MjYsLTIuMjI0MjUgNC40NDg1MSwtMi4yMjQyNWgxMzguNTMwNTVjMi40NTY4NCwwIDQuNDQ4NTEsMS45OTE2NiA0LjQ0ODUxLDQuNDQ4NXY0NC40ODUwNWMwLDIuNDU2ODQgLTEuOTkxNjYsNC40NDg1MSAtNC40NDg1MSw0LjQ0ODUxaC0xMzguNTMwNTVjLTIuMjI0MjUsMCAtMy4zMzYzOCwxLjExMjEzIC00LjQ0ODUxLDIuMjI0MjVsLTQuNDQ4NTEsNC40NDg1Yy0xLjExMjEyLDEuMTEyMTIgLTIuMjI0MjUsMi4yMjQyNSAtNC40NDg1LDIuMjI0MjVoLTEzLjM0NTUxYy0yLjIyNDI1LDAgLTMuMzM2MzgsLTEuMTEyMTMgLTQuNDQ4NTEsLTIuMjI0MjVsLTQuNDQ4NSwtNC40NDg1Yy0xLjExMjEyLC0xLjExMjEyIC0yLjIyNDI1LC0yLjIyNDI1IC00LjQ0ODUxLC0yLjIyNDI1aC04Ljg5NzAxYy0yLjQ1Njg0LDAgLTQuNDQ4NTEsLTEuOTkxNjYgLTQuNDQ4NTEsLTQuNDQ4NTF6Ii8+PHBhdGggZD0iTTI4MC4xNjE1MSwxOTIuODM0MDFjLTIuNDU2ODQsMCAtNC40NDg1MSwtMS45OTE2NiAtNC40NDg1MSwtNC40NDg1MXYtMjYuNjkxMDNjMCwtMi40NTY4NCAxLjk5MTY2LC00LjQ0ODUxIDQuNDQ4NTEsLTQuNDQ4NTFoMTA5LjAwMjFjMi40NTY4NCwwIDQuNDQ4NTEsMS45OTE2NiA0LjQ0ODUxLDQuNDQ4NTF2MjYuNjkxMDNjMCwyLjQ1Njg0IC0xLjk5MTY2LDQuNDQ4NTEgLTQuNDQ4NTEsNC40NDg1MXoiLz48L2c+PGcgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiPjxwYXRoIGQ9Ik0yMDYuOTg1ODUsMTY4LjE0MjU2YzAsLTIuNDU2ODQgMS45OTE2NiwtNC40NDg1IDQuNDQ4NTEsLTQuNDQ4NWg4Ljg5NzAxYzIuMjI0MjUsMCAzLjMzNjM4LDEuMTEyMTMgNC40NDg1LDIuMjI0MjVsNC40NDg1MSw0LjQ0ODVjMS4xMTIxMiwxLjExMjEyIDIuMjI0MjUsMi4yMjQyNSA0LjQ0ODUxLDIuMjI0MjVoMTMuMzQ1NTJjMi4yMjQyNSwwIDMuMzM2MzgsLTEuMTEyMTMgNC40NDg1LC0yLjIyNDI1bDQuNDQ4NTEsLTQuNDQ4NWMxLjExMjEyLC0xLjExMjEyIDIuMjI0MjYsLTIuMjI0MjUgNC40NDg1MSwtMi4yMjQyNWgxMzguNTMwNTVjMi40NTY4NCwwIDQuNDQ4NTEsMS45OTE2NiA0LjQ0ODUxLDQuNDQ4NXY0NC40ODUwNWMwLDIuNDU2ODQgLTEuOTkxNjYsNC40NDg1MSAtNC40NDg1MSw0LjQ0ODUxaC0xMzguNTMwNTVjLTIuMjI0MjUsMCAtMy4zMzYzOCwxLjExMjEzIC00LjQ0ODUxLDIuMjI0MjVsLTQuNDQ4NTEsNC40NDg1Yy0xLjExMjEyLDEuMTEyMTIgLTIuMjI0MjUsMi4yMjQyNSAtNC40NDg1LDIuMjI0MjVoLTEzLjM0NTUyYy0yLjIyNDI1LDAgLTMuMzM2MzgsLTEuMTEyMTMgLTQuNDQ4NTEsLTIuMjI0MjVsLTQuNDQ4NTEsLTQuNDQ4NWMtMS4xMTIxMiwtMS4xMTIxMiAtMi4yMjQyNSwtMi4yMjQyNSAtNC40NDg1LC0yLjIyNDI1aC04Ljg5NzAxYy0yLjQ1Njg0LDAgLTQuNDQ4NTEsLTEuOTkxNjYgLTQuNDQ4NTEsLTQuNDQ4NTF6Ii8+PHBhdGggZD0iTTI2NC44MTY0MiwyMDguMTc5MTFjLTIuNDU2ODQsMCAtNC40NDg1MSwtMS45OTE2NiAtNC40NDg1MSwtNC40NDg1MXYtMjYuNjkxMDNjMCwtMi40NTY4NCAxLjk5MTY2LC00LjQ0ODUxIDQuNDQ4NTEsLTQuNDQ4NTFoMTA5LjAwMjFjMi40NTY4NCwwIDQuNDQ4NTEsMS45OTE2NiA0LjQ0ODUxLDQuNDQ4NTF2MjYuNjkxMDNjMCwyLjQ1Njg0IC0xLjk5MTY2LDQuNDQ4NTEgLTQuNDQ4NTEsNC40NDg1MXoiLz48L2c+PGltYWdlIHg9IjAiIHk9IjAiIHdpZHRoPSIwIiBoZWlnaHQ9IjAiIHhsaW5rOmhyZWY9ImRhdGE6LCIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMTg4Ljc2ODUzLDMxMS4yMzE0N3YtMjYyLjQ2Mjk0aDI2Mi40NjI5NHYyNjIuNDYyOTR6IiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIvPjwvZz48L2c+PC9zdmc+',
                blocks: [

                    {
                        opcode: 'varSave',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '变量 [VAR] 创建快照 [NAME]',
                        arguments: {
                            VAR: { type: Scratch.ArgumentType.STRING, defaultValue: '变量' },
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '变量存档1' }
                        }
                    },
                    {
                        opcode: 'varLoad',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '变量 [VAR] 恢复为快照 [NAME]',
                        arguments: {
                            VAR: { type: Scratch.ArgumentType.STRING, defaultValue: '变量' },
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '变量存档1' }
                        }
                    },
                    {
                        opcode: 'varSet',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '变量快照 [NAME] 设为 [VALUE]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '变量存档1' },
                            VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '新值' }
                        }
                    },
                    {
                        opcode: 'varChange',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '变量快照 [NAME] 增加 [DELTA]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '变量存档1' },
                            DELTA: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: '列表'
                    },

                    {
                        opcode: 'listSave',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表 [LIST] 创建快照 [NAME]',
                        arguments: {
                            LIST: { type: Scratch.ArgumentType.STRING, defaultValue: '列表' },
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '列表存档1' }
                        }
                    },
                    {
                        opcode: 'listLoad',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表 [LIST] 恢复为快照 [NAME]',
                        arguments: {
                            LIST: { type: Scratch.ArgumentType.STRING, defaultValue: '列表' },
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '列表存档1' }
                        }
                    },
                    {
                        opcode: 'listAppend',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表快照 [NAME] 追加 [ITEM]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '列表存档1' },
                            ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: '新项' }
                        }
                    },
                    {
                        opcode: 'listDelete',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表快照 [NAME] 删除第 [INDEX] 项',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '列表存档1' },
                            INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        opcode: 'listInsert',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表快照 [NAME] 第 [INDEX] 项前插入 [ITEM]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '列表存档1' },
                            INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: '新项' }
                        }
                    },
                    {
                        opcode: 'listReplace',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表快照 [NAME] 第 [INDEX] 项替换为 [ITEM]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '列表存档1' },
                            INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: '新项' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: '列表项'
                    },

                    {
                        opcode: 'listItemSave',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表 [LIST] 第 [INDEX] 项创建快照 [NAME]',
                        arguments: {
                            LIST: { type: Scratch.ArgumentType.STRING, defaultValue: '列表' },
                            INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '单项存档1' }
                        }
                    },
                    {
                        opcode: 'listItemLoad',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表 [LIST] 第 [INDEX] 项恢复为快照 [NAME]',
                        arguments: {
                            LIST: { type: Scratch.ArgumentType.STRING, defaultValue: '列表' },
                            INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '单项存档1' }
                        }
                    },
                    {
                        opcode: 'listItemSet',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表项快照 [NAME] 设为 [VALUE]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '单项存档1' },
                            VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '新值' }
                        }
                    },
                    {
                        opcode: 'listItemChange',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '列表项快照 [NAME] 增加 [DELTA]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '单项存档1' },
                            DELTA: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: '工具'
                    },

                    {
                        opcode: 'getValue',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '快照 [NAME] 的值',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '存档1' }
                        }
                    },
                    {
                        opcode: 'getType',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '快照 [NAME] 的类型',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '存档1' }
                        }
                    },
                    {
                        opcode: 'listAll',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '所有快照JSON'
                    },
                    {
                        opcode: 'delete',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '清除快照 [NAME]',
                        arguments: {
                            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '存档1' }
                        }
                    },
                    {
                        opcode: 'clear',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '清除所有快照'
                    }
                ]
            };
        }

        /* ---------- 辅助方法 ---------- */
        _findVariable(name, util) {
            const nameStr = String(name);
            let variable = util.target.lookupVariableByNameAndType(nameStr, '');
            if (variable) return variable;

            const targets = [util.target, runtime.getTargetForStage()];
            for (const target of targets) {
                if (!target) continue;
                for (const v of Object.values(target.variables)) {
                    if (v.name === nameStr && v.type === '') {
                        return v;
                    }
                }
            }
            return null;
        }

        _findList(name, util) {
            const nameStr = String(name);
            let list = util.target.lookupVariableByNameAndType(nameStr, 'list');
            if (list) return list;

            const targets = [util.target, runtime.getTargetForStage()];
            for (const target of targets) {
                if (!target) continue;
                for (const v of Object.values(target.variables)) {
                    if (v.type === 'list' && String(v.name) === nameStr) {
                        return v;
                    }
                }
            }

            for (const target of targets) {
                if (!target) continue;
                const directMatch = target.lookupVariableByNameAndType(nameStr, '');
                if (directMatch && directMatch.type === 'list') {
                    return directMatch;
                }
            }
            return null;
        }

        /* ---------- 变量快照操作 ---------- */
        varSave(args, util) {
            const variable = this._findVariable(args.VAR, util);
            if (!variable) {
                console.warn(`[变量快照] 未找到变量: ${args.VAR}`);
                return;
            }
            this.snapshots.set(args.NAME, {
                type: 'var',
                target: args.VAR,
                value: variable.value
            });
            console.log(`[变量快照] 已为变量 "${args.VAR}" 创建快照 "${args.NAME}"`);
        }

        varLoad(args, util) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'var') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是变量快照或不存在`);
                return;
            }
            const variable = this._findVariable(args.VAR, util);
            if (variable) {
                variable.value = snap.value;
                console.log(`[变量快照] 已将变量 "${args.VAR}" 恢复为快照 "${args.NAME}"`);
            }
        }

        varSet(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'var') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是变量快照或不存在`);
                return;
            }
            snap.value = args.VALUE;
            console.log(`[变量快照]  已将变量快照 "${args.NAME}" 的值设为: ${args.VALUE}`);
        }

        varChange(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'var') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是变量快照或不存在`);
                return;
            }
            const current = Number(snap.value);
            const delta = Number(args.DELTA);
            if (isNaN(current)) {
                console.warn(`[变量快照] 变量快照 "${args.NAME}" 的值不是数字: ${snap.value}`);
                return;
            }
            if (isNaN(delta)) {
                console.warn(`[变量快照] 增量 "${args.DELTA}" 不是有效数字`);
                return;
            }
            snap.value = current + delta;
            console.log(`[变量快照]  变量快照 "${args.NAME}" 的值从 ${current} 增加到 ${snap.value}`);
        }

        /* ---------- 列表快照操作 ---------- */
        listSave(args, util) {
            const list = this._findList(args.LIST, util);
            if (!list) {
                console.warn(`[变量快照] 未找到列表: ${args.LIST}`);
                return;
            }
            this.snapshots.set(args.NAME, {
                type: 'list',
                target: args.LIST,
                value: JSON.parse(JSON.stringify(list.value))
            });
            console.log(`[变量快照]  已为列表 "${args.LIST}" 创建快照 "${args.NAME}"`);
        }

        listLoad(args, util) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'list') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表快照或不存在`);
                return;
            }
            const list = this._findList(args.LIST, util);
            if (list) {
                list.value = JSON.parse(JSON.stringify(snap.value));
                console.log(`[变量快照]  已将列表 "${args.LIST}" 恢复为快照 "${args.NAME}"`);
            }
        }

        listAppend(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'list') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表快照或不存在`);
                return;
            }
            snap.value.push(args.ITEM);
            console.log(`[变量快照]  已向列表快照 "${args.NAME}" 追加项: ${args.ITEM}`);
        }

        listDelete(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'list') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表快照或不存在`);
                return;
            }
            const userIndex = Math.floor(Number(args.INDEX));
            const internalIndex = userIndex - 1;
            if (userIndex < 1 || internalIndex >= snap.value.length) {
                console.warn(`[变量快照] 索引 ${userIndex} 超出列表快照 "${args.NAME}" 范围`);
                return;
            }
            const removed = snap.value.splice(internalIndex, 1)[0];
            console.log(`[变量快照]  已从列表快照 "${args.NAME}" 删除第 ${userIndex} 项: ${removed}`);
        }

        listInsert(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'list') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表快照或不存在`);
                return;
            }
            const userIndex = Math.floor(Number(args.INDEX));
            const internalIndex = userIndex - 1;
            if (userIndex < 1 || internalIndex > snap.value.length) {
                console.warn(`[变量快照] 索引 ${userIndex} 超出列表快照 "${args.NAME}" 范围`);
                return;
            }
            snap.value.splice(internalIndex, 0, args.ITEM);
            console.log(`[变量快照]  已在列表快照 "${args.NAME}" 的第 ${userIndex} 项前插入: ${args.ITEM}`);
        }

        listReplace(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'list') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表快照或不存在`);
                return;
            }
            const userIndex = Math.floor(Number(args.INDEX));
            const internalIndex = userIndex - 1;
            if (userIndex < 1 || internalIndex >= snap.value.length) {
                console.warn(`[变量快照] 索引 ${userIndex} 超出列表快照 "${args.NAME}" 范围`);
                return;
            }
            const oldValue = snap.value[internalIndex];
            snap.value[internalIndex] = args.ITEM;
            console.log(`[变量快照]  已将列表快照 "${args.NAME}" 的第 ${userIndex} 项从 "${oldValue}" 替换为 "${args.ITEM}"`);
        }

        /* ---------- 列表项快照操作 ---------- */
        listItemSave(args, util) {
            const list = this._findList(args.LIST, util);
            if (!list) {
                console.warn(`[变量快照] 未找到列表: ${args.LIST}`);
                return;
            }
            const userIndex = Math.floor(Number(args.INDEX));
            const internalIndex = userIndex - 1;
            if (userIndex < 1 || internalIndex >= list.value.length) {
                console.warn(`[变量快照] 索引 ${userIndex} 超出列表 "${args.LIST}" 范围`);
                return;
            }
            this.snapshots.set(args.NAME, {
                type: 'listItem',
                target: args.LIST,
                userIndex: userIndex,
                internalIndex: internalIndex,
                value: list.value[internalIndex]
            });
            console.log(`[变量快照]  已为列表 "${args.LIST}" 的第 ${userIndex} 项创建快照 "${args.NAME}"`);
        }

        listItemLoad(args, util) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'listItem') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表项快照或不存在`);
                return;
            }
            const list = this._findList(args.LIST, util);
            if (!list) return;

            const userIndex = Math.floor(Number(args.INDEX));
            if (userIndex !== snap.userIndex) {
                console.warn(`[变量快照] 快照 "${args.NAME}" 是为第 ${snap.userIndex} 项创建的，不能用于第 ${userIndex} 项`);
                return;
            }
            if (snap.internalIndex >= list.value.length) return;

            list.value[snap.internalIndex] = snap.value;
            console.log(`[变量快照]  已将列表 "${args.LIST}" 的第 ${userIndex} 项恢复为快照 "${args.NAME}"`);
        }

        listItemSet(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'listItem') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表项快照或不存在`);
                return;
            }
            snap.value = args.VALUE;
            console.log(`[变量快照]  已将列表项快照 "${args.NAME}" 的值设为: ${args.VALUE}`);
        }

        listItemChange(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap || snap.type !== 'listItem') {
                console.warn(`[变量快照] 快照 "${args.NAME}" 不是列表项快照或不存在`);
                return;
            }
            const current = Number(snap.value);
            const delta = Number(args.DELTA);
            if (isNaN(current)) {
                console.warn(`[变量快照] 列表项快照 "${args.NAME}" 的值不是数字: ${snap.value}`);
                return;
            }
            if (isNaN(delta)) {
                console.warn(`[变量快照] 增量 "${args.DELTA}" 不是有效数字`);
                return;
            }
            snap.value = current + delta;
            console.log(`[变量快照]  列表项快照 "${args.NAME}" 的值从 ${current} 增加到 ${snap.value}`);
        }

        /* ---------- 工具方法 ---------- */
        getValue(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap) return '';
            if (snap.type === 'list') {
                return JSON.stringify(snap.value);
            }
            return String(snap.value);
        }

        getType(args) {
            const snap = this.snapshots.get(args.NAME);
            if (!snap) return '';
            switch (snap.type) {
                case 'var': return '变量';
                case 'list': return '列表';
                case 'listItem': return '列表项';
                default: return '未知';
            }
        }

        listAll() {
            const result = [];
            for (const [name, snap] of this.snapshots.entries()) {
                result.push({
                    name: name,
                    type: snap.type,
                    target: snap.target,
                    index: snap.userIndex ?? null,
                    value: snap.value
                });
            }
            return JSON.stringify(result);
        }

        delete(args) {
            this.snapshots.delete(args.NAME);
        }

        clear() {
            this.snapshots.clear();
        }
    }

    Scratch.extensions.register(new VariableSnapshot());
})(Scratch);