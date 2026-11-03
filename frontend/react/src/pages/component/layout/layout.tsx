import { Content, Footer, Header, Layout, LayoutSection, Sider } from "@/components/ext/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function LayoutPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [controlledCollapsed, setControlledCollapsed] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Layout 组件 / Layout Component</h1>
      <p className="text-lg text-muted-foreground">
        布局组件用于构建页面的整体框架结构，包含头部、侧边栏、内容区和底部。
        <span className="block mt-1 text-sm">
          Layout component is used to build the overall framework structure of a page, including header, sidebar, content area, and footer.
        </span>
      </p>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>基础布局示例 / Basic Layout Example</CardTitle>
        </CardHeader>
        <CardContent>
          <Layout>
            <Header className="bg-primary text-primary-foreground">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">我的应用 / My Application</h1>
              </div>
            </Header>

            <LayoutSection hasSider={true}>
              <Sider
                collapsible={true}
                collapsed={collapsed}
                onCollapseChange={setCollapsed}
                className="bg-secondary"
              >
                <div className="p-4 space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    首页 / Home
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    用户管理 / User Management
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    设置 / Settings
                  </Button>
                </div>
              </Sider>

              <Content>
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">主内容区域 / Main Content Area</h2>
                  <p>
                    这是主要内容区域，可以根据需要放置各种组件和内容。
                    <span className="block mt-1">This is the main content area where various components and content can be placed as needed.</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((item) => (
                      <Card key={item}>
                        <CardContent className="p-6">
                          <p>卡片内容 {item} / Card Content {item}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </Content>
            </LayoutSection>

            <Footer>
              <div className="text-center text-sm text-muted-foreground">
                © 2025 MyApp - 版权所有 / © 2025 MyApp - All Rights Reserved
              </div>
            </Footer>
          </Layout>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>受控折叠示例 / Controlled Collapse Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={() => setControlledCollapsed(!controlledCollapsed)}
              >
                {controlledCollapsed ? '展开 / Expand' : '折叠 / Collapse'} 侧边栏
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setControlledCollapsed(false)}
              >
                展开 / Expand
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setControlledCollapsed(true)}
              >
                折叠 / Collapse
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Layout>
                <Header className="bg-secondary">
                  <h2 className="text-lg font-medium">受控布局 / Controlled Layout</h2>
                </Header>
                
                <LayoutSection hasSider={true}>
                  <Sider
                    collapsible={true}
                    collapsed={controlledCollapsed}
                    onCollapseChange={setControlledCollapsed}
                    className="bg-muted"
                  >
                    <div className="p-4 space-y-2">
                      <Button variant="ghost" className="w-full justify-start">
                        导航项 1 / Navigation Item 1
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        导航项 2 / Navigation Item 2
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        导航项 3 / Navigation Item 3
                      </Button>
                    </div>
                  </Sider>

                  <Content>
                    <p>
                      这是一个使用受控折叠状态的侧边栏示例。
                      <span className="block mt-1">This is an example of a sidebar using controlled collapse state.</span>
                    </p>
                    <p>
                      可以通过外部按钮控制侧边栏的折叠/展开状态。
                      <span className="block mt-1">The collapse/expand state of the sidebar can be controlled by external buttons.</span>
                    </p>
                  </Content>
                </LayoutSection>
              </Layout>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自定义图标示例 / Custom Icon Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border rounded-lg overflow-hidden max-w-2xl mx-auto">
              <Layout>
                <Header className="bg-secondary">
                  <div className="flex items-center gap-2">
                    <span>自定义图标示例 / Custom Icon Example</span>
                    <span className="text-xs text-muted-foreground">(默认方向 / Default Direction)</span>
                  </div>
                </Header>
                
                <LayoutSection hasSider={true}>
                  <Sider
                    collapsible={true}
                    collapseIcon={<ChevronLeft className="h-4 w-4" />}
                    expandIcon={<ChevronRight className="h-4 w-4" />}
                    className="bg-muted"
                  >
                    <div className="p-4 space-y-2">
                      <Button variant="ghost" className="w-full justify-start">
                        菜单项 1 / Menu Item 1
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        菜单项 2 / Menu Item 2
                      </Button>
                    </div>
                  </Sider>

                  <Content>
                    <p>
                      默认方向：折叠时显示左箭头，展开时显示右箭头。
                      <span className="block mt-1">Default direction: shows left arrow when collapsed, right arrow when expanded.</span>
                    </p>
                  </Content>
                </LayoutSection>
              </Layout>
            </div>

            <div className="border rounded-lg overflow-hidden max-w-2xl mx-auto">
              <Layout>
                <Header className="bg-secondary">
                  <div className="flex items-center gap-2">
                    <span>反向箭头示例 / Reverse Arrow Example</span>
                    <span className="text-xs text-muted-foreground">(reverseArrow=true)</span>
                  </div>
                </Header>
                
                <LayoutSection hasSider={true}>
                  <Sider
                    collapsible={true}
                    collapseIcon={<ChevronRight className="h-4 w-4" />}
                    expandIcon={<ChevronLeft className="h-4 w-4" />}
                    reverseArrow={true}
                    className="bg-muted"
                  >
                    <div className="p-4 space-y-2">
                      <Button variant="ghost" className="w-full justify-start">
                        菜单项 1 / Menu Item 1
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        菜单项 2 / Menu Item 2
                      </Button>
                    </div>
                  </Sider>

                  <Content>
                    <p>
                      反向箭头：折叠时显示右箭头，展开时显示左箭头。
                      <span className="block mt-1">Reverse arrow: shows right arrow when collapsed, left arrow when expanded.</span>
                    </p>
                  </Content>
                </LayoutSection>
              </Layout>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg overflow-hidden">
                <Layout>
                  <Header className="bg-secondary">
                    <span className="text-sm">圆形图标 / Circular Icons</span>
                  </Header>
                  
                  <LayoutSection hasSider={true}>
                    <Sider
                      collapsible={true}
                      collapseIcon={<div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"><ChevronLeft className="h-3 w-3 text-primary-foreground" /></div>}
                      expandIcon={<div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"><ChevronRight className="h-3 w-3 text-primary-foreground" /></div>}
                      className="bg-muted"
                    >
                      <div className="p-4 space-y-2">
                        <Button variant="ghost" className="w-full justify-start">
                          菜单项 / Menu Item
                        </Button>
                      </div>
                    </Sider>

                    <Content>
                      <p className="text-sm">
                        圆形背景的图标 / Icons with circular background
                      </p>
                    </Content>
                  </LayoutSection>
                </Layout>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Layout>
                  <Header className="bg-secondary">
                    <span className="text-sm">方形图标 / Square Icons</span>
                  </Header>
                  
                  <LayoutSection hasSider={true}>
                    <Sider
                      collapsible={true}
                      collapseIcon={<div className="h-6 w-6 bg-secondary flex items-center justify-center border rounded"><ChevronLeft className="h-3 w-3" /></div>}
                      expandIcon={<div className="h-6 w-6 bg-secondary flex items-center justify-center border rounded"><ChevronRight className="h-3 w-3" /></div>}
                      className="bg-muted"
                    >
                      <div className="p-4 space-y-2">
                        <Button variant="ghost" className="w-full justify-start">
                          菜单项 / Menu Item
                        </Button>
                      </div>
                    </Sider>

                    <Content>
                      <p className="text-sm">
                        方形背景的图标 / Icons with square background
                      </p>
                    </Content>
                  </LayoutSection>
                </Layout>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}