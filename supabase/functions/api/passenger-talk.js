// Passenger talk from the day's headlines (Lolipop edition only).
// Pure helpers: feed parsing, headline filtering, the model request body and
// validation of what comes back. Network and database access live in index.ts.

// NHK 暮らし / 科学・文化 / スポーツ: lighter than the main feed. Override with PASSENGER_TALK_FEEDS.
export const DEFAULT_FEEDS = [2, 3, 7].map((n) => `https://news.web.nhk/n-data/conf/na/rss/cat${n}.xml`);
// Headlines touching these never reach the model: the carriage is for small talk.
const HEAVY = ['死','殺','亡','遺体','事故','事件','地震','津波','災害','火災','噴火','豪雨','台風','被害','逮捕','容疑','起訴','裁判','判決','戦争','戦闘','紛争','攻撃','爆','テロ','ミサイル','軍','選挙','首相','大統領','政権','内閣','国会','議員','党','制裁','病','感染','虐待','詐欺','自殺','行方不明','避難','負傷','けが','重体','警察','送検','薬物','首脳','会談','大臣','政府','外交','関税','自民','立憲','公明','維新','原発','回収','障害','いじめ'];
const MARKS = new Set(['', '!', '~']);

// Day key in Japan time (the pool rolls over at midnight JST).
export function jstDay(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}

const decode = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').trim();

// RSS 2.0 / Atom titles, without pulling in an XML parser.
export function parseFeed(xml) {
  const items = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/g) || [];
  return items.map((item) => decode(item.match(/<title\b[^>]*>([\s\S]*?)<\/title>/)?.[1] || '')).filter(Boolean);
}

export function filterHeadlines(titles, limit = 16) {
  const seen = new Set();
  return titles.filter((t) => {
    if (t.length < 6 || t.length > 80 || seen.has(t) || HEAVY.some((w) => t.includes(w))) return false;
    seen.add(t); return true;
  }).slice(0, limit);
}

export const TALK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['talks'],
  properties: {
    talks: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['size', 'tone', 'lines'],
        properties: {
          size: { type: 'integer', enum: [2, 3] },
          tone: { type: 'string', enum: ['chat', 'quarrel'] },
          lines: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['who', 'text', 'mark'],
              properties: { who: { type: 'integer', enum: [0, 1, 2] }, text: { type: 'string' }, mark: { type: 'string', enum: ['', '!', '~'] } },
            },
          },
        },
      },
    },
  },
};

const SYSTEM = `あなたはドット絵の宇宙列車ゲーム「NOCTILUCA」の脚本係です。
舞台はサイバーパンクな宇宙。夜の環状線が九つの星を巡っています。
- ネオン九龍: 青い雨が降り続く、眠らない屋台と広告塔の街。看板修理のドローン、配膳ロボ、猫耳端末の店員。
- スクラップ・ベルト: 捨てられた宇宙船の骨組みに暮らす解体と溶接の街。回収艇、クレーン群、夜勤の食堂。
- 蒼海ドック: 海の惑星の港。発光する潮、浮体港、養殖区画、星を運ぶ貨物船。
- 岩海峡谷: 断崖にしがみつく採掘の町。資材ゴンドラ、谷風、掘削音、岩棚の灯り。
- 翡翠ガーデン: 星を包むほど育った森と温室の街。保水雨、手入れ車両、花びらの回廊。
- ナイト・リレー: 無人の中継環。補修ポッド、無人搬送体、遠距離通信。
- 深藍アビス: 海の底の気密ドームの街。珊瑚の居住塔、海溝の研究所、昆布の水耕畑、昇降管。
- 紅蓮カルデラ: 活火山のカルデラの鋳造と地熱の街。溶岩の運河、冷却塔、火口の縁の湯の町。
- 蒼穹アルカ: 雲の海に浮かぶ島々の街。吊り橋とゴンドラ、風車と凧、飛行船の港。
プレイヤーの向かいのロングシートに座った乗客同士の、何気ない短い会話を書いてください。

時事ネタの使い方(いちばん大事):
- 見出しの「何が起きたか」の芯は残し、舞台・名前・技術をこの世界のものに置き換える。数字や規模も少し変えてよい。
- 置き換えの例:
  ・「横手やきそばの食べ比べイベント」→「九龍の屋台通りで合成麺の食べ比べ祭り」
  ・「サンマが記録的な不漁」→「蒼海ドックで光る回遊魚が全然揚がらないらしい」
  ・「携帯電話の料金値上げ」→「中継環の通信料がまた上がるって」
  ・「探査機の打ち上げ前に管制室を公開」→「リレーの管制室が見学できるらしい、次の探査艇の前に」
- 元のニュースが分かる人には「あ、あれか」と思える程度に似せ、実在の人名・企業名・地名・国名・作品名は出さない。
- 同じ見出しを何本もの会話に使い回さない。見出しに合う星が無ければ、どの星の話にしてもよい。

守ること:
- 事件・事故・災害・政治・病気・人の不幸は話題にしない。食べ物、流行り物、新製品、スポーツ、祭り、発見、天気などの軽い話にする。
- 一行は28文字以内の自然な話し言葉。敬語は控えめ。説明口調や説教にしない。
- who は話し手の番号(二人組は0と1、三人組は0〜2)。同じ人が続けて話さない。
- 会話ごとに形を変える。行数は3〜7行でばらつかせ、同じ行数ばかりにしない。
- 話し始める人を毎回0にしない。三人組は「0→1→2→0」のような決まった順番にせず、二人だけのやりとりが続いてから残りの一人が口を挟む、なども混ぜる。
- 相づちだけの短い行(「へえ」「うん」「え、ほんと?」)や、途中で話がそれる会話も入れてよい。
- 3本に1本くらいは相手を名前で呼ぶ。名前は {n1} {n2} {n3} と書く(それぞれ話し手0,1,2の名前)。自分の名前は呼ばない。
- 今いる駅は {st}、次の行き先は {next} と書ける。たまに使う程度でよい。
- mark は、強い口調なら "!"、みんなが笑う場面なら "~"、それ以外は ""。
- tone が "quarrel" の会話は、ささいな口げんか(遅刻、忘れ物、返信、好みの違い)で、最後は仲直りか気まずい沈黙で終える。口げんかは時事ネタを使わなくてよい。`;

export function talkRequest({ model, headlines, batch, counts = { pairChat: 10, pairQuarrel: 4, trio: 8 } }) {
  const list = headlines.length ? headlines.map((h) => `- ${h}`).join('\n') : '- (今日は見出しなし。季節や身近な話題で)';
  return {
    model,
    reasoning: { effort: 'medium' },
    max_output_tokens: 12000,
    input: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `今日の見出し:\n${list}\n\nこれは今日の${batch}回目の依頼です。前回と違う組み合わせ・切り口で書いてください。\n二人組の雑談(size 2, tone chat)を${counts.pairChat}本、二人組の口げんか(size 2, tone quarrel)を${counts.pairQuarrel}本、三人組の雑談(size 3, tone chat)を${counts.trio}本。` },
    ],
    text: { format: { type: 'json_schema', name: 'passenger_talks', strict: true, schema: TALK_SCHEMA } },
  };
}

// Pull the JSON text out of a Responses API result.
export function responseText(result) {
  for (const item of result?.output || []) {
    if (item.type !== 'message') continue;
    for (const part of item.content || []) if (part.type === 'output_text' && typeof part.text === 'string') return part.text;
  }
  return '';
}

// Keep only talks that fit the seat: right speakers, short lines, nothing heavy.
export function sanitizeTalks(value) {
  const talks = Array.isArray(value?.talks) ? value.talks : [];
  const out = [];
  for (const t of talks) {
    if (![2, 3].includes(t?.size) || !['chat', 'quarrel'].includes(t?.tone) || (t.size === 3 && t.tone !== 'chat') || !Array.isArray(t.lines)) continue;
    const lines = [];
    for (const l of t.lines) {
      const text = typeof l?.text === 'string' ? l.text.replace(/[\r\n\t<>]/g, '').trim() : '';
      if (!Number.isInteger(l?.who) || l.who < 0 || l.who >= t.size || !text || [...text].length > 40 || !MARKS.has(l.mark)) continue;
      if (lines.length && lines.at(-1).who === l.who) continue;
      lines.push({ who: l.who, text, mark: l.mark });
    }
    if (lines.length < 3 || lines.length > 9 || lines.some((l) => HEAVY.some((w) => l.text.includes(w)))) continue;
    if (t.size === 3 && new Set(lines.map((l) => l.who)).size < 3) continue;
    out.push({ size: t.size, tone: t.tone, lines });
  }
  return out.slice(0, 40);
}
