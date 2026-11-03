"use client";

import { ArcRotateCamera, Color3, Engine, HemisphericLight, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 示例：
 * - Babylon.js 3D 场景
 * - 可点击按钮生成随机颜色/位置的立方体
 * - 展示 Babylon 在 React 中的正确生命周期用法
 */
export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. 创建引擎和场景
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    engineRef.current = engine;
    sceneRef.current = scene;

    // 2. 相机（可拖拽旋转）
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 3,
      12,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // 3. 光源
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // 4. 地面
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 20, height: 20 },
      scene
    );
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    ground.material = groundMat;

    // 5. 初始立方体
    spawnBox();

    // 6. 渲染循环
    engine.runRenderLoop(() => {
      scene.render();
    });

    // 7. 自适应窗口
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  /**
   * 生成一个随机立方体
   */
  const spawnBox = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    const box = MeshBuilder.CreateBox(
      "box",
      { size: 1 },
      scene
    );

    box.position = new Vector3(
      (Math.random() - 0.5) * 8,
      0.5,
      (Math.random() - 0.5) * 8
    );

    const mat = new StandardMaterial("boxMat", scene);
    mat.diffuseColor = Color3.Random();
    box.material = mat;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Babylon.js Playground</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={spawnBox}>生成随机立方体</Button>
        </div>
        <canvas
          ref={canvasRef}
          className="w-full h-[500px] rounded-xl border"
        />
      </CardContent>
    </Card>
  );
}
