from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path("/home/ubuntu/webdev-static-assets/rubber-app-icon.png")
DESTINATIONS = [
    ROOT / "assets/images/icon.png",
    ROOT / "assets/images/splash-icon.png",
    ROOT / "assets/images/favicon.png",
    ROOT / "assets/images/android-icon-foreground.png",
    ROOT / "public/rubber-icon.png",
]


def main() -> None:
    with Image.open(SOURCE) as image:
        optimized = image.convert("RGBA").resize((512, 512), Image.Resampling.LANCZOS)
        for destination in DESTINATIONS:
            destination.parent.mkdir(parents=True, exist_ok=True)
            optimized.save(destination, format="PNG", optimize=True, compress_level=9)


if __name__ == "__main__":
    main()
