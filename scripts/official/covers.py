# Builds the site's featured pictures (machine types, product lines, page banners) from the official media.
import os,sys
import numpy as np, cv2
from PIL import Image, ImageFilter, ImageDraw
# Usage: python3 covers.py <repo> <work folder with FSRCNN_x2.pb, and the BYD range brochure's pages 2 and 14
# rendered at 200 dpi as p02.jpg and p14.jpg>
ROOT=sys.argv[1]; FI=sys.argv[2]
P=lambda p:os.path.join(ROOT,'public',p)
sr=cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(os.path.join(FI,'FSRCNN_x2.pb')); sr.setModel('fsrcnn',2)
def up2(im):
    return Image.fromarray(cv2.cvtColor(sr.upsample(cv2.cvtColor(np.array(im.convert('RGB')),cv2.COLOR_RGB2BGR)),cv2.COLOR_BGR2RGB))
def cover(im,W,H,ax=0.5,ay=0.5):
    """Crop to W:H around (ax,ay), then size to W×H (2× AI upscale first when the crop is small)."""
    w,h=im.size; r=W/H
    if w/h>r: cw,ch=int(h*r),h
    else: cw,ch=w,int(w/r)
    x=int((w-cw)*ax); y=int((h-ch)*ay)
    c=im.crop((x,y,x+cw,y+ch))
    if cw<W*0.9: c=up2(c)
    return c.resize((W,H),Image.LANCZOS)
def studio(src,W,H,fillh=0.78):
    """A studio picture on a soft light backdrop with a floor shadow, like a catalogue shot."""
    im=Image.open(src).convert('RGBA')
    a=im.getchannel('A')
    if a.getextrema()[0]==255:  # no transparency: key out the white
        arr=np.array(im.convert('RGB')).astype(int); m=((arr>242).all(axis=2)); al=np.where(m,0,255).astype('uint8')
        a=Image.fromarray(al).filter(ImageFilter.GaussianBlur(1)); im.putalpha(a)
    bb=a.point(lambda v:255 if v>10 else 0).getbbox(); im=im.crop(bb)
    if max(im.size)<1000:
        rgb=Image.new('RGB',im.size,'white'); rgb.paste(im,mask=im.getchannel('A')); big=up2(rgb).convert('RGBA'); big.putalpha(im.getchannel('A').resize(big.size,Image.LANCZOS)); im=big
    s=min(H*fillh/im.size[1], W*0.8/im.size[0]); im=im.resize((int(im.size[0]*s),int(im.size[1]*s)),Image.LANCZOS)
    # backdrop: vertical gradient, light studio grey to near white floor
    g=np.linspace(0,1,H)[:,None]; top=np.array([226,232,238]); bot=np.array([248,249,251])
    bg=(top+(bot-top)*g)[:,None,:].repeat(W,axis=1)[:,:,0,:] if False else np.repeat((top+(bot-top)*g)[:,None,:],W,axis=1).reshape(H,W,3)
    canvas=Image.fromarray(bg.astype('uint8')).convert('RGBA')
    x=(W-im.size[0])//2; y=int(H*0.9)-im.size[1]
    sh=Image.new('L',(W,H),0); d=ImageDraw.Draw(sh); d.ellipse((x+im.size[0]*0.06,y+im.size[1]-H*0.035,x+im.size[0]*0.94,y+im.size[1]+H*0.035),fill=120)
    sh=sh.filter(ImageFilter.GaussianBlur(H*0.025)); canvas.paste(Image.new('RGBA',(W,H),(20,30,40,255)),mask=sh)
    canvas.alpha_composite(im,(x,y)); return canvas.convert('RGB')
def blurfill(src,W,H):
    """A tall photo shown whole on a blurred copy of itself."""
    im=Image.open(src).convert('RGB')
    bg=cover(im,W,H).filter(ImageFilter.GaussianBlur(28)); bg=Image.blend(bg,Image.new('RGB',bg.size,(10,20,14)),0.25)
    s=H/im.size[1]; fg=im.resize((int(im.size[0]*s),H),Image.LANCZOS)
    if fg.size[0]>W: return cover(im,W,H)
    bg.paste(fg,((W-fg.size[0])//2,0)); return bg
def save(img,dst,copies):
    img.save(dst,'JPEG',quality=86,optimize=True,progressive=True)
    for w in copies:
        c=img.resize((w,round(img.size[1]*w/img.size[0])),Image.LANCZOS); c.save(dst[:-4]+f'-{w}.jpg','JPEG',quality=82,optimize=True,progressive=True)
O=lambda p:Image.open(P('official/'+p)).convert('RGB')
TW,TH=1440,840
T={
 'excavators':('lg','liugong/950e/photo-8.jpg',.5,.45),
 'wheel-loaders':('lg','liugong/856h/photo-9.jpg',.5,.6),
 'bulldozers':('lg','liugong/b320/photo-3.jpg',.5,.6),
 'motor-graders':('lg','liugong/4215d/photo-1.jpg',.5,.55),
 'skid-steer-loaders':('lg','liugong/375a/photo-4.jpg',.5,.5),
 'backhoe-loaders':('lg','liugong/777a/photo-5.jpg',.5,.6),
 'rollers':('lg','liugong/6114e/photo-3.jpg',.5,.6),
 'mining-trucks':('lg','liugong/dw90a/photo-4.jpg',.5,.55),
 'three-wheel-counterbalance-forklifts':('st','byd/ecb16/view-2.webp'),
 'four-wheel-counterbalance-forklifts':('st','byd/ecb20/view-2.webp'),
 'heavy-duty-counterbalance-forklifts':('st','byd/ecb70/view-4.webp'),
 'pallet-trucks':('st','byd/ptp20p/view-1.webp'),
 'stackers':('st','byd/eps14pi/view-1.webp'),
 'reach-trucks':('st','byd/rtr16/view-1.webp'),
 'station-solutions':('lg','sopan/recip-2.jpg',.5,.45),
 'hydraulic-booster-compressors':('lg','sopan/booster-1.jpg',.5,.5),
 'reciprocating-compressors':('lg','sopan/booster-2.jpg',.5,.5),
 'cng-dispensers':('bf','sopan/dispenser-1.jpg'),
 'cascades-storage':('lg','sopan/recip-1.jpg',.5,.12),
 'gas-utility-skids':('lg','sopan/skid-1.jpg',.5,.5),
}
for slug,spec in T.items():
    if spec[0]=='lg': img=cover(O(spec[1]),TW,TH,spec[2],spec[3])
    elif spec[0]=='st': img=studio(P('official/'+spec[1]),TW,TH)
    else: img=blurfill(P('official/'+spec[1]),TW,TH)
    save(img,P(f'images/types/{slug}.jpg'),[800,240]); print('type',slug)
byd=Image.open(os.path.join(FI,'p02.jpg')).convert('RGB').crop((0,0,1654,2245))
L={'construction-equipment':cover(O('liugong/936e/photo-6.jpg'),2400,1500,.5,.5),
   'forklifts-material-handling':cover(byd,2400,1500,.5,.62),
   'cng-gas-equipment':cover(O('sopan/cascade-1.jpg'),2400,1500,.5,.5)}
for slug,img in L.items(): save(img,P(f'images/category-{slug}.jpg'),[800,1200,1600]); print('line',slug)
PG={'page-products':cover(O('liugong/936e/banner.jpg'),2400,900,.5,.5),
    'page-news':cover(O('liugong/890h/banner.jpg'),2400,900,.5,.5),
    'page-services':cover(O('liugong/950e/photo-9.jpg'),2400,900,.5,.45),
    'page-parts':cover(O('liugong/890h/photo-6.jpg'),2400,900,.5,.5),
    'page-book-service':cover(O('liugong/835h/photo-6.jpg'),2400,900,.5,.35)}
for k,img in PG.items(): save(img,P(f'images/{k}.jpg'),[800,1200,1600]); print('page',k)

p14=Image.open(os.path.join(FI,'p14.jpg')).convert('RGB').crop((1390,440,3308,1940))
AB={'about-1':(cover(O('sopan/booster-1.jpg'),2400,1400,.5,.5),[800,1200,1600]),
    'about-2':(cover(O('liugong/862h/photo-3.jpg'),1600,1200,.5,.6),[800,1200,1600]),
    'about-3':(cover(p14,1600,1200,.5,.5),[800,1200,1600])}
for k,(img,c) in AB.items(): save(img,P(f'images/{k}.jpg'),c); print('about',k)
og=Image.new('RGB',(1200,630))
for i,src in enumerate([O('sopan/cascade-1.jpg'),O('liugong/936e/photo-6.jpg'),byd.crop((0,560,1654,2245))]):
    og.paste(cover(src,400,630,.5,.6 if i==2 else .5),(i*400,0))
og.save(P('images/og-image.jpg'),'JPEG',quality=86,optimize=True); print('og')
N={'wheel-loader-daily-checks':cover(O('liugong/842h/photo-1.jpg'),1600,1000,.5,.55),
   'electric-forklift-battery-care':cover(byd.crop((0,560,1654,2245)),1600,1000,.45,.55),
   'planning-a-cng-station':cover(O('sopan/recip-2.jpg'),1600,1000,.5,.4),
   'prepare-site-for-technician-visit':cover(O('liugong/835h/photo-6.jpg'),1600,1000,.5,.35)}
for k,img in N.items(): save(img,P(f'images/news/{k}.jpg'),[800,1200]); print('news',k)
ab=Image.new('RGB',(2400,900))
for i,(src,ay) in enumerate([(O('sopan/cascade-1.jpg'),.5),(O('liugong/936e/photo-6.jpg'),.5),(byd.crop((0,560,1654,2245)),.5),(O('liugong/835h/photo-6.jpg'),.35)]):
    ab.paste(cover(src,600,900,.5,ay),(i*600,0))
save(ab,P('images/page-about.jpg'),[800,1200,1600]); print('page-about')

def right_hero(src,W,H):
    """The machine on the right; the left is the photo's own edge, mirrored and softened, for the headline."""
    s=H/src.size[1]; fg=src.resize((round(src.size[0]*s),H),Image.LANCZOS)
    if fg.size[0]<W*0.9 and src.size[0]<fg.size[0]: fg=up2(src).resize(fg.size,Image.LANCZOS)
    out=Image.new('RGB',(W,H)); left=W-fg.size[0]
    # each row continues in the colour of the photo's left edge
    edge=fg.crop((0,0,24,H)).resize((1,H),Image.BOX).filter(ImageFilter.GaussianBlur(6))
    fill=edge.resize((left+160,H))
    out.paste(fill,(0,0)); 
    m=Image.linear_gradient('L').rotate(90).resize((160,H))  # 0 on the left, 255 on the right
    out.paste(fg,(left,0)); out.paste(fg.crop((0,0,160,H)),(left,0),m)
    out.paste(fill.crop((left,0,left+160,H)),(left,0),Image.eval(m,lambda v:255-v))
    return out
H1={'hero-1':cover(O('liugong/936e/photo-7.jpg'),2400,1350,.5,.5),
    'hero-2':cover(O('sopan/cascade-1.jpg'),2400,1350,.5,.45),
    'hero-3':right_hero(p14,2400,1350)}
for k,img in H1.items(): save(img,P(f'images/{k}.jpg'),[800,1200,1600]); print('hero',k)
