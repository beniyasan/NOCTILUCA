// World metadata: palette, station and visit conditions per planet, plus the
// LIFE table of station names used by the platform background painter.
export const worlds=[
 {id:'kowloon',name:'ネオン九龍',en:'NEON KOWLOON',description:'眠らない街に、今日も青い雨が降る。',detail:'雨と看板、重なり合う屋根。軌道上に育った不夜城。',sector:'SECTOR 09 · ALT 8,400 KM',weather:'NEON RAIN / LOCAL 02:17',station:'九龍東ホーム',seed:9081,sky:['#060e21','#26122d','#a91b4f'],far:'#351b39',mid:'#261b31',near:'#131b29',trim:'#44505b',light:'#ffcd77',accent:'#66f7dd',neon:'#ff3974',haze:'#ce225d',planet:'#697b9c',kind:'neon',rain:1,chord:[110,164.81,220,261.63],conditions:[
   {weather:'NEON RAIN / LOCAL 02:17',note:'屋台通りの湯気が濃く、看板修理のドローンが低く飛ぶ。',traffic:1.15,particles:1.1,feature:'festival'},
   {weather:'POWER SAVE / LOCAL 01:26',note:'一部の広告塔が節電中。青い雨粒だけがいつもより目立つ。',traffic:.8,particles:.9,feature:'service'},
   {weather:'SIGNAL BURST / LOCAL 03:02',note:'終電帰りの小列車が多い夜。路地の灯りが一段と賑やか。',traffic:1.25,particles:1,feature:'train'}
 ]},
 {id:'scrap',name:'スクラップ・ベルト',en:'SCRAP BELT',description:'捨てられた船の骨組みに、今日の暮らしが灯っている。',detail:'宇宙ゴミと廃船の帯。切り開かれた船体に市場と工房が増築される。',sector:'SECTOR 18 · SALVAGE ORBIT',weather:'SALVAGE GLOW / LOCAL 22:48',station:'サルベージ中央停留所',seed:48721,sky:['#0a101b','#28232f','#73655a'],far:'#343038',mid:'#2a2d35',near:'#161d29',trim:'#6d6d73',light:'#ffd4a0',accent:'#8cf1df',neon:'#ff8c6b',haze:'#85767a',planet:'#8b8179',kind:'scrap',rain:0,chord:[92.5,138.59,185,246.94],conditions:[
   {weather:'SALVAGE GLOW / LOCAL 22:48',note:'クレーン群が忙しい。回収艇が新しい船殻を曳いて戻ってくる。',traffic:1.05,particles:.95,feature:'tug'},
   {weather:'WELDING HAZE / LOCAL 21:59',note:'溶接の火花が多く、作業床の店は少し早めの店じまい。',traffic:.75,particles:1.15,feature:'sparks'},
   {weather:'QUIET SHIFT / LOCAL 00:11',note:'夜勤の交代時間。食堂の灯りは残るが、クレーンの動きは穏やか。',traffic:.62,particles:.8,feature:'lantern'}
 ]},
 {id:'pelagic',name:'蒼海ドック',en:'PELAGIC DOCKS',description:'海の惑星で、星を運ぶ船が眠っている。',detail:'光る海と透明なドーム。巨大な星を望む宇宙港。',sector:'SECTOR 23 · OCEAN MOON',weather:'TIDAL LIGHT / LOCAL 04:38',station:'蒼海第3埠頭',seed:72034,sky:['#041425','#064358','#14807f'],far:'#164256',mid:'#173b4e',near:'#122c3a',trim:'#447278',light:'#bbe9b6',accent:'#71fff0',neon:'#43baff',haze:'#21a9ab',planet:'#a1c5b6',kind:'water',rain:0,chord:[98,146.83,196,246.94],conditions:[
   {weather:'TIDAL LIGHT / LOCAL 04:38',note:'干満の青い光が強い。遠くの浮体港には早朝便が集まっている。',traffic:1.0,particles:.75,feature:'leviathan'},
   {weather:'SEA MIST / LOCAL 05:12',note:'霧が海上高架を薄く包む。水面の反射がふだんより柔らかい。',traffic:.7,particles:.95,feature:'mist'},
   {weather:'HARVEST RUN / LOCAL 03:54',note:'養殖区画の整備艇が多く、小型船が頻繁に行き交う。',traffic:1.2,particles:.7,feature:'boats'}
 ]},
 {id:'gorge',name:'岩海峡谷',en:'STONE GORGE',description:'断崖の谷間で、小さな灯りが岩にしがみついている。',detail:'巨岩と峡谷、掘削拠点。列車は崖沿いを抜け、谷をまたぐ。',sector:'SECTOR 41 · BASALT CANYON',weather:'CINDER WIND / LOCAL 18:46',station:'峡谷リッジ駅',seed:67143,sky:['#191826','#403447','#8e6044'],far:'#4d3a43',mid:'#423338',near:'#2c2831',trim:'#83715f',light:'#ffd690',accent:'#d2e3a7',neon:'#ff9a68',haze:'#ca8a64',planet:'#b0896d',kind:'rock',rain:0,chord:[82.41,123.47,164.81,220],conditions:[
   {weather:'CINDER WIND / LOCAL 18:46',note:'谷風が強く、資材ゴンドラは慎重な速度で運行している。',traffic:.86,particles:1.0,feature:'gondola'},
   {weather:'AFTERBLAST / LOCAL 19:08',note:'遠い掘削音が断続的に響く。粉塵が夕焼けに混じって漂う。',traffic:.72,particles:1.18,feature:'blast'},
   {weather:'RIDGE CLEAR / LOCAL 17:59',note:'珍しく視界が良い日。遠くの岩棚まで見通せる。',traffic:1.02,particles:.62,feature:'beacon'}
 ]},
 {id:'jade',name:'翡翠ガーデン',en:'JADE GARDENS',description:'誰かが植えた森が、街ごと星を包んだ。',detail:'空中庭園と桜色の花。緑に還りつつある未来都市。',sector:'SECTOR 56 · BOTANICAL RING',weather:'PETAL DRIFT / LOCAL 05:12',station:'翡翠園前駅',seed:5381,sky:['#071c2b','#244f56','#899785'],far:'#2b5758',mid:'#234c49',near:'#152e32',trim:'#668779',light:'#ffe7a1',accent:'#93e9ba',neon:'#faa2c3',haze:'#80c6a2',planet:'#e7c1b3',kind:'garden',rain:0,chord:[130.81,196,261.63,329.63],conditions:[
   {weather:'PETAL DRIFT / LOCAL 05:12',note:'花びらが風の少ない回廊をゆっくり流れていく。',traffic:.78,particles:1.0,feature:'petals'},
   {weather:'GREENHOUSE GLOW / LOCAL 04:48',note:'温室群の灯りが強く、朝の手入れ車両が目立つ。',traffic:.92,particles:.72,feature:'tram'},
   {weather:'SOFT RAIN / LOCAL 06:01',note:'薄い保水雨。葉の輪郭が光を抱えて少しだけ銀色になる。',traffic:.68,particles:.95,feature:'rain'}
 ]},
 {id:'relay',name:'ナイト・リレー',en:'NIGHT RELAY',description:'人のいない星でも、灯りは誰かを待つ。',detail:'小惑星と深宇宙の通信基地。紫色の送信環がゆっくり巡る。',sector:'SECTOR 88 · DEEP SPACE',weather:'DEEP SILENCE / LOCAL --:--',station:'リレー88 接続環',seed:29832,sky:['#060b1b','#17172f','#412b53'],far:'#292541',mid:'#28283e',near:'#17202e',trim:'#58556c',light:'#ffba9b',accent:'#b3c7ff',neon:'#cc8bff',haze:'#894aa6',planet:'#59617c',kind:'void',rain:0,chord:[73.42,110,146.83,185],conditions:[
   {weather:'DEEP SILENCE / LOCAL --:--',note:'中継環は静かに回り、補修ポッドだけが時折灯りを引く。',traffic:.6,particles:.7,feature:'pods'},
   {weather:'MICROMETEOR / LOCAL --:--',note:'小さな破片が漂い、補修ポッドがいつもの点検を続ける。',traffic:.52,particles:1.18,feature:'debris'},
   {weather:'LONG RANGE LINK / LOCAL --:--',note:'遠距離通信の繁忙時間。無人搬送体が数珠つなぎで通り過ぎる。',traffic:1.1,particles:.78,feature:'convoy'}
 ]}
];
export const LIFE={
 neon:{landmark:'月光広告塔',shop:'月光食堂',shopEn:'MOON NOODLES',stationEn:'KOWLOON EAST',note:['屋台の湯気と、配達ドローン。いつもの夜が続いている。','広告塔のそばで、整備ドローンが点検している。','食堂の暖簾が揺れ、小さな列車が高架を渡っていく。']},
 scrap:{landmark:'旧移民船の船首',shop:'船底食堂',shopEn:'HULL CAFE',stationEn:'SALVAGE CENTRAL',note:['回収船が廃船を曳き、クレーンが荷を移している。','作業台のそばで、溶接の小さな光が灯っている。','交代時間の工房。船底の食堂から湯気が上がる。']},
 water:{landmark:'第3埠頭の灯台',shop:'潮待ち売店',shopEn:'TIDE & TEA',stationEn:'PELAGIC PIER 03',note:['整備艇が網のそばを通る。海の下には、大きな影。','薄い海霧の向こうで、いつもの灯台が光っている。','漁船がゆっくり帰港する。埠頭では網を引き上げている。']},
 rock:{landmark:'峡谷リッジの居住岩',shop:'岩棚休憩所',shopEn:'RIDGE CANTEEN',stationEn:'CANYON RIDGE',note:['谷を渡るゴンドラ。岩棚の昇降機は物資を運び続ける。','粉塵の向こうでも、崖の食堂には灯りがついている。','遠い岩棚まで見える日。作業員が昇降機を見送る。']},
 garden:{landmark:'翡翠の段々温室',shop:'こもれび茶房',shopEn:'LEAF & TEA',stationEn:'JADE GARDEN',note:['温室の手入れが始まる。花びらが通りを横切っていく。','散水機が葉を濡らす。庭師が鉢のそばを歩いている。','細い雨の温室。軒下には、いつもの小さな猫。']},
 void:{landmark:'88番中継環',shop:'無人補給スタンド',shopEn:'AUTOMAT / 88',stationEn:'RELAY 88',note:['整備ポッドが中継環を点検し、充電台へ帰っていく。','小さな破片がゆっくり流れる。補修灯は静かに点いている。','搬送ポッドが接続環を通る。無人のホームにも仕事がある。']}
};
