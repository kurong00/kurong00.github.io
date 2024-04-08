---
title: Unity Shader 入门（六）：边缘发光透明版
date: 2020/5/4
toc: true 
categories: Shader
tags: Shader
catalog: true
header-img: header.jpg
---

## 前言

之前我们写过一个[边缘发光](https://chenwenling.cn/2019/05/02/shader-learning4/#more)的Shader，这一次我们来写这个的升级版：透明物体的边缘发光。

## 效果图

首先我们还是来看一下效果图：
![边缘发光透明版](shader-learning6/1.png)
<!--more-->
## Shader代码

```C++
Shader "Kurong/Rim/RimLightingTranslucent"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _AlphaRange("Alpha Range",Range(0,1)) = 0
        _RimColor("Rim Color",Color) = (1,1,1,1)
    }
    SubShader
    {
        Pass
        {
            Tags { "Queue" = "Transparent" "RenderType" = "Transparent" "IngoreProject" = "True"}
            LOD 200
            ZWrite Off
            Blend SrcAlpha OneMinusSrcAlpha

            CGPROGRAM

            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            sampler2D _NormalMap;
            float _AlphaRange;
            float4 _RimColor;
            fixed4 _Color;

            struct a2v
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float3 normalDir : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
            };

            v2f vert (a2v v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.normalDir = UnityObjectToWorldNormal(v.normal);
                o.worldPos = mul(unity_ObjectToWorld,v.vertex).xyz;
                return o;
            }

            fixed4 frag (v2f v) : COLOR
            {
                float3 viewDir = normalize(_WorldSpaceCameraPos - v.worldPos);
                float normalDotViewDir = saturate(dot(normalize(v.normalDir),viewDir));
                fixed3 diffuse = normalDotViewDir *_Color;
                return fixed4(diffuse + _RimColor ,(1 - normalDotViewDir) * (1 - _AlphaRange) + _AlphaRange);
            }
            ENDCG
        }
    }
    FallBack "Diffuse"
}
```

## 透明度混合

上一篇我们了解了透明度混合的原理以及一些[透明效果知识储备](https://chenwenling.cn/2019/05/03/shader-learning5/#more)，而Unity中，为了进行透明度混合，我们需要用到 `Blend` 命令：

语法|描述
:--:|:--:|:--:
Blend Off|关闭混合（这是默认的状态）
Blend SrcFactor DstFactor|开启混合，该片元产生的颜色 `SrcFactor`. 已存在于屏幕的颜色 `DstFactor`，然后将两者叠加在一起存入颜色缓冲。
Blend SrcFactor DstFactor, SrcFactorA DstFactorA|原理同上，不过使用了不同的混合因子
BlendOp Op|不同于上面的颜色混合，而是使用[Blend Operation](https://docs.unity3d.com/2019.2/Documentation/Manual/SL-Blend.html)来对它们进行操作
BlendOp OpColor, OpAlpha|原理同上，不过采用不同的Blend Operation来操作Color和Alpha的通道

混合因子：

名称|描述
:--:|:--:|:--:
One|因子为1，表示让源颜色或者目标颜色通过
Zero|因子为0，用来删除源颜色或者目标颜色
SrcColor|因子为源颜色
SrcAlpha|因子为源颜色的透明度
DstColor|因子为目标颜色
DstAlpha|因子为目标颜色的透明度
OneMinusSrcColor|因子为 (1 - 源颜色) 的值
OneMinusSrcAlpha|因子为 (1 - 源颜色的透明度) 的值
OneMinusDstColor|因子为 (1 - 目标颜色) 的值
OneMinusDstAlpha|因子为 (1 - 目标颜色的透明度) 的值

此时我们再来看上面这一块代码：

```C++
Tags{
        Tags { "Queue" = "Transparent" "RenderType" = "Transparent" "IngoreProject" = "True"}
        LOD 200
        ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha
```

这里有一些新的知识：之前提过半透明物体的渲染序列要设置成 `"Queue" = "Transparent"` ,而 `"RenderType" = "Transparent"` 表示我们使用了透明度混合。`"IngoreProject" = "True"` 表示这个Shader不会受投射器的影响；通常使用了透明度混合的Shader Tags都包含这三条。

我们在上一篇介绍过为什么透明度混合需要关闭深度写入

```C++
ZWrite Off
```

这里我们将源颜色的混合因子设置成`SrcAlpha`，将目标颜色的混合因子设置成 `OneMinusSrcAlpha` 以得到半透明效果。

```C++
Blend SrcAlpha OneMinusSrcAlpha
```

## 结构体定义

```C++
            struct a2v
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float3 normalDir : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
            };
```

### a2v ：包含顶点着色器要的模型数据

- float4 vertex : POSITION; 用模型顶点的坐标填充vertex变量。
- float3 normal : NORMAL; 用模型空间的法线方向向量填充normal变量

### v2f ：用于顶点着色器和片元着色器之间传递信息

- float4 pos : SV_POSITION; 用裁剪空间的位置信息填充pos变量
- float3 normalDir : TEXCOORD0; 用模型的第一套纹理坐标填充normalDir变量
- float3 worldPos : TEXCOORD1; 用模型的第二套纹理坐标填充worldPos变量

## 顶点着色器

```C++
            v2f vert (a2v v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.normalDir = UnityObjectToWorldNormal(v.normal);
                o.worldPos = mul(unity_ObjectToWorld,v.vertex).xyz;
                return o;
            }
```

- UnityObjectToClipPos(v.vertex); 将模型空间的顶点信息转换到裁剪空间中的位置信息，然后将信息存储在o.pos中。
- UnityObjectToWorldNormal(v.normal); 法线从模型空间变换到世界空间中并计算物体在世界空间中的法线坐标。
- mul(unity_ObjectToWorld,v.vertex).xyz; 将顶点从模型空间转换到世界空间的信息存储到worldPos变量中。

## 片元着色器

```C++
            fixed4 frag (v2f v) : COLOR
            {
                float3 viewDir = normalize(_WorldSpaceCameraPos - v.worldPos);
                float normalDotViewDir = saturate(dot(normalize(v.normalDir),viewDir));
                fixed3 diffuse = normalDotViewDir *_Color;
                return fixed4(diffuse + _RimColor ,(1 - normalDotViewDir) * (1 - _AlphaRange) + _AlphaRange);
            }
```

- fixed4 frag( v2f v ):COLOR 我们注意到片元着色器的后面跟着 `: COLOR` ：这是Unity提供的Cg/HLSL语义。语义可以告诉shader数据的来源以及数据的输出。
- float3 viewDir = normalize(_WorldSpaceCameraPos - v.worldPos); 这里我们用 `对象在世界坐标系中的位置` 减去 `摄像机的世界空间位置` ，并进行逐顶点归一化，赋给视线的方向
- float normalDotViewDir = saturate(dot(normal,viewDir)); 我们获得法线与视线的夹角
- fixed3 diffuse = normalDotViewDir *_Color; 这里我们视线与法线的夹角和主颜色相乘。
- return fixed4(diffuse + _RimColor ,(1 - normalDotViewDir) * (1 - _AlphaRange) + _AlphaRange); 最后将混合后的颜色输出。

## 结语

描边常用于一些漫画风格的游戏场景中，能够在复杂的场景中突出被绘制的物体，下一篇我们就写物体描边的shader。
