#!/usr/bin/env python3
"""Generate the DOÇÃO logo kit (azulejo-style cartouche) as SVG files.

Usage: python3 build.py path/to/Marcellus-Regular.ttf
Needs node + opentype.js (for the wordmark outlines) and the logo-design skill's
scripts/text-to-path.mjs. Font: Marcellus (SIL Open Font License).
"""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
T2P = HERE.parent.parent / "logo-design" / "scripts" / "text-to-path.mjs"

BLUE = "#1d3f9e"   # cobalt azulejo blue
CREAM = "#f7f3ea"  # glazed tile white

W, H = 1200, 800
CX, CY = 600, 400
X0, X1, Y0, Y1 = 200, 1000, 170, 630  # cartouche bounds
R = 60        # concave corner radius
CREST = 42    # height of the top/bottom arch
CW = 120      # half-width of the arch


def f(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


def cartouche(d):
    """Cartouche outline inset by d: concave corners, arched crest top and bottom."""
    x0, x1, y0, y1, r = X0 + d, X1 - d, Y0 + d, Y1 - d, R + d
    cw = CW - d * 0.6
    ct, cb = Y0 - CREST + d, Y1 + CREST - d
    p = [
        f"M{f(X0 + r)} {f(y0)}",
        f"H{f(CX - cw - 40)}",
        f"C{f(CX - cw)} {f(y0)} {f(CX - cw * 0.55)} {f(ct)} {f(CX)} {f(ct)}",
        f"C{f(CX + cw * 0.55)} {f(ct)} {f(CX + cw)} {f(y0)} {f(CX + cw + 40)} {f(y0)}",
        f"H{f(X1 - r)}",
        f"A{f(r)} {f(r)} 0 0 0 {f(x1)} {f(Y0 + r)}",
        f"V{f(Y1 - r)}",
        f"A{f(r)} {f(r)} 0 0 0 {f(X1 - r)} {f(y1)}",
        f"H{f(CX + cw + 40)}",
        f"C{f(CX + cw)} {f(y1)} {f(CX + cw * 0.55)} {f(cb)} {f(CX)} {f(cb)}",
        f"C{f(CX - cw * 0.55)} {f(cb)} {f(CX - cw)} {f(y1)} {f(CX - cw - 40)} {f(y1)}",
        f"H{f(X0 + r)}",
        f"A{f(r)} {f(r)} 0 0 0 {f(x0)} {f(Y1 - r)}",
        f"V{f(Y0 + r)}",
        f"A{f(r)} {f(r)} 0 0 0 {f(X0 + r)} {f(y0)}",
        "Z",
    ]
    return " ".join(p)


# Half of the crest ornament (right side); mirrored for the left, flipped for the bottom.
CREST_HALF = (
    # main C-scroll curling into a spiral
    "M600 {y0} C632 {a} 690 {b} 712 {c} C726 {d} 712 {e} 698 {e} "
    "C686 {e} 682 {d} 690 {f} C695 {g} 703 {g} 706 {d}"
)


def crest_ornament(color, sw):
    top = Y0 - CREST  # top of the arch
    s = CREST_HALF.format(
        y0=top - 6, a=top - 40, b=top - 44, c=top - 22,
        d=top - 6, e=top + 2, f=top - 12, g=top - 16,
    )
    leaf = (f"M600 {top - 6} C628 {top - 10} 650 {top - 2} 662 {top + 16}")
    bud = (f"M600 {top - 78} C616 {top - 56} 618 {top - 30} 600 {top - 10} "
           f"C582 {top - 30} 584 {top - 56} 600 {top - 78}Z")
    stroke = (f'fill="none" stroke="{color}" stroke-width="{sw}" '
              'stroke-linecap="round" stroke-linejoin="round"')
    half = f'<path {stroke} d="{s}"/><path {stroke} d="{leaf}"/>'
    one = (f'<g transform="translate(0 -14)">'
           f'<g>{half}</g><g transform="matrix(-1 0 0 1 {W} 0)">{half}</g>'
           f'<path fill="{color}" d="{bud}"/>'
           f'<circle cx="600" cy="{top - 92}" r="7" fill="{color}"/></g>')
    return one + f'<g transform="matrix(1 0 0 -1 0 {H})">{one}</g>'


def side_ornament(color, sw):
    stroke = (f'fill="none" stroke="{color}" stroke-width="{sw}" '
              'stroke-linecap="round" stroke-linejoin="round"')
    upper = (f"M{X0} 318 C168 318 148 350 160 374 C168 390 188 386 188 372 "
             "C188 362 178 358 172 364")
    lower_t = f'matrix(1 0 0 -1 0 {H})'
    bud = f"M118 400 C134 386 156 386 176 400 C156 414 134 414 118 400Z"
    one = (f'<path {stroke} d="{upper}"/><g transform="{lower_t}"><path {stroke} d="{upper}"/></g>'
           f'<path fill="{color}" d="{bud}"/><circle cx="104" cy="400" r="7" fill="{color}"/>')
    return one + f'<g transform="matrix(-1 0 0 1 {W} 0)">{one}</g>'


def corner_flowers(color):
    out = []
    for x, y in [(X0, Y0), (X1, Y0), (X0, Y1), (X1, Y1)]:
        petals = "".join(
            f'<ellipse cx="{x}" cy="{y - 17}" rx="8" ry="15" fill="{color}" '
            f'transform="rotate({a} {x} {y})"/>'
            for a in (45, 135, 225, 315)
        )
        out.append(petals + f'<circle cx="{x}" cy="{y}" r="6" fill="{color}"/>')
    return "".join(out)


def divider(y, color):
    return (f'<path fill="{color}" d="M600 {y - 9} L609 {y} L600 {y + 9} L591 {y}Z"/>'
            f'<rect x="470" y="{y - 1.5}" width="108" height="3" fill="{color}"/>'
            f'<rect x="622" y="{y - 1.5}" width="108" height="3" fill="{color}"/>')


def wordmark(font, text="DOÇÃO", size=176, tracking=0.06):
    svg = subprocess.run(
        ["node", str(T2P), "--font", font, "--text", text,
         "--size", str(size), "--tracking", str(tracking)],
        check=True, capture_output=True, text=True).stdout
    d = re.search(r' d="([^"]+)"', svg).group(1)
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    return d, vb


def wordmark_group(d, vb, color, cy=CY, cap=None):
    # Center the glyph box (minus the 5 % padding text-to-path adds) on (CX, cy).
    w = vb[2]
    tx = CX - (vb[0] + w / 2)
    # Optical centering on the cap height, ignoring tilde/cedilla.
    ty = cy + cap / 2
    # A thin same-color stroke gives Marcellus the heavier weight of painted tile lettering.
    return (f'<path fill="{color}" stroke="{color}" stroke-width="3.5" stroke-linejoin="round" '
            f'transform="translate({f(tx)} {f(ty)})" d="{d}"/>')


def logo(d, vb, cap, fg, bg, panel=None, title="DOÇÃO"):
    body = []
    if panel:
        body.append(f'<rect width="{W}" height="{H}" fill="{panel}"/>')
    body.append(f'<path fill="{fg}" d="{cartouche(-14)}"/>')       # outer band
    body.append(f'<path fill="{bg}" d="{cartouche(4)}"/>')         # tile field
    body.append(f'<path fill="none" stroke="{fg}" stroke-width="4" d="{cartouche(16)}"/>')
    body.append(crest_ornament(fg, 9))
    body.append(side_ornament(fg, 9))
    body.append(corner_flowers(fg))
    body.append(divider(282, fg))
    body.append(divider(522, fg))
    body.append(wordmark_group(d, vb, fg, cap=cap))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">\n'
            f'  <title>{title}</title>\n  ' + "\n  ".join(body) + "\n</svg>\n")


def favicon(font, fg, bg):
    """Square tile with a 'D' inside a small concave-cornered frame."""
    dd, vb = wordmark(font, "D", size=300, tracking=0)
    tx = 256 - (vb[0] + vb[2] / 2)
    cap = 300 * 0.7
    ty = 256 + cap / 2
    frame = ("M120 40 H392 A80 80 0 0 0 472 120 V392 A80 80 0 0 0 392 472 "
             "H120 A80 80 0 0 0 40 392 V120 A80 80 0 0 0 120 40Z")
    inner = ("M128 64 H384 A64 64 0 0 0 448 128 V384 A64 64 0 0 0 384 448 "
             "H128 A64 64 0 0 0 64 384 V128 A64 64 0 0 0 128 64Z")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n'
            f'  <title>DOÇÃO</title>\n'
            f'  <rect width="512" height="512" rx="96" fill="{bg}"/>\n'
            f'  <path fill="{fg}" d="{frame}"/>\n'
            f'  <path fill="{bg}" d="{inner}"/>\n'
            f'  <path fill="{fg}" transform="translate({f(tx)} {f(ty)})" d="{dd}"/>\n'
            f'</svg>\n')


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    font = sys.argv[1]
    d, vb = wordmark(font)
    cap = 176 * 0.7  # Marcellus cap height ≈ 0.7 em
    files = {
        "docao-primary.svg": logo(d, vb, cap, BLUE, CREAM),
        "docao-mono-blue.svg": logo(d, vb, cap, BLUE, "#ffffff"),
        "docao-mono-black.svg": logo(d, vb, cap, "#16161a", "#ffffff"),
        "docao-reversed.svg": logo(d, vb, cap, CREAM, BLUE, panel=BLUE),
        "docao-favicon.svg": favicon(font, BLUE, CREAM),
    }
    for name, svg in files.items():
        (HERE / name).write_text(svg, encoding="utf-8")
        print(name)


if __name__ == "__main__":
    main()
