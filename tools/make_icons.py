"""Generate the app icons (PNG) with the Python standard library only.

Run from anywhere:  python tools/make_icons.py
Writes icons/icon-192.png, icons/icon-512.png, icons/apple-touch-icon.png.
The design (blue background, white QR-like finder squares) keeps everything
inside the central 60% so it also works as a maskable icon.
"""
import struct
import zlib
from pathlib import Path

BLUE = (0x1D, 0x4E, 0xD8)
WHITE = (0xFF, 0xFF, 0xFF)

# 11x11 motif: three QR finder patterns + a few data dots.
MOTIF = [
    "#######.###",
    "#.....#..#.",
    "#.###.#.##.",
    "#.###.#....",
    "#.###.#.#.#",
    "#.....#.##.",
    "#######.#.#",
    "...........",
    "#######..#.",
    "#.....#.#.#",
    "#######.##.",
]


def pixel(x, y, size):
    margin = size * 0.22
    area = size - 2 * margin
    gx = (x + 0.5 - margin) / area * len(MOTIF)
    gy = (y + 0.5 - margin) / area * len(MOTIF)
    if 0 <= gx < len(MOTIF) and 0 <= gy < len(MOTIF):
        if MOTIF[int(gy)][int(gx)] == "#":
            return WHITE
    return BLUE


def write_png(path, size):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            rows.extend(pixel(x, y, size))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(rows), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main():
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    for name, size in [("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)]:
        write_png(out / name, size)
        print("wrote icons/" + name)


if __name__ == "__main__":
    main()
