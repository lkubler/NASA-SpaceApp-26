#!/usr/bin/env python3
"""Download and resize the station photos (task 016) -> app/public/data/murray/photos/*.jpg + credits.json
Run from repo root: python3 scripts/preprocess/build_photos.py
Raw frames come from the public MSL raw-image archive (mars.nasa.gov), the cross-bedding view is NASA Photojournal PIA21042.
"""
import io, json, urllib.request
from pathlib import Path
from PIL import Image

OUT = Path("app/public/data/murray/photos"); OUT.mkdir(parents=True, exist_ok=True)
RAW = "http://mars.jpl.nasa.gov/msl-raw-images/"
JPL = "NASA/JPL-Caltech"
MSSS = "NASA/JPL-Caltech/MSSS"
LIC = ("NASA/JPL imagery: usable for any purpose without prior permission with credit, no NASA/JPL logos, no implied endorsement "
       "(JPL Image Use Policy https://www.jpl.nasa.gov/imagepolicy ; NASA Media Guidelines). Raw frames are unprocessed. "
       "Mastcam/MAHLI credit follows the NASA caption convention 'NASA/JPL-Caltech/MSSS'; MSSS asks for commercial reuse permission.")
P = [
 dict(id="marimba_drill", station="Marimba", sol=1422, camera="MAHLI (arm camera, close-up)", title="Marimba drill hole (shallow hole in Murray mudstone)",
      credit=MSSS, url=RAW + "msss/01422/mhli/1422MH0003990010503283C00_DXXX.jpg", utc="2016-08-06", file_id="1422MH0003990010503283C00"),
 dict(id="quela_drill", station="Quela", sol=1464, camera="MAHLI (arm camera, close-up)", title="Quela drill hole at the foot of a butte",
      credit=MSSS, url=RAW + "msss/01464/mhli/1464MH0003990030503897C00_DXXX.jpg", utc="2016-09-18", file_id="1464MH0003990030503897C00"),
 dict(id="marimba_arm_navcam", station="Marimba", sol=1422, camera="Navcam Left B", title="Marimba work area, arm over the rock surface",
      credit=JPL, url=RAW + "proj/msl/redops/ods/surface/sol/01422/opgs/edr/ncam/NLB_523738723EDR_F0561236NCAM00207M_.JPG", utc="2016-08-06", file_id="NLB_523738723EDR_F0561236NCAM00207M_"),
 dict(id="quela_navcam", station="Quela", sol=1455, camera="Navcam Left B", title="Layered outcrop at Quela",
      credit=JPL, url=RAW + "proj/msl/redops/ods/surface/sol/01455/opgs/edr/ncam/NLB_526661251EDR_F0572762NCAM00385M_.JPG", utc="2016-09-09", file_id="NLB_526661251EDR_F0572762NCAM00385M_"),
 dict(id="butte_mastcam_1421", station="Marimba / Murray Buttes entrance", sol=1421, camera="Mastcam Left (34 mm)", title="Butte in the distance seen from Marimba",
      credit=MSSS, url=RAW + "msss/01421/mcam/1421ML0070160130602223E01_DXXX.jpg", utc="2016-08-05", file_id="1421ML0070160130602223E01"),
 dict(id="crossbedding_PIA21042", station="Murray Buttes (between Marimba and Quela)", sol=1454, camera="Mastcam", title="Sloping buttes and cross-bedded sandstone (PIA21042, 'Farewell to Murray Buttes' image 2)",
      credit=MSSS, url="https://pds-rings.seti.org/press_releases/medium/PIA21xxx/PIA21042_med.jpg", utc="2016-09-08",
      page="https://science.nasa.gov/photojournal/farewell-to-murray-buttes-image-2/"),
]
for p in P:
    url = p["url"]
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=120).read())).convert("RGB" if p["camera"].startswith(("MAHLI", "Mastcam")) else "L")
    im.thumbnail((900, 900), Image.LANCZOS)
    im.save(OUT / f"{p['id']}.jpg", quality=78, optimize=True)
    p["file"] = f"photos/{p['id']}.jpg"; p["size_px"] = list(im.size); p["license"] = LIC
    p["source_url"] = p.pop("url")
    print(p["id"], im.size, (OUT / f"{p['id']}.jpg").stat().st_size)
json.dump({"license_note": LIC, "ai_note": "No AI-generated or AI-altered images; files are only resized and recompressed.", "photos": P},
          open(OUT / "credits.json", "w"), indent=1)
