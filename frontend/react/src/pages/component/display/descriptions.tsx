// src/pages/component/display/descriptions.tsx
import { Descriptions, DescriptionsItem } from "@/components/ext/descriptions";

export default function DescriptionsDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Horizontal Layout (Default) 水平布局（默认）</h2>
      <div className="w-full max-w-4xl">
        <Descriptions title="User Info" column={3}>
          <DescriptionsItem label="Username">zhangsan</DescriptionsItem>
          <DescriptionsItem label="Telephone">18100000000</DescriptionsItem>
          <DescriptionsItem label="Live">Hangzhou, Zhejiang</DescriptionsItem>
          <DescriptionsItem label="Address">West Lake District, Hangzhou</DescriptionsItem>
          <DescriptionsItem label="Remark">None</DescriptionsItem>
          <DescriptionsItem label="Email">zhangsan@example.com</DescriptionsItem>
        </Descriptions>
      </div>

      <h2 className="text-xl font-bold">Vertical Layout 垂直布局</h2>
      <div className="w-full max-w-4xl">
        <Descriptions title="User Info" layout="vertical" column={3} bordered>
          <DescriptionsItem label="Username">zhangsan</DescriptionsItem>
          <DescriptionsItem label="Telephone">18100000000</DescriptionsItem>
          <DescriptionsItem label="Live">Hangzhou, Zhejiang</DescriptionsItem>
          <DescriptionsItem label="Address">West Lake District, Hangzhou</DescriptionsItem>
          <DescriptionsItem label="Remark">None</DescriptionsItem>
          <DescriptionsItem label="Email">zhangsan@example.com</DescriptionsItem>
        </Descriptions>
      </div>

      <h2 className="text-xl font-bold">Span Across Columns 跨列示例</h2>
      <div className="w-full max-w-4xl">
        <Descriptions title="Project Details" layout="vertical" column={4} bordered>
          <DescriptionsItem label="Project Name" span={2}>My Awesome Project</DescriptionsItem>
          <DescriptionsItem label="Start Date">2023-01-01</DescriptionsItem>
          <DescriptionsItem label="End Date">2023-12-31</DescriptionsItem>
          <DescriptionsItem label="Description" span={4}>
            This is a comprehensive project that involves multiple teams and technologies. 
            The project aims to deliver a high-quality solution to meet customer needs.
          </DescriptionsItem>
          <DescriptionsItem label="Team Lead">John Doe</DescriptionsItem>
          <DescriptionsItem label="Status" span={2} className="text-green-600">Completed</DescriptionsItem>
          <DescriptionsItem label="Budget">$50,000</DescriptionsItem>
        </Descriptions>
      </div>

      <h2 className="text-xl font-bold">Mixed Span and Layout 混合跨列和布局</h2>
      <div className="w-full max-w-4xl">
        <Descriptions title="System Info" layout="horizontal" column={4} bordered>
          <DescriptionsItem label="OS">Ubuntu 20.04 LTS</DescriptionsItem>
          <DescriptionsItem label="CPU" span={2}>Intel Core i7-10700K</DescriptionsItem>
          <DescriptionsItem label="Memory">32GB DDR4</DescriptionsItem>
          <DescriptionsItem label="Disk" span={4}>1TB NVMe SSD</DescriptionsItem>
          <DescriptionsItem label="GPU">NVIDIA RTX 3080</DescriptionsItem>
          <DescriptionsItem label="Network">Gigabit Ethernet</DescriptionsItem>
          <DescriptionsItem label="Monitor" span={2}>27" 4K Display</DescriptionsItem>
        </Descriptions>
      </div>

      <h2 className="text-xl font-bold">Vertical Layout with Span 垂直布局跨列</h2>
      <div className="w-full max-w-4xl">
        <Descriptions title="Order Summary" layout="vertical" column={3} bordered>
          <DescriptionsItem label="Order ID">ORD-2023-001</DescriptionsItem>
          <DescriptionsItem label="Customer">John Smith</DescriptionsItem>
          <DescriptionsItem label="Date">2023-04-24</DescriptionsItem>
          <DescriptionsItem label="Items" span={3}>
            <ul className="list-disc pl-5">
              <li>Product A - $29.99 x 2</li>
              <li>Product B - $49.99 x 1</li>
              <li>Product C - $19.99 x 3</li>
            </ul>
          </DescriptionsItem>
          <DescriptionsItem label="Subtotal">$149.94</DescriptionsItem>
          <DescriptionsItem label="Tax">$12.00</DescriptionsItem>
          <DescriptionsItem label="Total" className="text-lg font-bold text-blue-600">$161.94</DescriptionsItem>
        </Descriptions>
      </div>
    </div>
  );
}