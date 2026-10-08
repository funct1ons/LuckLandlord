"""Original procedural SVG illustration, no external source images. Rebuild from repo root."""
from pathlib import Path
import random
random.seed(41)
out=Path('assets/art/scenes'); out.mkdir(parents=True,exist_ok=True)
def path(d,fill,extra=''): return f'<path d="{d}" fill="{fill}" {extra}/>'
def ellipse(x,y,rx,ry,fill,extra=''): return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'
def rect(x,y,w,h,fill,r=0,extra=''): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" {extra}/>'
def line(d,c,w=1,extra=''): return path(d,'none',f'stroke="{c}" stroke-width="{w}" stroke-linecap="round" {extra}')
def bolt(x,y): return ellipse(x,y,5,5,'#211f1b')+ellipse(x-1,y-1,3.5,3.5,'#b28a59')+line(f'M{x-2} {y-1}h4','#473b2d')
def defs():
 s='<defs>'
 for name,stops in {'wall':['#26383a','#142126','#0a1218'],'fog':['#879c9e','#526f79','#243f4b'],'wood':['#92704c','#604331','#302a24'],'copper':['#e4bd7d','#a3744c','#594535','#292a27'],'enamel':['#456462','#263e40','#111f25'],'glass':['#9eccc5','#4d817c','#203c42'],'paper':['#d2bd92','#9a8866'],'shade':['#d6ac70','#75543b','#263331']}.items():
  s+=f'<linearGradient id="{name}" x1="0" y1="0" x2=".8" y2="1">'+''.join(f'<stop offset="{i/(len(stops)-1)}" stop-color="{c}"/>' for i,c in enumerate(stops))+'</linearGradient>'
 s+='<radialGradient id="warm"><stop stop-color="#ffd597" stop-opacity=".38"/><stop offset="1" stop-color="#efb876" stop-opacity="0"/></radialGradient><linearGradient id="quiet"><stop stop-color="#0a1218" stop-opacity=".96"/><stop offset=".42" stop-color="#10191d" stop-opacity=".88"/><stop offset=".64" stop-color="#10191d" stop-opacity="0"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="16"/></filter><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".62" numOctaves="3" seed="19"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".018"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter><clipPath id="window"><path d="M900 130Q900 98 936 98H1770V730H900Z"/></clipPath></defs>'
 return s

def room():
 s=rect(0,0,1920,1080,'url(#wall)')
 # recessed window, broad stone reveal
 s+=path('M867 110Q867 64 920 64H1810V766H867Z','#101b21')
 s+=path('M880 115Q880 78 926 78H1796V748H880Z','#425355')
 s+='<g clip-path="url(#window)">'+rect(890,90,900,650,'url(#fog)')
 # distant irregular skyline
 for x,w,h in [(903,75,94),(988,60,135),(1060,95,76),(1169,73,170),(1257,113,100),(1394,63,137),(1466,100,70),(1587,68,165),(1678,110,112)]:
  y=480-h
  s+=path(f'M{x} 490V{y}l{w*.25} -10 {w*.75} 5V490Z','#536c75')
  s+=rect(x+w*.4,y-30,9,30,'#536c75')
 s+=line('M1138 473V215L1410 240 1138 266 1049 302M1138 218l-48 241M1138 266l52 199M1366 244v117','#4a626b',7)
 s+=line('M1138 218 1280 252 1138 266M1138 330l-32 40 65 48-71 37','#6d858a',2)
 s+=ellipse(1430,458,480,62,'#a6b4b1','opacity=".18" filter="url(#blur)"')
 # near warehouses and second crane
 s+=path('M930 642V523l99-53 103 43v129ZM1455 649V493l115-29 186 46v139Z','#294550')
 s+=path('M1442 497l127-44 199 51-7 13-191-45-123 38Z','#203842')
 s+=line('M1678 510V235l-154 64 237 11M1678 236l48 273M1532 301v112','#2d4852',9)
 s+=line('M1678 252l-92 49 136 0M1678 335l20 55-34 53 49 44','#52707a',2)
 for x,y in [(969,552),(1010,552),(1068,552),(1502,535),(1550,535),(1640,545),(1705,545),(1220,461),(1322,474)]:
  s+=rect(x,y,7,13,'#d2b581',1)+ellipse(x+3,y+6,18,20,'#e8c184','opacity=".10"')
 s+=path('M1164 622l29 27h196l41-30-95 8v-27h-65v-28h-31v52Z','#253e47')
 for i in range(17):
  x=random.randint(935,1740); y=random.randint(667,720)
  s+=line(f'M{x} {y}h{random.randint(12,69)}','#9ab0b2',1,'opacity=".19"')
 s+='</g>'
 # thick mullions and cold bevels
 for x in [900,1192,1488,1770]:
  s+=rect(x,98,19,638,'#182b32')+rect(x+19,104,3,625,'#7e9190',extra='opacity=".55"')
 s+=rect(900,400,890,17,'#1c3037')+rect(902,417,882,3,'#78918f',extra='opacity=".45"')
 s+=path('M866 740H1815l35 35H846Z','url(#enamel)')+line('M870 744h935','#81908a',3)
 # light staining, not repeating masonry
 s+=path('M1860 0h60v1080h-60Z','#101c22')+line('M1857 0v833','#53615c',3,'opacity=".25"')
 s+=ellipse(1350,651,520,400,'url(#warm)')
 # workbench perspective
 s+=path('M0 869 1920 810v173L0 1045Z','url(#wood)')
 for y in [905,965,1018]: s+=line(f'M0 {y} 1920 {y-55}','#302920',3)
 for i in range(50):
  x=random.randint(780,1910); y=random.randint(849,995); length=random.randint(25,150)
  s+=line(f'M{x} {y}q{length*.45} -5 {length} -4','#c39560' if i%3==0 else '#322c25',random.choice([.7,1,1.5]),'opacity=".26"')
 s+=path('M0 1045 1920 983v97H0Z','#29241f')+line('M0 1045 1920 983','#b18552',4)
 s+=rect(840,1030,380,50,'#201f1c',5)+rect(1340,1015,450,65,'#24221e',5)
 s+=rect(1470,1040,135,9,'url(#copper)',4)
 return s

def cabinet():
 s=ellipse(1372,896,355,38,'#080f13','opacity=".85" filter="url(#blur)"')
 s+=path('M1060 800h54v101h-64ZM1626 790h50v98h-59Z','#131d20')
 s+=path('M1074 447Q1075 401 1126 390L1568 372Q1627 370 1660 438l51 360-47 77-594 21-29-56Z','#101d23')
 s+=path('M1568 385l82 52 51 358-39 68-53-39-36-411Z','url(#copper)')
 s+=path('M1071 465Q1071 422 1120 409l434-22q45 0 62 45l40 386-576 35Z','url(#copper)')
 s+=path('M1092 467q0-30 34-35l415-22q36-1 42 38l32 353-518 23Z','url(#enamel)')
 s+=path('M1096 473q0-35 35-38l410-22q30-3 37 33l5 54-484 19Z','#263a3b')
 s+=line('M1127 435 1541 413q24-1 30 27','#9aa99a',2,'opacity=".6"')
 # two genuinely glass inset gauges
 for x,y,r in [(1162,477,29),(1243,473,23)]:
  s+=ellipse(x+2,y+3,r+5,r+5,'#142225')+ellipse(x,y,r+4,r+4,'url(#copper)')+ellipse(x,y,r,r,'url(#paper)')
  s+=path(f'M{x-r+7} {y+6}a{r-8} {r-8} 0 0 1 {2*r-14} 0','none', 'stroke="#615d4c" stroke-width="2"')+line(f'M{x} {y}l12 -14','#394645',2)
  s+=path(f'M{x-r+5} {y-9}q18 -20 {r+10} -6l-8 7q-18-9-24 1Z','#fff4d4','opacity=".3"')
 s+=rect(1320,444,192,37,'#18292e',8)+rect(1332,452,137,17,'#354d49',4)+ellipse(1492,461,5,5,'#efc685')
 # dark 5 x 4 recessed plate, subtle volumes, no icons/text
 s+=path('M1108 538 1572 516l22 267-473 25Z','#111b21')+line('M1108 538 1572 516l22 267','#8b6745',7)
 for row in range(4):
  for col in range(5):
   x=1121+col*91; y=551+row*61-col*4
   s+=path(f'M{x} {y}l78 -4 3 48-79 4Z','#263a3c')+line(f'M{x+2} {y+47}l76 -4','#61736b',1,'opacity=".38"')+path(f'M{x} {y}l78 -4-1 7-71 3 1 41-7 1Z','#0c181e')
 s+=path('M1083 853l577-29-9 38-560 26Z','url(#copper)')
 s+=line('M1093 853l560-27','#e5bd81',2,'opacity=".7"')
 for x,y in [(1102,456),(1578,430),(1090,829),(1632,814),(1280,862),(1537,850)]: s+=bolt(x,y)
 # few enamel chips on stressed edge and repaired plate
 s+=path('M1098 782l7-3 2 9-5 13-6-2ZM1558 505l9-3 2 7-6 3Z','#ac8355')
 s+=path('M1645 596l30-2 7 89-29 4Z','#6b7769')+bolt(1657,607)+bolt(1670,675)
 s+=line('M1684 550q68 2 68 55v110q0 31-46 37','#0b171c',24)+line('M1684 550q68 2 68 55v110q0 31-46 37','url(#copper)',16)
 s+=ellipse(1747,635,15,7,'#202e31')+ellipse(1747,649,15,7,'#202e31')
 return s

def lamp():
 s=line('M1740 820 1779 471 1643 227 1475 246','#0e191d',19)+line('M1740 820 1779 471 1643 227 1475 246','url(#copper)',11)
 for x,y in [(1779,471),(1643,227)]: s+=ellipse(x,y,18,18,'#192a2e')+ellipse(x-2,y-2,12,12,'url(#copper)')+bolt(x,y)
 s+=path('M1475 233q-76-10-114 83l184 29q-9-95-70-112Z','url(#shade)')
 s+=ellipse(1453,331,94,18,'#202a2b','transform="rotate(9 1453 331)"')+ellipse(1453,333,82,11,'#efcc92','transform="rotate(9 1453 333)"')
 s+=line('M1383 278q26-35 63-33','#e6c28d',3,'opacity=".6"')
 s+=path('M1380 341 1090 846q340 70 640-18l-202-477Z','#f4ca8d','opacity=".045"')
 return s

def props():
 s=''
 # unlabeled ledger, edge stacked pages, ribbon
 s+=ellipse(971,906,131,17,'#101718','opacity=".8"')
 s+=path('M845 874l167-35 97 52-169 40Z','#312f2a')+path('M855 870l159-27 78 43-158 33v-12Z','url(#paper)')+path('M845 858l171-29 92 53-171 34Z','#47514a')+line('M850 860l84 49 167-29','#89917a',2)+path('M946 850l14-2 51 40-14 4Z','#97624b')
 # flask with liquid meniscus and thick glass edges
 s+=ellipse(1815,896,57,13,'#10191b')
 s+=path('M1800 735h26v51q1 9 25 37 24 62-30 69-61 0-47-57l26-49Z','url(#glass)','fill-opacity=".50" stroke="#86a7a1" stroke-width="2"')
 s+=path('M1781 847q33 7 62-4l5 23q-1 24-33 22-39-3-34-41Z','#6b9c8b','opacity=".65"')+ellipse(1815,846,32,5,'#a3c3ad','opacity=".6"')
 s+=line('M1805 793q-26 37-24 61M1804 742v32','#d3dfcd',4,'opacity=".65"')+rect(1797,730,32,10,'url(#copper)',3)
 # pot, individually shaped leaves
 s+=ellipse(979,827,63,12,'#101a1c')+path('M935 762h81l-10 62q-32 17-62 0Z','url(#copper)')+ellipse(975,763,44,12,'#544737')+ellipse(975,761,36,7,'#232e29')
 s+=line('M976 763q-12-63 17-120M970 729l-32-39M979 711l35-32','#648477',3)
 for d in ['M980 710q-53-1-51-44 40 4 51 44Z','M983 694q42-3 54-41-47 2-54 41Z','M986 674q-28-23-16-59 26 17 16 59Z','M993 651q40-9 38-45-32 6-38 45Z','M965 740q-44 5-50-23 36-8 50 23Z']:
  s+=path(d,'url(#glass)')
 # small violet mineral in a sample tray, restrained fantasy
 s+=ellipse(1846,961,63,13,'#182021')+path('M1794 933l87-8 29 26-91 15Z','url(#copper)')+path('M1818 939l12-35 22-14 20 35-14 22Z','#79768e')+path('M1830 904l22-14-9 42-25 7Z','#aaa1b1')+path('M1843 932l9-42 20 35-14 22Z','#514f69')
 return s

base=room()
welcome=base+cabinet()+lamp()+props()+rect(0,0,1920,1080,'url(#quiet)')
for name,body in [('welcome-workshop',welcome),('room-workshop',base+lamp()+props()+rect(0,0,1920,1080,'#0d191e',extra='opacity=".28"'))]:
 svg='<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+defs()+'<g filter="url(#grain)">'+body+'</g></svg>'
 (out/(name+'.svg')).write_text(svg,encoding='utf-8')
# transparent edge structure. Interior x72..928 y62..640 stays unpainted.
s=''
s+=path('M18 79V43Q18 7 58 7H942q40 0 40 36v36h-45V52H63v27Z','url(#copper)')
s+=path('M61 15h877v24H61Z','url(#enamel)')
s+=path('M363 9h274l21 29H342Z','url(#shade)')+ellipse(500,39,152,7,'#dec391','opacity=".65"')
for x in [9,951]:
 s+=rect(x,87,40,528,'url(#enamel)',12)+rect(x+8,100,11,501,'url(#copper)',5)
 s+=rect(x+3,184,30,13,'#253538',3)+rect(x+3,500,30,13,'#253538',3)
 s+=ellipse(x+20,345,17,24,'#0f1f26')+ellipse(x+18,342,12,18,'url(#copper)')
 for y in [117,583]: s+=bolt(x+28,y)
s+=path('M18 627h43v27h878v-27h43v31q0 36-40 36H58q-40 0-40-36Z','url(#copper)')+rect(72,663,856,22,'url(#enamel)',5)
s+=line('M80 661h840','#c9ad7f',2,'opacity=".5"')
for x in [85,310,690,914]: s+=bolt(x,25)+bolt(x,676)
(out/'machine-frame.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">'+defs()+'<g filter="url(#grain)">'+s+'</g></svg>',encoding='utf-8')
print('Built three original SVG assets.')
