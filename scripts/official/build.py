import os,sys,json,glob,subprocess,re,shutil
import numpy as np, cv2
from PIL import Image
R='raw'; PUB='./public/official'
sr=cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel('./work/FSRCNN_x2.pb'); sr.setModel('fsrcnn',2)
def up2(im):
    """2x: FSRCNN on colour, Lanczos on alpha."""
    a=im.getchannel('A') if im.mode=='RGBA' else None
    rgb=im.convert('RGB')
    if a is not None:
        # white under transparent pixels so edges upscale clean
        bg=Image.new('RGB',im.size,'white'); bg.paste(rgb,mask=a); rgb=bg
    out=Image.fromarray(cv2.cvtColor(sr.upsample(cv2.cvtColor(np.array(rgb),cv2.COLOR_RGB2BGR)),cv2.COLOR_BGR2RGB))
    if a is not None:
        out=out.convert('RGBA'); out.putalpha(a.resize(out.size,Image.LANCZOS))
    return out
def studio(src,dst):
    im=Image.open(src); im=im.convert('RGBA' if 'A' in im.getbands() or im.mode=='P' else 'RGB')
    if im.mode=='RGBA':
        bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
        if bb: im=im.crop(bb)
    else:
        from PIL import ImageChops
        bb=ImageChops.difference(im,Image.new('RGB',im.size,'white')).convert('L').point(lambda v:255 if v>14 else 0).getbbox()
        if bb: im=im.crop(bb)
    if max(im.size)<1100: im=up2(im)
    if max(im.size)>1800: im.thumbnail((1800,1800),Image.LANCZOS)
    os.makedirs(os.path.dirname(dst),exist_ok=True); im.save(dst,'WEBP',quality=88,method=6); return im.size
def photo(src,dst,maxw=1600):
    im=Image.open(src).convert('RGB')
    if im.size[0]<1000: im=up2(im)
    if im.size[0]>maxw: im.thumbnail((maxw,maxw),Image.LANCZOS)
    os.makedirs(os.path.dirname(dst),exist_ok=True); im.save(dst,'JPEG',quality=84,optimize=True,progressive=True); return im.size
def pdf(src,name,sheet_dst=None,page=2):
    dst=f'{PUB}/brochures/{name}'; os.makedirs(os.path.dirname(dst),exist_ok=True)
    if not os.path.exists(dst): shutil.copy(src,dst)
    info={'href':f'/official/brochures/{name}','kb':os.path.getsize(dst)//1024}
    if sheet_dst:
        n=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo',src],capture_output=True,text=True).stdout).group(1))
        pg=min(page,n); tmp='./work/tmp_sheet'
        subprocess.run(['pdftoppm','-f',str(pg),'-l',str(pg),'-scale-to-x','1800','-scale-to-y','-1','-jpeg','-singlefile',src,tmp],capture_output=True)
        im=Image.open(tmp+'.jpg').convert('RGB'); os.makedirs(os.path.dirname(sheet_dst),exist_ok=True); im.save(sheet_dst,'JPEG',quality=80,optimize=True,progressive=True)
        info['sheet']=sheet_dst.replace('./public',''); info['sheetSize']=list(im.size)
    return info
web=lambda p:p.replace('./public','')
M={'models':{},'types':{},'lines':{}}
# ---------- LiuGong ----------
idx=json.load(open(f'{R}/liugong/index.json'))
for m,r in idx.items():
    d=f'{R}/liugong/{m}'; o=f'{PUB}/liugong/{m}'; e={'brand':'LiuGong','source':f'https://mea.liugong.com/product/{m}/'}
    st=os.path.join(d,os.path.basename(r['studio']))
    e['studio']=[]
    if os.path.exists(st):
        w,h=studio(st,f'{o}/studio.webp'); e['studio']=[{'src':web(f'{o}/studio.webp'),'w':w,'h':h}]
    photo(os.path.join(d,os.path.basename(r['banner'])),f'{o}/banner.jpg',1920); e['banner']=web(f'{o}/banner.jpg')
    g=[]
    rest=sorted(set(os.path.basename(u) for u in r['imgs'] if u not in (r['banner'],r['studio']) and 'anner' not in u))
    rest=[n for n in rest if os.path.exists(os.path.join(d,n))]
    rest=sorted(rest,key=lambda n:(0 if re.search('gallery|work-photo',n) else 1,n))[:9]
    for i,n in enumerate(rest,1):
        photo(os.path.join(d,n),f'{o}/photo-{i}.jpg'); g.append(web(f'{o}/photo-{i}.jpg'))
    e['gallery']=g
    pn=os.path.basename(r['pdf']); e['brochure']=pdf(os.path.join(d,pn),f'liugong-{m}.pdf',f'{o}/sheet.jpg'); 
    M['models'][f'liugong-{m}']=e
# ---------- BYD ----------
sets={'ecb16':(['ECB16-6-1.png','ECB16-1.png','ECB16-2.png','ECB16-3.png','ECB16-5-1.png','ECB16-4.png'],'4.1_BYD-Counterbalance-forklifts_ECB16.ECB18.pdf','byd-ecb16-ecb18.pdf','counterbalance-forklift-ecb16'),
'ecb18':(['BYD-ECB18C-Contrapesada-Electrica-Triciclo-%d.png'%i for i in (2,1,3,4,5)],None,'byd-ecb16-ecb18.pdf','counterbalance-forklift-ecb18'),
'ecb20s':([], '4.4_BYD-Counterbalance-forklifts_ECB20S.pdf','byd-ecb20s.pdf','counterbalance-forklift-ecb20b-cs'),
'ecb20':(['ECB20-2.png','ECB20-1.png','ECB20-3.png','ECB20-4.png'],'4.5_BYD-Counterbalance-forklifts_ECB20.ECB25.ECB27.pdf','byd-ecb20-ecb25-ecb27.pdf','counterbalance-forklift-ecb20-25-27'),
'ecb30':(['ECB30-35.png'],'4.7_BYD-Counterbalance-forklifts_ECB30.ECB35.pdf','byd-ecb30-ecb35.pdf','counterbalance-forklift-ecb30-35-45-50'),
'ecb40':([], '4.8_BYD-Counterbalance-forklifts_ECB40.ECB45.ECB50.pdf','byd-ecb40-ecb45-ecb50.pdf','byd-ecb40-45-50'),
'ecb70':(['ECB70-01.jpg','ECB70-02.jpg','ECB70-03.jpg','ECB70-04.jpg'],'4.9_BYD-Counterbalance-forklifts_ECB60.ECB70.ECB80.pdf','byd-ecb60-ecb70-ecb80.pdf','counterbalance-forklift-ecb70-80'),
'ptw20si':(['PTW20i-2-1.png','PTW20i-1-1.png','PTW20i-battery-cover-1.png'],'1_BYD-Pallet-Trucks_PTW20S.PTP20P.PTP20S.pdf','byd-pallet-trucks.pdf','byd-ptw20si'),
'ptp20p':(['PTP20P-1-1.png','PTP20P-2-1.png','PTP20P-3-1.png'],None,'byd-pallet-trucks.pdf','pallet-truck-ptp20p-2'),
'eps14pi':(['eps14i_02.png','eps14i_03.png','eps14i_06.png','eps14i_12.png','eps14i_05.png','EPS14Pi_01.png','eps14i_04.png','eps14i_11.png','eps14i_09.png','eps14i_10.png'],'2_BYD-Stacker-Trucks_EPS14Pi.EPS14P.EPS14.pdf','byd-stacker-trucks.pdf','stacker-truck-eps14pi'),
'rtr16':(['RTR16-3.png'],None,None,'reach-truck-rtr16-20')}
S={}; pdfs={}
for k,(imgs,pf,pname,page) in sets.items():
    e={'brand':'BYD','source':f'https://bydforklift.com/uk/model/{page}/','studio':[],'gallery':[]}
    for i,n in enumerate(imgs,1):
        w,h=studio(f'{R}/byd/{k}/{n}',f'{PUB}/byd/{k}/view-{i}.webp'); e['studio'].append({'src':web(f'{PUB}/byd/{k}/view-{i}.webp'),'w':w,'h':h})
    if pf: pdfs[pname]=pdf(f'{R}/byd/{k}/{pf}',pname,f'{PUB}/byd/{k}/sheet.jpg')
    if pname: e['brochure']=pdfs[pname]
    S[k]=e
for slug,k in {'ecb16':'ecb16','ecb18':'ecb18','ecb20s':'ecb20s','ecb20':'ecb20','ecb25':'ecb20','ecb27':'ecb20','ecb30':'ecb30','ecb35':'ecb30','ecb40':'ecb40','ecb45':'ecb40','ecb50':'ecb40','ecb60':'ecb70','ecb70':'ecb70','ecb80':'ecb70','ptw20si':'ptw20si','ptp20p':'ptp20p','eps14pi':'eps14pi','rtr16':'rtr16','rtr20':'rtr16'}.items():
    M['models'][f'byd-{slug}']=S[k]
# ---------- CNG types ----------
def cap(src,dst,caption,brand):
    w,h=photo(src,dst); return {'src':web(dst),'caption':caption,'brand':brand}
sp=lambda n,slug,i,c:cap(f'{R}/sopan/{n}',f'{PUB}/sopan/{slug}-{i}.jpg',c,'SOPAN')
fg=lambda n,slug,i,c:cap(n,f'{PUB}/fornovo/{slug}-{i}.jpg',c,'Fornovo Gas')
T=M['types']
T['hydraulic-booster-compressors']={'gallery':[sp('Hydraulic-booster.webp','booster',1,'SOPAN hydraulic booster compressor in its enclosure'),sp('Untitled-design-10-2.webp','booster',2,'SOPAN compressor packages on the factory floor')]}
T['reciprocating-compressors']={'gallery':[sp('Untitled-design-10-1.png','recip',1,'SOPAN compressor package with a storage cascade on top'),sp('Untitled-design-68.png','recip',2,'SOPAN compressor packages installed at a station'),
  fg(glob.glob(f'{R}/fornovo/da300-no-lube/*render*')[0],'recip',1,'Fornovo Gas DA300 no-lube compressor'),fg(glob.glob(f'{R}/fornovo/da500-no-lube/*render*')[0],'recip',2,'Fornovo Gas DA500 no-lube compressor')]}
T['cng-dispensers']={'gallery':[sp('Untitled-design-2026-02-13T151415.761.png','dispenser',1,'SOPAN CNG dispenser')]}
T['gas-utility-skids']={'gallery':[sp('Metering-Skids.jpg','skid',1,'SOPAN metering skid on its delivery truck'),sp('Untitled-design-88.png','skid',2,'SOPAN skid: valves, gauges and filters')]}
T['cascades-storage']={'gallery':[sp('Untitled-design-90.png','cascade',1,'Storage cascade mounted above a SOPAN compressor package')]}
fgb=pdf(f'{R}/fornovo/da300-no-lube/BROCHURE-CNG.pdf','fornovo-gas-cng.pdf'); fgb['label']='Fornovo Gas CNG compressors'
T['reciprocating-compressors']['brochures']=[fgb]
# ---------- Lines ----------
os.makedirs(f'{PUB}/films',exist_ok=True)
if not os.path.exists(f'{PUB}/films/fornovo-gas.mp4'):
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'{R}/fornovo/film.mp4','-vf','scale=-2:540','-c:v','libx264','-crf','29','-preset','slow','-c:a','aac','-b:a','64k','-movflags','+faststart',f'{PUB}/films/fornovo-gas.mp4'])
    subprocess.run(['ffmpeg','-v','error','-y','-ss','80','-i',f'{R}/fornovo/film.mp4','-frames:v','1',f'{PUB}/films/fornovo-gas.jpg'])
bb=pdf(f'{R}/byd/range/BYD-Forklift-Product-Brochure.pdf','byd-forklift-range.pdf'); bb['label']='BYD forklift range'
M['lines']['forklifts-material-handling']={'films':[{'youtube':'Gl3F5I_Wkx0','poster':'/official/films/byd-case-study.jpg','title':'Case study: BYD emission-free trucks reduce a forklift fleet','by':'BYD Europe'}],'brochures':[bb]}
M['lines']['cng-gas-equipment']={'films':[{'mp4':'/official/films/fornovo-gas.mp4','poster':'/official/films/fornovo-gas.jpg','title':'Fornovo Gas: compressors built in Italy since 1969','by':'Fornovo Gas'}],'brochures':[fgb]}
json.dump(M,open('./src/lib/official-media.json','w'),indent=1)
print(len(M['models']))
