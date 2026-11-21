# Official manufacturer media

Model pages, machine type pages and product line pages show pictures, brochures and films taken from the
manufacturers' own product pages. They live in `public/official/` and are listed in
`src/lib/official-media.json`. Anything uploaded in the Dashboard (a model's photos or brochure) always wins.

| Brand | Source | What is used |
| --- | --- | --- |
| LiuGong | `mea.liugong.com/product/<model>/` | Studio picture, banner, working photos, brochure (page 2 is shown as the specification sheet) for all 23 models |
| BYD | `bydforklift.com/uk/model/<model>/`, `sg.byd.com` | Studio angles (BYD blue), data sheets, range brochure, one BYD Europe film |
| SOPAN | `sptlglobal.com` | Photos of compressors, dispensers, skids and cascades on the CNG type pages |
| Fornovo Gas | `fornovogas.it` | Compressor pictures, CNG brochure, company film |

## Where each piece shows

- **Model page**: banner, picture viewer (drag, swipe or arrow keys; tap for full screen), brochure button,
  and the specification sheet with dimension drawings.
- **Machine type page**: model cards use the studio picture; CNG types have a captioned gallery.
- **Product line page**: a Watch section with the film and the range brochure.

Models that share one series on the manufacturer's site share its pictures (ECB20/25/27, ECB30/35,
ECB60/70/80, RTR16/20). Models with no official page keep their type's picture until a photo is uploaded.

## Featured pictures

The site's own featured pictures are also made from this media by `scripts/official/covers.py`: machine type
pictures (`public/images/types/`, used on cards and in the Products menu), the three product line pictures
(home cards and line banners), the Products, Services, Parts, Book a technician and News banners, the About
page photos, the starter article covers and the link preview. Forklift type pictures are BYD studio pictures
set on a light backdrop. CNG tube trailer skids and tow tractors have no official picture yet and keep their
earlier ones. The About banner is a strip of four of these photos. The three home slides are official photos too. The Contact banner (the group office) is unchanged.

## Rebuilding

`scripts/official/` holds the three scripts used: `lg.py` and `dl.py` download, `build.py` resizes, writes
`public/official/` and the list. Small studio pictures are enlarged 2× (OpenCV FSRCNN); large brochures are
compressed. Films: the Fornovo Gas film is re-encoded to 540p; the BYD film plays from YouTube's no-cookie
player only after the visitor presses play.
