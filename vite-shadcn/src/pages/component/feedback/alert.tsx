// src/pages/component/feedback/alert.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const AlertDemo = () => {
  return (
    <div className="space-y-10 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Alert / 警告提示</h1>
        <p className="text-muted-foreground mt-2">
          警告提示，展现需要关注的信息 / Alert component to display important information that requires attention.
        </p>
      </div>

      {/* 基础用法 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Usage / 基础用法</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the cli.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* 不同类型 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Types / 不同类型</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>Information / 信息</AlertTitle>
            <AlertDescription>
              This is an informational message / 这是一条信息提示消息
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error / 错误</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again. / 您的会话已过期，请重新登录。
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success / 成功</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully. / 您的更改已成功保存。
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning / 警告</AlertTitle>
            <AlertDescription>
              This action cannot be undone. Please proceed with caution. / 此操作无法撤消，请谨慎操作。
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* 带图标的警告 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">With Icons / 带图标警告</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Success / 成功</AlertTitle>
            <AlertDescription>
              Operation completed successfully! / 操作已成功完成！
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Error / 错误</AlertTitle>
            <AlertDescription>
              An error occurred during the operation. / 操作过程中发生错误。
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* 可关闭的警告 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Closable Alerts / 可关闭警告</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-4">
            <div className="relative">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Notice / 注意</AlertTitle>
                <AlertDescription>
                  This alert can be closed by clicking the close button. / 此警报可通过单击关闭按钮关闭。
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </Alert>
            </div>
            
            <div className="relative">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Warning / 警告</AlertTitle>
                <AlertDescription>
                  Critical system warning. Please take immediate action. / 系统严重警告，请立即采取行动。
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </Alert>
            </div>
          </div>
        </div>
      </section>

      {/* 简化版本 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Simple Version / 简化版本</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <Alert>
            <AlertDescription>
              Simple alert without title / 无标题的简单警报
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertDescription>
              Simple error message without title / 无标题的简单错误消息
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* 长文本示例 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Long Text / 长文本</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Detailed Information / 详细信息</AlertTitle>
            <AlertDescription>
              This is a longer description that demonstrates how alerts handle extended content. 
              Alerts can contain multiple lines of text, and they will adapt to the content height. 
              这是一个较长的描述，演示了警报如何处理扩展内容。警报可以包含多行文本，
              并且它们会适应内容高度。This allows for more detailed information to be presented 
              to the user in a clear and organized manner.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    </div>
  );
};

export default AlertDemo;