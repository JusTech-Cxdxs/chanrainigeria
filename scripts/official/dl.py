import re,os,json,subprocess,sys,glob,urllib.parse
P='./work/probe'
def get(u,fn):
    if os.path.exists(fn) and os.path.getsize(fn)>2000: return
    os.makedirs(os.path.dirname(fn),exist_ok=True)
    r=subprocess.run([f'{P}/get.sh',u,fn],capture_output=True,text=True); print(r.stdout.strip()[:140])
B='https://bydforklift.com/uk/wp-content/uploads/'
byd={'ecb16':['ECB16-1.png','ECB16-2.png','ECB16-3.png','ECB16-4.png','ECB16-5-1.png','ECB16-6-1.png','4.1_BYD-Counterbalance-forklifts_ECB16.ECB18.pdf'],
'ecb18':['BYD-ECB18C-Contrapesada-Electrica-Triciclo-%d.png'%i for i in (1,2,3,4,5)],
'ecb20s':['4.4_BYD-Counterbalance-forklifts_ECB20S.pdf'],
'ecb20':['ECB20-1.png','ECB20-2.png','ECB20-3.png','ECB20-4.png','4.5_BYD-Counterbalance-forklifts_ECB20.ECB25.ECB27.pdf'],
'ecb30':['ECB30-35.png','4.7_BYD-Counterbalance-forklifts_ECB30.ECB35.pdf'],
'ecb40':['4.8_BYD-Counterbalance-forklifts_ECB40.ECB45.ECB50.pdf'],
'ecb70':['ECB70-01.jpg','ECB70-02.jpg','ECB70-03.jpg','ECB70-04.jpg','4.9_BYD-Counterbalance-forklifts_ECB60.ECB70.ECB80.pdf'],
'ptw20si':['PTW20i-1-1.png','PTW20i-2-1.png','PTW20i-battery-cover-1.png','1_BYD-Pallet-Trucks_PTW20S.PTP20P.PTP20S.pdf'],
'ptp20p':['PTP20P-1-1.png','PTP20P-2-1.png','PTP20P-3-1.png'],
'eps14pi':['EPS14Pi_01.png','eps14i_02.png','eps14i_03.png','eps14i_04.png','eps14i_05.png','eps14i_06.png','eps14i_09.png','eps14i_10.png','eps14i_11.png','eps14i_12.png','2_BYD-Stacker-Trucks_EPS14Pi.EPS14P.EPS14.pdf'],
'rtr16':['RTR16-3.png']}
for k,v in byd.items():
    for f in v: get(B+f,f'raw/byd/{k}/{f}')
get('https://sg.byd.com/wp-content/uploads/2025/09/BYD-Forklift-Product-Brochure.pdf','raw/byd/range/BYD-Forklift-Product-Brochure.pdf')
# Fornovo
for f in sorted(glob.glob(P+'/fg/*.html')):
    n=os.path.basename(f)[:-5]
    if n in('about','cng','mm'): continue
    h=open(f,errors='ignore').read()
    i=h.find('<main'); main=h[i:] if i>0 else h
    j=main.find('related'); 
    imgs=[u for u in dict.fromkeys(re.findall(r'(https://www\.fornovogas\.it/wp-content/uploads/[^"\'\s)]+?\.(?:png|jpe?g|webp))',main)) if not re.search(r'-\d+x\d+\.\w+$',u)]
    pdfs=list(dict.fromkeys(re.findall(r'(https://www\.fornovogas\.it/wp-content/uploads/[^"\'\s)]+?\.pdf)',h)))
    print(n,len(imgs),[os.path.basename(p) for p in pdfs])
    for u in imgs[:8]+pdfs: get(u,f'raw/fornovo/{n}/{os.path.basename(u)}')
# SOPAN
for u in open(P+'/sp/imgs.txt').read().split():
    if re.search(r'-\d+x\d+\.\w+$',u): continue
    get(u,'raw/sopan/'+os.path.basename(u))
