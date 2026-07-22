#!/usr/bin/env python3
"""Regenerate the Android launcher icons from android/calendar.png.

Run after changing the source art:

    python3 android/tools/generate-launcher-icons.py

Nothing in the Gradle or Capacitor build does this — `npx cap sync` copies web
assets and plugin config, it never touches res/mipmap-*. So the generated PNGs
are committed, and this script exists so they can be rebuilt instead of being
hand-edited (the last icon change updated calendar.png alone and the shipped
icon silently stayed on the previous art).

What it produces, from one 512x512 source:

  mipmap-*/ic_launcher.png            legacy icon, pre-API-26 launchers
  mipmap-*/ic_launcher_round.png      legacy round icon (source is a circle)
  mipmap-*/ic_launcher_foreground.png adaptive foreground layer
  mipmap-*/ic_launcher_monochrome.png themed-icon layer (Android 13+)
  values/ic_launcher_background.xml   adaptive background colour

The adaptive layers are the fiddly part. A layer is 108dp but only the middle
72dp is ever visible — the launcher masks it to a circle/squircle/rounded
square and slides it around for parallax. Pasting the source at full bleed
would push the artwork right up against that mask. Instead the source circle is
scaled to exactly the visible 72dp and dropped onto a canvas flooded with the
circle's own fill colour, so the seam is invisible and the art sits inside the
mask at the same proportions the source was drawn at.
"""

from pathlib import Path

from PIL import Image, ImageChops

ANDROID = Path(__file__).resolve().parent.parent
SOURCE = ANDROID / "calendar.png"
RES = ANDROID / "app/src/main/res"

# Density buckets and their scale factor relative to mdpi (1dp = 1px at mdpi).
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

LEGACY_DP = 48  # pre-API-26 launcher icon
ADAPTIVE_DP = 108  # adaptive layer canvas
VISIBLE_DP = 72  # the part of that canvas a mask can show

# Alpha below this reads as "outside the artwork" when sampling the fill colour.
OPAQUE = 250
# How far a colour has to sit from the fill (as a weighted channel difference,
# 0-255) before it counts as fully part of the glyph in the monochrome layer.
# Anything nearer fades out, which is what keeps the antialiased strokes from
# turning into stairsteps.
GLYPH_DISTANCE = 110


def fill_colour(image: Image.Image) -> tuple[int, int, int]:
    """The circle's fill — by far the most common opaque colour in the source."""
    colours = image.getcolors(maxcolors=image.width * image.height)
    opaque = [(count, px[:3]) for count, px in colours if px[3] >= OPAQUE]
    return max(opaque)[1]


def adaptive_layer(source: Image.Image, size: int, background: tuple[int, int, int]):
    """Source scaled to the visible 72dp, centred on a `background`-filled canvas."""
    inner = round(size * VISIBLE_DP / ADAPTIVE_DP)
    canvas = Image.new("RGBA", (size, size), (*background, 255))
    art = source.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.alpha_composite(art, (offset, offset))
    return canvas


def monochrome_layer(layer: Image.Image, background: tuple[int, int, int]):
    """Themed-icon layer: the glyph as an alpha mask, colour supplied by the OS.

    The source draws its glyph directly onto the fill colour, so "how far is
    this pixel from the fill" is the mask. Distances are stretched to full
    opacity at GLYPH_DISTANCE — the teal fork sits closer to the navy than the
    white strokes do, and without the stretch it would render half-faded next
    to them.
    """
    solid = Image.new("RGB", layer.size, background)
    distance = ImageChops.difference(layer.convert("RGB"), solid).convert("L")
    mask = distance.point(lambda v: min(255, round(v * 255 / GLYPH_DISTANCE)))
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    out.putalpha(mask)
    return out


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    if source.width != source.height:
        raise SystemExit(f"{SOURCE.name} must be square, got {source.size}")

    background = fill_colour(source)
    print(f"{SOURCE.name}: {source.width}px, fill #{'%02X%02X%02X' % background}")

    for density, scale in DENSITIES.items():
        out = RES / f"mipmap-{density}"
        out.mkdir(parents=True, exist_ok=True)

        legacy_size = round(LEGACY_DP * scale)
        legacy = source.resize((legacy_size, legacy_size), Image.LANCZOS)
        # The source is already circular, so the round variant is the same art.
        legacy.save(out / "ic_launcher.png")
        legacy.save(out / "ic_launcher_round.png")

        adaptive_size = round(ADAPTIVE_DP * scale)
        layer = adaptive_layer(source, adaptive_size, background)
        layer.save(out / "ic_launcher_foreground.png")
        monochrome_layer(layer, background).save(out / "ic_launcher_monochrome.png")

        print(f"  {density}: {legacy_size}px legacy, {adaptive_size}px adaptive")

    colour = RES / "values/ic_launcher_background.xml"
    colour.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<!-- Generated by tools/generate-launcher-icons.py from calendar.png. -->\n"
        "<resources>\n"
        f'    <color name="ic_launcher_background">#{"%02X%02X%02X" % background}</color>\n'
        "</resources>\n"
    )
    print(f"  {colour.relative_to(ANDROID)}")


if __name__ == "__main__":
    main()
