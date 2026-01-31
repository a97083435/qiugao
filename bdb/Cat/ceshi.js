/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '木兮·CMS',
  lang: 'cat'
})
*/

// ===== 可替换的 CMS 接口（可加多个）=====
let CMS = [
  "https://api.zuidapi.com/api.php/provide/vod",
  "https://api.ukuapi.com/api.php/provide/vod"
];

let UA = {
  "User-Agent": "Mozilla/5.0",
};

// ===== 过滤规则（保留你原来的风格）=====
let title_remove = ['广告', '破解', '测试'];
let line_remove = ['广告', '测试'];
let line_order = ['官方', '蓝光', '超清', '高清', '1080'];

// ===== 工具 =====
async function request(url) {
  try {
    return (await req(url, { headers: UA, timeout: 5000 })).content;
  } catch (e) {
    return '';
  }
}

function cleanTitle(t) {
  return !title_remove.some(w => t.includes(w));
}

function sortLines(from, urls) {
  let fs = from.split('$$$');
  let us = urls.split('$$$');

  let idx = fs.map((f, i) => ({ f, u: us[i] }));
  idx = idx.filter(i => !line_remove.some(w => i.f.includes(w)));

  idx.sort((a, b) => {
    const p = s => {
      for (let i = 0; i < line_order.length; i++) {
        if (s.includes(line_order[i])) return i;
      }
      return 99;
    };
    return p(a.f) - p(b.f);
  });

  return {
    from: idx.map(i => i.f).join('$$$'),
    url: idx.map(i => i.u).join('$$$')
  };
}

// ===== 初始化 =====
async function init(cfg) {
  if (cfg?.cms) CMS = cfg.cms;
}

// ===== 分类 =====
async function home() {
  let html = await request(`${CMS[0]}?ac=list`);
  let json = JSON.parse(html);
  let classes = json.class.map(c => ({
    type_id: c.type_id,
    type_name: c.type_name
  }));
  return JSON.stringify({ class: classes, filters: {} });
}

// ===== 首页推荐 =====
async function homeVod() {
  let html = await request(`${CMS[0]}?ac=videolist&pg=1`);
  let list = JSON.parse(html).list || [];
  return JSON.stringify({
    list: list.filter(v => cleanTitle(v.vod_name))
  });
}

// ===== 分类列表 =====
async function category(tid, pg) {
  let html = await request(`${CMS[0]}?ac=videolist&t=${tid}&pg=${pg}`);
  let json = JSON.parse(html);
  return JSON.stringify({
    page: pg,
    pagecount: json.pagecount,
    limit: json.limit,
    total: json.total,
    list: json.list.filter(v => cleanTitle(v.vod_name))
  });
}

// ===== 详情 =====
async function detail(id) {
  let html = await request(`${CMS[0]}?ac=detail&ids=${id}`);
  let vod = JSON.parse(html).list[0];

  let sorted = sortLines(vod.vod_play_from, vod.vod_play_url);
  vod.vod_play_from = sorted.from;
  vod.vod_play_url = sorted.url;

  return JSON.stringify({ list: [vod] });
}

// ===== 播放 =====
async function play(flag, id) {
  return JSON.stringify({ parse: 0, url: id });
}

// ===== 搜索 =====
async function search(wd, quick, pg) {
  let html = await request(`${CMS[0]}?ac=videolist&wd=${encodeURIComponent(wd)}&pg=${pg}`);
  let json = JSON.parse(html);
  return JSON.stringify({
    page: pg,
    pagecount: json.pagecount,
    limit: json.limit,
    total: json.total,
    list: json.list.filter(v => cleanTitle(v.vod_name))
  });
}

export function __jsEvalReturn() {
  return { init, home, homeVod, category, detail, play, search };
}
