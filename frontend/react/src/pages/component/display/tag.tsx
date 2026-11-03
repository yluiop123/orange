// src/pages/component/display/tag.tsx
import { Tag } from "@/components/ext/tag";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TagDemo() {
  const [tags, setTags] = useState([
    { id: 1, label: "React" },
    { id: 2, label: "TypeScript" },
    { id: 3, label: "Tailwind CSS" },
  ]);

  const handleRemoveTag = (id: number) => {
    setTags(tags.filter(tag => tag.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Tags 基础标签</h2>
      <div className="flex flex-wrap gap-2">
        <Tag>Default</Tag>
        <Tag variant="primary">Primary</Tag>
        <Tag variant="secondary">Secondary</Tag>
        <Tag variant="success">Success</Tag>
        <Tag variant="warning">Warning</Tag>
        <Tag variant="error">Error</Tag>
        <Tag variant="info">Info</Tag>
      </div>

      <h2 className="text-xl font-bold">Tag Sizes 标签尺寸</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Tag size="sm">Small Tag</Tag>
        <Tag size="md">Medium Tag</Tag>
        <Tag size="lg">Large Tag</Tag>
      </div>

      <h2 className="text-xl font-bold">Closable Tags 可关闭标签</h2>
      <div className="flex flex-wrap gap-2">
        <Tag variant="primary" closable onClose={() => console.log('Closed primary tag')}>
          Primary
        </Tag>
        <Tag variant="success" closable onClose={() => console.log('Closed success tag')}>
          Success
        </Tag>
        <Tag variant="warning" closable onClose={() => console.log('Closed warning tag')}>
          Warning
        </Tag>
        <Tag variant="error" closable onClose={() => console.log('Closed error tag')}>
          Error
        </Tag>
      </div>

      <h2 className="text-xl font-bold">Interactive Tag List 交互式标签列表</h2>
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        {tags.map(tag => (
          <Tag 
            key={tag.id} 
            variant="secondary" 
            closable
            onClose={() => handleRemoveTag(tag.id)}
          >
            {tag.label}
          </Tag>
        ))}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setTags([...tags, { id: Date.now(), label: `Tag ${tags.length + 1}` }])}
        >
          Add Tag
        </Button>
      </div>

      <h2 className="text-xl font-bold">Disabled Tags 禁用标签</h2>
      <div className="flex flex-wrap gap-2">
        <Tag disabled>Disabled Default</Tag>
        <Tag variant="primary" disabled>Disabled Primary</Tag>
        <Tag variant="success" disabled closable>Disabled Success</Tag>
      </div>

      <h2 className="text-xl font-bold">Tag Combinations 标签组合</h2>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-2 mb-4">
          <Tag variant="primary">Technology</Tag>
          <Tag variant="secondary">Framework</Tag>
          <Tag variant="success">Library</Tag>
          <Tag variant="info">Language</Tag>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag variant="warning">Beta</Tag>
          <Tag variant="error">Deprecated</Tag>
          <Tag variant="info">Experimental</Tag>
          <Tag variant="success">Stable</Tag>
        </div>
      </div>

      <h2 className="text-xl font-bold">Custom Styled Tags 自定义样式标签</h2>
      <div className="flex flex-wrap gap-2">
        <Tag className="bg-gradient-to-r from-purple-400 to-pink-400 text-white border-0">
          Gradient
        </Tag>
        <Tag className="bg-black text-white border-black">
          Dark Theme
        </Tag>
        <Tag className="bg-transparent text-blue-600 border-blue-600">
          Outline Style
        </Tag>
        <Tag className="rounded-sm">Square Corners</Tag>
        <Tag className="rounded-full">Round</Tag>
      </div>

      <h2 className="text-xl font-bold">Tag Cloud 标签云</h2>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-2 justify-center">
          {['JavaScript', 'CSS', 'HTML', 'Node.js', 'Express', 'MongoDB', 'Python', 'Django', 'Flask', 'Java', 'Spring', 'React', 'Vue', 'Angular', 'Svelte', 'GraphQL', 'REST', 'API', 'Database', 'Backend', 'Frontend', 'Fullstack'].map((tech, index) => (
            <Tag 
              key={index} 
              variant={index % 7 === 0 ? 'primary' : 
                      index % 7 === 1 ? 'secondary' : 
                      index % 7 === 2 ? 'success' : 
                      index % 7 === 3 ? 'warning' : 
                      index % 7 === 4 ? 'error' : 
                      index % 7 === 5 ? 'info' : 'default'}
              size={index % 3 === 0 ? 'sm' : index % 3 === 1 ? 'md' : 'lg'}
            >
              {tech}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
}