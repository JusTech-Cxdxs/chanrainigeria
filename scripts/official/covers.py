# Only pictures that come out at least as sharp as the site's own are made here; the rest of the site's
# featured pictures (CNG, line cards, home slides, most banners) stay its own. Official photos also show in
# model viewers and the CNG galleries.
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
 'wheel-loaders':('lg','liugong/zl50cn/photo-1.jpg',.5,.75),
 'bulldozers':('lg','liugong/b320/photo-3.jpg',.5,.6),
 'backhoe-loaders':('lg','liugong/777a/photo-5.jpg',.5,.6),
 'rollers':('lg','liugong/6114e/photo-3.jpg',.5,.6),
 'three-wheel-counterbalance-forklifts':('st','byd/ecb16/view-2.webp'),
 'four-wheel-counterbalance-forklifts':('st','byd/ecb20/view-2.webp'),
 'heavy-duty-counterbalance-forklifts':('st','byd/ecb70/view-4.webp'),
 'pallet-trucks':('st','byd/ptp20p/view-1.webp'),
 'stackers':('st','byd/eps14pi/view-1.webp'),
 'reach-trucks':('st','byd/rtr16/view-1.webp'),
}
for slug,spec in T.items():
    if spec[0]=='lg': img=cover(O(spec[1]),TW,TH,spec[2],spec[3])
    elif spec[0]=='st': img=studio(P('official/'+spec[1]),TW,TH)
    else: img=blurfill(P('official/'+spec[1]),TW,TH)
    save(img,P(f'images/types/{slug}.jpg'),[800,240]); print('type',slug)
PG={'page-products':cover(O('liugong/936e/banner.jpg'),2400,900,.5,.5)}
for k,img in PG.items(): save(img,P(f'images/{k}.jpg'),[800,1200,1600]); print('page',k)
N={'wheel-loader-daily-checks':cover(O('liugong/890t/photo-1.jpg'),1600,1000,.5,.8)}
for k,img in N.items(): save(img,P(f'images/news/{k}.jpg'),[800,1200]); print('news',k)
