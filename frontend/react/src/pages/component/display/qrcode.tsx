// src/pages/component/display/qrcode.tsx
import { QRCode } from "@/components/ext/qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function QRCodeDemo() {
  const [inputValue, setInputValue] = useState("https://example.com");
  const [size, setSize] = useState(128);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic QRCode 基础二维码</h2>
      <div className="flex flex-wrap gap-6 justify-center">
        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Default</CardTitle>
            <CardDescription>Basic QRCode</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" />
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Custom Size</CardTitle>
            <CardDescription>Large QRCode</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" size={200} />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Color Variants 颜色变体</h2>
      <div className="flex flex-wrap gap-6 justify-center">
        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Red QRCode</CardTitle>
            <CardDescription>Red foreground color</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" fgColor="#EF4444" />
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Blue QRCode</CardTitle>
            <CardDescription>Blue foreground color</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" fgColor="#3B82F6" />
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Green QRCode</CardTitle>
            <CardDescription>Green foreground color</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" fgColor="#10B981" />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Background Colors 背景颜色</h2>
      <div className="flex flex-wrap gap-6 justify-center">
        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Black Background</CardTitle>
            <CardDescription>White foreground on black</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-4 bg-black rounded-lg">
            <QRCode value="https://example.com" fgColor="#FFFFFF" bgColor="#000000" />
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Yellow Background</CardTitle>
            <CardDescription>Black foreground on yellow</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-4 bg-yellow-200 rounded-lg">
            <QRCode value="https://example.com" fgColor="#000000" bgColor="#FEF3C7" />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Different Sizes 不同尺寸</h2>
      <div className="flex flex-wrap gap-8 justify-center items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Small (64x64)</span>
          <QRCode value="https://example.com" size={64} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Medium (128x128)</span>
          <QRCode value="https://example.com" size={128} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Large (200x200)</span>
          <QRCode value="https://example.com" size={200} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Extra Large (300x300)</span>
          <QRCode value="https://example.com" size={300} />
        </div>
      </div>

      <h2 className="text-xl font-bold">Dynamic QRCode 动态二维码</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-96">
          <CardHeader>
            <CardTitle>Customize QRCode</CardTitle>
            <CardDescription>Adjust properties dynamically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter URL"
              />
            </div>
            <div>
              <Label htmlFor="size">Size: {size}px</Label>
              <Input
                id="size"
                type="range"
                min="64"
                max="300"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fgColor">Foreground Color</Label>
                <Input
                  id="fgColor"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bgColor">Background Color</Label>
                <Input
                  id="bgColor"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={() => navigator.clipboard.writeText(inputValue)}>
              Copy URL
            </Button>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
          <QRCode 
            value={inputValue} 
            size={size} 
            fgColor={fgColor} 
            bgColor={bgColor} 
          />
        </div>
      </div>

      <h2 className="text-xl font-bold">QRCode with Margin 带边距的二维码</h2>
      <div className="flex flex-wrap gap-6 justify-center">
        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>Without Margin</CardTitle>
            <CardDescription>Tight to edges</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" size={150} />
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardHeader className="items-center">
            <CardTitle>With Margin</CardTitle>
            <CardDescription>Includes white margin</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" size={150} includeMargin={true} />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Common Use Cases 常见应用场景</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Website Link</CardTitle>
            <CardDescription>Share your website easily</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="https://example.com" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
            <CardDescription>VCard or contact details</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="MECARD:N:John Doe;TEL:+1234567890;EMAIL:john@example.com;;" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WiFi Credentials</CardTitle>
            <CardDescription>Easy WiFi connection</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCode value="WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}