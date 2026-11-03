import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger
} from "@/components/ui/context-menu";

export default function ContextMenuPage() {
    const handleSelect = (label: string) => {
        alert(`你选择了 / You selected: ${label}`);
    };
    return (
        <>
            <h2 className="text-lg font-semibold">🖱️右键菜单 / Context Menu</h2>
            <ContextMenu>
                <ContextMenuTrigger className="flex h-50 w-80 items-center justify-center rounded-md border border-dashed text-sm">
                    Right click here
                </ContextMenuTrigger>
                <ContextMenuContent className="w-80">
                    <ContextMenuItem inset onClick={() => handleSelect("返回 / Back")}>
                        🔙 返回 / Back
                        <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem inset onClick={() => handleSelect("前进 / Forward")} disabled>
                        🔜 前进 / Forward
                        <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem inset onClick={() => handleSelect("重新加载 / Reload")}>
                        🔄 重新加载 / Reload
                        <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuSub>
                        <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-44" >
                            <ContextMenuItem onClick={() => handleSelect("复制 / Copy")}>
                                📋 复制 / Copy
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleSelect("粘贴 / Paste")}>
                                📄 粘贴 / Paste
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleSelect("重命名 / Rename")}>
                                ✏️ 重命名 / Rename
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem>Developer Tools</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem variant="destructive" onSelect={() => handleSelect("删除 / Delete")}>
                                ❌ 删除 / Delete
                            </ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    <ContextMenuCheckboxItem onClick={() => handleSelect("显示书签 / Show Bookmarks")}>
                        🔖 显示书签 / Show Bookmarks
                    </ContextMenuCheckboxItem>
                    <ContextMenuCheckboxItem onClick={() => handleSelect("显示完整URL / Show Full URLs")}>
                        🔗 显示完整URL / Show Full URLs
                    </ContextMenuCheckboxItem>
                    <ContextMenuSeparator />
                </ContextMenuContent>
            </ContextMenu>
        </>
    )
}
