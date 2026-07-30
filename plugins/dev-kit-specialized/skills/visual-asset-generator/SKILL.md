---
name: visual-asset-generator
description: Use when the task involves generating visual assets — app icons, favicons, OG images, logos, wordmarks, social media banners, or crafting an image-generation prompt for any of these.
---

# Visual Asset Generator

Knowledge pack for producing production-ready visual assets by crafting precise prompts and routing them through whatever image-generation tool is available in the session — an installed MCP image-generation server, or a chat-native image tool.

## Workflow

1. Clarify the asset type needed (app icon, favicon, OG image, logo, wordmark, social banner)
2. Extract brand context from `docs/global/design/DESIGN.md`, the project README, or a provided description
3. Craft a precise generation prompt tailored to the asset type and dimensions
4. Generate the asset with the available image-generation tool, selecting the model/quality tier the tool exposes
5. Deliver the asset to the correct project directory with the correct filename convention

## Asset Type Checklist

- App icons: 1024×1024px, transparent background, simple shape, works at 16px
- Favicons: 32×32px or 64×64px, high contrast, recognizable silhouette
- OG images: 1200×630px, includes project name, no small text
- Logos: SVG preferred, wordmark variant included
- Social banners: 1500×500px (Twitter/X), 1128×191px (LinkedIn)

## Prompt Engineering Principles

- Lead with style adjectives before subject
- Include lighting, medium, color palette in every prompt
- Avoid photorealistic for UI assets — prefer flat, vector-style, or isometric
- Specify "isolated on transparent background" for icons

## Setup

Check the session for a configured image-generation MCP server before starting. If none is available, skip straight to the fallback below rather than asking the user to install one.

## Fallback

If no image-generation tool is available, output a detailed prompt the user can paste into any image-generation interface.
