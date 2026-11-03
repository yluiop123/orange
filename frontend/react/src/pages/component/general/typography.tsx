import { Typography } from "@/components/ext/typography"
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react"
export default function TypographyPage() {
    return (
        <Typography >
            <Typography.Title level={1}>Typography 排版示例</Typography.Title>
             <br/>
            <Typography.Title level={2}>Text 文本</Typography.Title>
            <Typography.Paragraph>
                <Typography.Text strong>Strong 加粗</Typography.Text> ·
                <Typography.Text underline>Underline 下划线</Typography.Text> ·
                <Typography.Text delete>Delete 删除线</Typography.Text> ·
                <Typography.Text code>Code 代码</Typography.Text> ·
                <Typography.Text italic>Italic 斜体</Typography.Text>
            </Typography.Paragraph>
             <br/>
            <Typography.Title level={2}>copyable/editable 复制/编辑</Typography.Title>
            <Typography.Paragraph>
                <Typography.Text copyable>Copyable 支持复制</Typography.Text>
            </Typography.Paragraph>
            <Typography.Text
                copyable
                copyIcon={<Copy size={16} />}
                copiedIcon={<Check size={16} className="text-green-500" />}
            >
                Copyable withIcon 自定义图标复制
            </Typography.Text>
            <Typography.Paragraph>
                <Typography.Text editable>Editable 支持编辑</Typography.Text>
            </Typography.Paragraph>
            <br/>
            <Typography.Title level={2}>ellipsis 省略</Typography.Title>
            <Typography.Paragraph>
                <Typography.Text ellipsis={{ rows: 1, expandable: true }}>
                    {`这是一段很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本`.repeat(10)}
                </Typography.Text>
            </Typography.Paragraph>

            <Typography.Text ellipsis={{ rows: 2, expandable: true, type: "end" }}>
                {`这是一段很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本`.repeat(10)}
            </Typography.Text>

            <Typography.Text ellipsis={{ rows: 1, expandable: true, type: "middle" }}>
                {`这是一段非常非常长的文本示例，用于展示中间省略，仅显示头尾，中间省略号...`.repeat(10)}
            </Typography.Text>
            <Typography.Text
                ellipsis={{
                    rows: 1,
                    expandable: true,
                    type: "end",
                    expandText: "显示更多",
                    collapseText: "收起全文",
                }}
            >
                {`这是一段很长的文本，用于测试自定义展开收起文字显示，并高亮显示。`.repeat(20)}
            </Typography.Text>
            <Typography.Text
                ellipsis={{
                    rows: 2,
                    expandable: true,
                    type: "end",
                    expandNode: <ChevronDown size={16} />,
                    collapseNode: <ChevronUp size={16} />,
                }}
            >
                {`这是一段很长的文本，用于测试自定义图标展开收起。`.repeat(20)}
            </Typography.Text>

        </Typography>
    )
}
