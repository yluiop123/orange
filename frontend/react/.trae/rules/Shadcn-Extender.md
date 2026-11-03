# Skill: Ant-Logic Shadcn Extender

## 1. 核心约束 (Hard Constraints)
- **底层组件**: 要创建的组件中能复用shadcn组件的部分，直接复用（比如单选和复选组件），复用不了的则用Radix UI + Tailwind CSS实现。
- **视觉审美**: 严格保持 Shadcn UI 风格（中性色、极简、CSS 变量）。
- **功能逻辑**: 深度参照 Ant Design 功能和交互。
- **是否新建组件**: 要创建组件是shadcn中存在的组件，仅生成使用示例。如果shadcn中不存在该组件，则生成扩展组件和使用示例。
- **扩展组件语言**: 扩展组件中涉及语言的地方默认英文，暴露入参可以自定义为其他语言。
- **示例语言**: 示例中涉及语言的地方直接显示双语比如用户名这么显示: UserName/用户名。

## 2. 命名规范 (Naming & Path)
- **文件名 (File Name)**: 必须全部小写，使用连字符。示例: `input-number.tsx`。
- **功能**: 参照 Ant Design 组件功能，尽量满足。
- **组件目录**: `@/components/ext/`。
- **示例目录**: `@/pages/component/` 下对应的功能文件夹。

## 3. 自动化任务逻辑 (Workflow)
当你收到生成组件的指令时，必须**同时**生成两个文件：
1. **组件实现文件**: 位于 `@/components/ext/`，全小写命名。
2. **全面示例页面**: 位于 `@/pages/component/{dir}/{name}.tsx`（或类似路径 `dir`路径我到时候会指定，`name`你根据规范生成）。
   - 示例必须涵盖：基础用法、受控模式、Loading 状态、错误状态等 AntD 典型场景。

## 4. 指令触发示例 (Usage)
"按照 Skill，在 @/components/ext 下生成 ant-button，并在 @/pages/component/button 生成使用示例。"