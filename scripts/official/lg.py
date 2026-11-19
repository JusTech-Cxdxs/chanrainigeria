import re,os,json,subprocess,sys,urllib.parse
P='./work/probe'
OUT=sys.argv[1]
models="915e 922e 936e 950e 990f 835h 842h 856h 862h 890h b230 b230s b320 4180d 4215d 425 365a 375a 777a 6114e 6120e 6212e dw90a".split()
res={}
for m in models:
    h=open(f'{P}/mea/{m}.html',errors='ignore').read()
    main=h[h.find('<div id="main">'):]
    cut=main.find('product-card-item'); 
    if cut>0: main=main[:cut]
    banner=re.search(r'banner-background" style="background-image:url\(([^)]+)\)',main)
    studio=re.search(r'navbar-icon" style="background-image:url\(([^)]+)\)',main)
    pdf=re.search(r'down-load\?([^"\']+\.pdf)',main)
    imgs=[u for u in re.findall(r'(https://os(?:media|product)\.liugong\.com/[^"\'\s)]+\.(?:jpg|jpeg|png|webp))',main) if '/icon-' not in u and 'icon' not in u.lower().split('/')[-1]]
    vids=re.findall(r'(https?://[^"\'\s]+(?:\.mp4|youtube\.com/embed/[\w-]+|youtu\.be/[\w-]+))',main)
    seen=[];[seen.append(u) for u in imgs if u not in seen]
    r={'banner':banner and banner.group(1),'studio':studio and studio.group(1),'pdf':pdf and urllib.parse.unquote(pdf.group(1)),'imgs':seen,'vids':list(dict.fromkeys(vids))}
    res[m]=r
    d=f'{OUT}/{m}'; os.makedirs(d,exist_ok=True)
    for u in set(filter(None,[r['banner'],r['studio'],r['pdf']]+seen)):
        fn=os.path.join(d,os.path.basename(u))
        if not os.path.exists(fn) or os.path.getsize(fn)<1000:
            subprocess.run([f'{P}/get.sh',u,fn],capture_output=True)
    print(m,len(seen),os.path.basename(r['pdf'] or '-'),r['vids'], sum(os.path.getsize(os.path.join(d,x)) for x in os.listdir(d))//1024,'KB')
json.dump(res,open(f'{OUT}/index.json','w'),indent=1)
