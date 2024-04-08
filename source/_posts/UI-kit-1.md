---
title: UGUI优化：图片格式
date: 2021-02-19
categories: UGUI
tags: 优化
catalog: true
header-img: header.jpg
---

## 图片压缩

Android平台下：
+ 不带透明通道优先选择：ETC1
+ 带透明通道优先选择：ETC2
+ 上面两种呈现的质量不够的话：RGBA16
+ 优先顺序是ETC1 > ETC2 > RGBA16 > RGBA32
<!--more-->
IOS平台下：
+ 优先选择：PVRTC
+ 其次选择：ASTC
+ 不带透明通道可以使用ASTC 5X5
+ 带透明通道可以使用ASTC 4X4

占用内存越小的贴图，以1024X1024的贴图为例：
+ RGBA32 Bit：每个像素占用32位4字节，内存大小是1024 x 1024 x 4 = 4M
+ RGBA16 Bit：每个像素占用16位2字节，内存大小是1024 x 1024 x 2 = 2M
+ RGB ETC1 4Bit：每个像素占用4位0.5字节，内存大小是1024 x 1024 x 0.5 = 0.5M
+ RGB ETC2 8Bit：每个像素占用8位1字节，内存大小是1024 x 1024 x 1 = 1M
+ RGBA PVRTC 4Bit：每个像素占用4位0.5字节，内存大小是1024 x 1024 x 0.5 = 0.5M
+ RGBA ASTC 4X4：每个像素占用8位1字节，内存大小是1024 x 1024 x 1 = 1M

## 批量设置

实际项目中不会每张图片都手动设置，可以用脚本自动化处理每张图片的压缩格式

```C++
using UnityEditor;
public class TextureImport : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        if (assetPath.Contains("Assets"))
        {
            TextureImporter textureImporter = AssetImporter.GetAtPath(assetPath) as TextureImporter;
            textureImporter.textureType = TextureImporterType.Sprite;/
            textureImporter.mipmapEnabled = false;

            //设置各平台的压缩格式
            TextureImporterPlatformSettings settings = new TextureImporterPlatformSettings();
            settings.overridden = true;
            settings.name = "iPhone";
            settings.format = TextureImporterFormat.ASTC_RGBA_4x4;
            textureImporter.SetPlatformTextureSettings(settings);
        }
    }
}
```