---
title: Unity Shader 入门（七）：模型描边Shader
date: 2020/5/5
toc: true 
categories: Shader
tags: Shader
catalog: true
header-img: header.jpg
---

## 前言

前面几篇我们写了几个边缘发光的shader，另外一个类似功能的就是模型描边，和边缘发光不同的地方在于，描边是在原有模型的基础上，添加一圈的外框。

老规矩还是来看一下效果图：

![模型描边](shader-learning7/1.png)
<!-- more -->
## 实现原理

利用两个Pass来绘制：

- 第一个Pass将所有表面延展模型，挤出一点点并只输出描边的颜色
- 第二个Pass就是进行正常的着色工作

## Shader代码

```C++
Shader "Kurong/NPR/Outline"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Texture", 2D) = "white" {}
        _OutlineRange ("Outline Range", Range(0,0.5)) = 0.1
        _OutlineColor("Outline Color", Color) = (1,1,1,1)
    }
    SubShader
    {
        Pass
        {
            Tags { "RenderType"="Opaque" }
            LOD 200
            ZWrite Off

            CGPROGRAM

            #pragma vertex vert

            #pragma fragment frag

            #include "UnityCG.cginc"

            float _OutlineRange;
            float4 _OutlineColor;

            struct a2v
            {
                float4 vertex : POSITION;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
            };

            v2f vert (a2v v)
            {
                v.vertex.xyz += _OutlineRange * normalize(v.vertex.xyz);
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                return o;
            }

            fixed4 frag (v2f v) : Color
            {
                return _OutlineColor;
            }
            ENDCG
        }

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows

        sampler2D _MainTex;
        fixed4 _Color;

        struct Input
        {
            float2 uv_MainTex;
        };

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color;
             o.Albedo = c.rgb;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

## 第一个Pass

```C++
        Pass
        {
            Tags { "RenderType"="Opaque" }
            LOD 200
            ZWrite Off

            CGPROGRAM

            #pragma vertex vert

            #pragma fragment frag

            #include "UnityCG.cginc"

            float _OutlineRange;
            float4 _OutlineColor;

            struct a2v
            {
                float4 vertex : POSITION;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
            };

            v2f vert (a2v v)
            {
                v.vertex.xyz += _OutlineRange * normalize(v.vertex.xyz);
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                return o;
            }

            fixed4 frag (v2f v) : Color
            {
                return _OutlineColor;
            }
            ENDCG
        }
```

### 结构体定义

```C++
            struct a2v
            {
                float4 vertex : POSITION;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
            };
```

经过上一篇的学习，应该对结构体比较熟悉了：

#### a2v ：包含顶点着色器要的模型数据

- float4 vertex : POSITION; 用模型顶点的坐标填充vertex变量。

#### v2f ：用于顶点着色器和片元着色器之间传递信息

- float4 pos : SV_POSITION; 用裁剪空间的位置信息填充pos变量

### 顶点着色器

```C++
            v2f vert (a2v v)
            {
                v.vertex.xyz += _OutlineRange * normalize(v.vertex.xyz);
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                return o;
            }
```

- v.vertex.xyz += _OutlineRange * normalize(v.vertex.xyz); 将顶点的xyz单位化后和定义的 _OutlineRange 相乘，使得模型挤出 _OutlineRange 的距离
- UnityObjectToClipPos(v.vertex); 将模型空间的顶点信息转换到裁剪空间中的位置信息，然后将信息存储在o.pos中。

### 片元着色器

```C++
            fixed4 frag (v2f v) : Color
            {
                return _OutlineColor;
            }
```

直接输出描边颜色

## 第二个Pass

```C++
        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows

        sampler2D _MainTex;
        fixed4 _Color;

        struct Input
        {
            float2 uv_MainTex;
        };

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Alpha = c.a;
        }
        ENDCG
```

这里注意：surface shader是对vertex shader 和 fragment shader的更高一层的包装，不需要我们再去编写Pass了，直接编写 CGPROGRAM 。
