---
name: visual-asset-generator
description: Use when the task involves generating visual assets — app icons, favicons, OG images, logos, wordmarks, social media banners, image-generation prompt crafting, the prompt-to-asset MCP server.
---

# Visual Asset Generator

Knowledge pack for producing production-ready visual assets by crafting precise prompts and routing them through the prompt-to-asset MCP server, which spans 30+ image generation models including Stable Diffusion, FLUX, and free-tier providers.

## Workflow

1. Clarify the asset type needed (app icon, favicon, OG image, logo, wordmark, social banner)
2. Extract brand context from DESIGN.md, README, or provided description
3. Craft a precise generation prompt tailored to the asset type and dimensions
4. Use prompt-to-asset to generate the asset, selecting the appropriate model tier
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

Install prompt-to-asset if not present:
```bash
npm install -g prompt-to-asset
```

## Fallback

If the MCP is unavailable, output a detailed prompt the user can paste into any image generation interface.
