# -*- coding: utf-8 -*-
"""生成造物录站点的占位视觉素材（SVG）。

尺寸约定（与站点 CSS 保持一致，真图也请按这个比例出）：
  - 封面 cover：1600 x 900（16:9）—— 首页卡片与详情页大图共用同一张
  - 画廊 gallery：1200 x 900（4:3）

真实成品图就位后，直接把 assets/media 下的同名文件替换掉即可。
"""
import os
import random

OUT = r"D:\wb\aigc-showcase\assets\media"

COVER = (1600, 900)
SHOT = (1200, 900)

PALETTES = {
    "nocturne": ["#0A1020", "#152238", "#28395C", "#4C6BA8", "#93B7EA", "#E9C46A"],
    "beasts":   ["#F5F0E7", "#E4D6C1", "#C6A87C", "#B4432B", "#2F4A3C", "#17171A"],
    "commerce": ["#FFFFFF", "#F4F4F1", "#DCDCD6", "#B4432B", "#17171A", "#6E6E76"],
}

MOTIF = {"nocturne": "skyline", "beasts": "seal", "commerce": "grid"}


def skyline(rng, pal, W, H):
    parts = []
    horizon = int(H * 0.72)
    for i in range(5):
        y = int(H * 0.12) + i * int(H * 0.12)
        parts.append(
            f'<rect x="0" y="{y}" width="{W}" height="{int(H * 0.12)}" fill="{pal[1 + i % 4]}" '
            f'opacity="{0.10 + i * 0.05:.2f}"/>'
        )
    x = -20
    while x < W + 20:
        bw = rng.randint(int(W * 0.03), int(W * 0.09))
        bh = rng.randint(int(H * 0.13), int(H * 0.47))
        col = pal[rng.choice([1, 2, 2, 3])]
        parts.append(
            f'<rect x="{x}" y="{horizon - bh}" width="{bw}" height="{bh}" fill="{col}" '
            f'opacity="{rng.uniform(0.55, 0.95):.2f}"/>'
        )
        for wy in range(horizon - bh + 18, horizon - 14, 26):
            for wx in range(x + 12, x + bw - 14, 22):
                if rng.random() < 0.34:
                    parts.append(
                        f'<rect x="{wx}" y="{wy}" width="7" height="11" '
                        f'fill="{pal[5]}" opacity="{rng.uniform(0.35, 0.95):.2f}"/>'
                    )
        x += bw + rng.randint(4, 14)
    parts.append(f'<rect x="0" y="{horizon}" width="{W}" height="{H - horizon}" fill="{pal[0]}"/>')
    for _ in range(26):
        rx = rng.randint(0, W)
        rw = rng.randint(30, 160)
        parts.append(
            f'<rect x="{rx}" y="{horizon + rng.randint(6, max(8, H - horizon - 10))}" width="{rw}" height="3" '
            f'fill="{pal[5]}" opacity="{rng.uniform(0.05, 0.28):.2f}"/>'
        )
    parts.append(
        f'<circle cx="{rng.randint(int(W * 0.45), int(W * 0.9))}" cy="{int(H * 0.22)}" '
        f'r="{int(H * 0.095)}" fill="{pal[5]}" opacity="0.16"/>'
    )
    return "".join(parts)


def seal(rng, pal, W, H):
    parts = [f'<rect x="0" y="0" width="{W}" height="{H}" fill="{pal[0]}"/>']
    cx, cy = W // 2, H // 2
    for i in range(9, 0, -1):
        parts.append(
            f'<circle cx="{cx}" cy="{cy}" r="{int(i * min(W, H) * 0.069)}" fill="none" '
            f'stroke="{pal[2]}" stroke-width="{rng.uniform(0.6, 2.2):.2f}" opacity="0.30"/>'
        )
    for _ in range(9):
        x = rng.randint(int(W * 0.05), int(W * 0.75))
        y = rng.randint(int(H * 0.08), int(H * 0.72))
        w = rng.randint(int(W * 0.09), int(W * 0.22))
        h = rng.randint(int(H * 0.10), int(H * 0.26))
        col = pal[rng.choice([3, 3, 4, 2])]
        parts.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rng.randint(6, 46)}" '
            f'fill="{col}" opacity="{rng.uniform(0.16, 0.62):.2f}"/>'
        )
    for _ in range(70):
        parts.append(
            f'<circle cx="{rng.randint(0, W)}" cy="{rng.randint(0, H)}" '
            f'r="{rng.uniform(1.2, 5.5):.1f}" fill="{pal[5]}" opacity="{rng.uniform(0.05, 0.30):.2f}"/>'
        )
    s = int(min(W, H) * 0.122)
    parts.append(
        f'<rect x="{W - s - int(W * 0.05)}" y="{H - s - int(H * 0.09)}" width="{s}" height="{s}" '
        f'rx="8" fill="{pal[3]}" opacity="0.88"/>'
    )
    parts.append(
        f'<rect x="{W - s - int(W * 0.05) + 18}" y="{H - s - int(H * 0.09) + 18}" '
        f'width="{s - 36}" height="{s - 36}" rx="4" fill="none" '
        f'stroke="{pal[0]}" stroke-width="4" opacity="0.75"/>'
    )
    return "".join(parts)


def grid(rng, pal, W, H):
    parts = []
    step = rng.choice([34, 40, 48])
    mx = int(W * 0.06)
    my = int(H * 0.10)
    parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{pal[1]}"/>')
    parts.append(f'<rect x="{mx}" y="{my}" width="{W - mx * 2}" height="{H - my * 2}" fill="{pal[0]}"/>')
    for x in range(mx, W - mx, step):
        parts.append(f'<line x1="{x}" y1="{my}" x2="{x}" y2="{H - my}" stroke="{pal[2]}" stroke-width="0.7" opacity="0.55"/>')
    for y in range(my, H - my, step):
        parts.append(f'<line x1="{mx}" y1="{y}" x2="{W - mx}" y2="{y}" stroke="{pal[2]}" stroke-width="0.7" opacity="0.55"/>')
    bx = rng.randint(int(W * 0.12), int(W * 0.22))
    by = rng.randint(int(H * 0.16), int(H * 0.26))
    bw = rng.randint(int(W * 0.26), int(W * 0.34))
    bh = rng.randint(int(H * 0.40), int(H * 0.54))
    parts.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="14" fill="{pal[2]}" opacity="0.55"/>')
    parts.append(
        f'<circle cx="{bx + bw // 2}" cy="{by + bh // 2}" r="{rng.randint(int(bh * 0.20), int(bh * 0.32))}" '
        f'fill="{pal[4]}" opacity="0.90"/>'
    )
    tx = bx + bw + rng.randint(30, 70)
    ty = by + rng.randint(10, 50)
    tw = min(rng.randint(int(W * 0.18), int(W * 0.24)), W - mx - tx)
    parts.append(f'<rect x="{tx}" y="{ty}" width="{tw}" height="26" rx="6" fill="{pal[4]}" opacity="0.85"/>')
    for i in range(rng.randint(2, 4)):
        parts.append(
            f'<rect x="{tx}" y="{ty + 58 + i * 36}" width="{rng.randint(int(tw * 0.45), tw)}" height="14" '
            f'rx="6" fill="{pal[5]}" opacity="{rng.uniform(0.25, 0.55):.2f}"/>'
        )
    parts.append(
        f'<rect x="{tx}" y="{ty + rng.randint(230, 280)}" width="{rng.randint(110, 170)}" height="46" '
        f'rx="8" fill="{pal[3]}" opacity="0.92"/>'
    )
    parts.append(
        f'<rect x="{tx}" y="{ty + rng.randint(330, 380)}" width="{tw}" height="{rng.randint(80, 130)}" '
        f'rx="12" fill="{pal[2]}" opacity="0.35"/>'
    )
    return "".join(parts)


def build(name, palette_key, seed, size):
    W, H = size
    rng = random.Random(seed)
    pal = PALETTES[palette_key]
    body = {"skyline": skyline, "seal": seal, "grid": grid}[MOTIF[palette_key]](rng, pal, W, H)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}"><title>{name}</title>{body}</svg>'
    )
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(svg)
    return name + ".svg"


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [("nocturne", 1001), ("beasts", 2002), ("commerce", 3003)]
    made = []
    for key, base in jobs:
        made.append(build(f"{key}-cover", key, base, COVER))
        for i in range(1, 4):
            made.append(build(f"{key}-{i}", key, base + i * 17, SHOT))
    for m in made:
        p = os.path.join(OUT, m)
        print(m, os.path.getsize(p))


if __name__ == "__main__":
    main()
