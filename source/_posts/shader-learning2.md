---
title: Unity Shader 入门（二）：Shader介绍
date: 2020/4/29
toc: true 
categories: Shader
tags: Shader
catalog: true
header-img: header.jpg
---

## 什么是Shader

Shader（着色器）：是渲染管线上的一小段程序，它负责将输入的Mesh（网格）以指定的方式和输入的贴图、颜色等组合作用然后输出。Shader开发者要做的就是根据输入，进行计算变换，产生输出。shader大体上可以分为两类：
<!-- more -->
- 顶点着色器（Vertex Shader）
- 片元着色器（Fragment Shader）

而在Unity Shader中分为三类：

- Surface Shaders （表面着色器）：是Unity对Vertex/Fragment Shader的一层包装，可以以极少的代码来完成不同的光照模型与不同平台下需要考虑的事情；缺点是能够实现的效果不如片段着色器来的多。
- Vertex/Fragment Shaders （顶点/片断着色器）
- Fixed Function Shaders （固定管线着色器）：已被淘汰

## 什么是着色语言HLSL、GLSL、Cg

上一篇讲到了很多可编程的着色阶段（例如顶点着色器、片元着色器等等）。之所以称为可编程的着色阶段就是因为可以用一种特定的语言来编写程序，也就是着色语言（Shading language），以下几种常见的着色语言：

|名称|API|优点|缺点|
|:--:|:---|:---|:--|
|HLSL（High Level Shading Language）|Direct3D|因为是由微软控制的着色器编译，因此即使是使用了不同的硬件，同一个着色器编译下的结果也都一样|支持HLSL的平台有限，几乎都是微软的产品（因为别的平台上没有相应的编译器）|
|GLSL（OpenGL Shading Language）|OpenGL|因为没有提供着色编译器，而是由显卡驱动来完成着色器的编译工作，因此具有优秀的跨平台性|编译的结果取决于硬件提供商（GLSL是依赖硬件而不是操作系统层次的）
|Cg（C for Graphic）|/|Cg语言是 OpenGL和 DirectX 的上层，会根据平台的不同编译成不同的中间语言，即 Cg 程序是运行在 OpenGL 和 DirectX 标准顶点和像素着色的基础上的，因此具有真正的跨平台性。因为NVIDIA和微软的合作使得 Cg 和 HLSL 语法非常相像|可能无法发挥出 OpenGL 的最新特性

## 什么是ShaderLab

在Unity中，所有的Shader都是使用ShaderLab来编写的，从结构上来说，它定义了显示一个材质所需要的所有东西，而不仅仅是着色器代码，我们先来看一下ShaderLab的结构

![Figure 1](shader-learning2/1.png)

一个shader包含多个属性（Properties)，然后是一个或多个的子着色器（SubShader)，在实际运行中，哪一个子着色器被使用是由运行的平台所决定的。每一个子着色器中包含一个或者多个的Pass。在计算着色时，平台先选择最优先可以使用的着色器，然后依次运行其中的Pass，然后得到输出的结果。最后指定一个FallBack，用来处理所有Subshader都不能运行的情况,一般FallBack的都是平台已经定义好的shader。

### ShaderLab和着色语言的关系

对于表面着色器和顶点着色器我们可以在 ShaderLab 的 Pass 中的 CGPROGRAM 和 ENDCG 之间嵌套Cg/HLSL。或者在 GLSLPROGRAM 和 ENDGLSL 之间嵌套 GLSL。

```C++
Pass {
    CGPROGRAM
    //一些编译指令，例如：
    #pragma vertex vert
    #pragma fragment frag
    //Cg代码
    ENDCG
 }
```

### ShaderLab的模板

当我们打开Unity，然后在Project面板点击右键，依次从中选择Create/Shader/...发现会有很多的可选项

![Figure 1](shader-learning2/2.png)

- Standard Surface Shader：标准表面着色器，是一种基于物理的着色系统（使用了Physically Based Rendering（简称PBR）技术，即基于物理的渲染技术），以模拟现实真实的方式来模拟材质与灯光之间的关系，可以很轻易的表现出各种金属反光效果，同时此种Shader的书写逻辑也更符合人类的思维模式。
- Unlit Shader：Vertex/Fragment Shader,也就是最基本的顶点片断着色器，不受光照影响的Shader，多用于特效、UI上的效果制作。
- Image Effect Shader：也是顶点片断着色器，只不过是针对后处理而定制的模版，例如调色、景深、模糊等，这些基于最终整个屏幕画面而进行再处理的Shader就是后处理。
- Compute Shader：Compute Shader是运行在图形显卡上的一段程序，独立于常规渲染管线之外的，它可以直接将GPU作为并行处理器加以利用，从而使GPU不仅具有3D渲染能力，还具有其他的运算能力。
- Shader Variant Collection：Shader变体收集器，在上面创建的时候，你会发现Shader Variant Collection与以上四个是被隔开的，就是因为这个与它们不一样，它不是制作Shader的模版，而只是对Shader变体进行打包用的容器。

注：以上的Standard Surface Shader、Unlit Shader、Image Effect Shader仅仅只是Unity为了方便我们书写而内置的几个模版，你完全可以建一个Unlit Shader，然后将其改成Surface Shader,同样也可以将一个Standard Surface Shader改成顶点片断着色器。

## Shader和Material的关系

由于在Unity中Shader就是运行在图形显卡上的一段包含指令的代码，所以我们需要再创建一个材质来关联它，这样才能把材质赋给场景中的物体来实现我们想要的效果。总结一下Shader与材质的关系：

- 一个Shader可以与无数个材质关联。
- 一个材质同一时刻只能关联于一个Shader。（但是我们可以通过代码去动态改变材质所关联的Shader）
- 材质可以赋与模型，但是Shader不行。
- 材质就像是Shader的实例，每个材质都可以参数不一样呈现不同的效果，但是当Shader改变时，关联它的所有材质都会相应的改变。
