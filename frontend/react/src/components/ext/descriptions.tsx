// src/components/ext/descriptions.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface DescriptionsProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  bordered?: boolean;
  column?: number; // 每行显示的项目数量
  size?: 'default' | 'small';
  layout?: 'horizontal' | 'vertical'; // 布局方向
  children: React.ReactNode;
}

interface DescriptionsItemProps {
  label?: string;
  children?: React.ReactNode;
  className?: string;
  span?: number; // 跨越的列数，默认为1
}

const Descriptions = React.forwardRef<HTMLDivElement, DescriptionsProps>(
  ({ title, bordered = false, column = 3, size = 'default', layout = 'horizontal', className, children, ...props }, ref) => {
    const items = React.Children.toArray(children) as React.ReactElement<DescriptionsItemProps>[];

    // 将items按照span值和column限制进行分组
    const rows: React.ReactElement<DescriptionsItemProps>[][] = [];
    let currentRow: React.ReactElement<DescriptionsItemProps>[] = [];
    let currentRowSpan = 0;

    items.forEach(item => {
      const span = item.props.span || 1;
      
      if (currentRowSpan + span <= column) {
        currentRow.push(item);
        currentRowSpan += span;
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [item];
        currentRowSpan = span;
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        
        <div className={`border ${bordered ? 'border' : 'border-transparent'} rounded-lg overflow-hidden`}>
          <table className="w-full">
            <tbody>
              {rows.map((row, rowIndex) => {
                return (
                  <tr 
                    key={rowIndex} 
                    className={bordered && rowIndex < rows.length - 1 ? 'border-b' : ''}
                  >
                    {row.map((item, itemIndex) => {
                      if (React.isValidElement(item)) {
                        const { label, children: content, className: itemClassName, span = 1 } = item.props;
                        
                        // 计算每个单元格的宽度百分比
                        const cellWidthPercentage = `${(span / column) * 100}%`;
                        
                        if (layout === 'vertical') {
                          // 垂直布局：标签在上，内容在下
                          return (
                            <td 
                              key={itemIndex}
                              colSpan={span}
                              className={cn(
                                "py-2 px-4 align-top",
                                bordered ? "border-r last:border-r-0 bg-gray-50" : "",
                                size === 'small' ? "text-sm py-1 px-2" : "text-base py-2 px-4",
                                itemClassName
                              )}
                              style={{ width: cellWidthPercentage }}
                            >
                              <div className="font-medium text-gray-500 mb-1">{label}</div>
                              <div>{content}</div>
                            </td>
                          );
                        } else {
                          // 水平布局：标签和内容在同一行
                          return (
                            <React.Fragment key={itemIndex}>
                              <td 
                                className={cn(
                                  "py-2 px-4 align-top font-medium text-gray-500",
                                  bordered ? "border-r bg-gray-50" : "",
                                  size === 'small' ? "text-sm py-1 px-2" : "text-base py-2 px-4",
                                  itemClassName
                                )}
                                style={{ width: `${(span / (column * 2)) * 100}%` }}
                              >
                                {label}
                              </td>
                              <td 
                                className={cn(
                                  "py-2 px-4 align-top",
                                  bordered ? "border-r" : "",
                                  size === 'small' ? "text-sm py-1 px-2" : "text-base py-2 px-4",
                                  itemClassName
                                )}
                                style={{ width: `${(span / (column * 2)) * 100}%` }}
                              >
                                {content}
                              </td>
                            </React.Fragment>
                          );
                        }
                      }
                      return null;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);
Descriptions.displayName = "Descriptions";

const DescriptionsItem: React.FC<DescriptionsItemProps> = () => {
  // 这是一个占位组件，实际内容在父组件中处理
  return null;
};
DescriptionsItem.displayName = "DescriptionsItem";

export { Descriptions, DescriptionsItem };