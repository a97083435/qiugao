import { Quark } from "../lib/quark.js";  
import { Baidu } from "../lib/baidu.js";  
import {cheerio} from 'assets://js/lib/cat.js';

const DOM_CFG = {
    "玩偶": [
        "https://wogg.xxooo.cf",
        "https://wogg.333232.xyz",
        "https://woggpan.333232.xyz",
        "https://wogg.heshiheng.top",
        "https://www.wogg.one",
        "https://www.wogg.lol"
    ],
    "至臻": [
        "https://www.mihdr.top",
        "https://www.zhizhenpan.fun",
        "http://zzzy.shop"
    ],
    "蜡笔": [
        "http://www.labi88.sbs",
        "https://feimao666.fun",
        "http://feimo.fun"
    ],
    "木偶": [
        "http://123.666291.xyz",
        "https://mogg.5568.eu.org",
        "https://mo.666291.xyz",
        "http://666.666291.xyz",
        "https://mo.muouso.fun"
    ],
    "小米": [
        "https://www.54271.fun",
        "https://54271.fun",
        "https://www.mucpan.cc",
        "https://mucpan.cc"
    ],
    "百家": [
        "https://bj.jiexi.news",
        "http://baijia.filegear-sg.me",
        "http://cj.jiexi.news",
        "http://baijia.885525.xyz"
    ],
    "二小": [
        "https://xhww.net",
        "https://erxiaofn.site",
        "https://erxiaofn.click",
        "https://www.xhww.net"
    ],
    "多多": [
        "https://tv.yydsys.top",
        "https://tv.yydsys.cc"
    ],
    "虎斑": [
        "http://103.45.162.207:20720",
        "http://xsayang.fun:12512"
    ],
    "欧歌": [
        "https://woog.xn--dkw.xn--6qq986b3xl",
        "https://woog.nxog.eu.org"
    ]
};

let host = ''; 
let apitype = '';
let headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"};
let line_order = ['百度', '夸克'];
let download_threads = '32'; // 默认线程数
let enable_quark_original = false; // 默认关闭夸克原画

let cachedClasses = [];
let cachedFilters = {};


async function init(cfg) {
    cfg = cfg.ext ? cfg.ext : cfg;
    let quarkCookie = "";
    let baiduCookie = "";
    let selectedConfig = "至臻";
    let siteOrder = "";
    let customLineOrder = null;
    let customThreads = null;
    let customQuarkOriginal = null;
    
    if (cfg) {
        if (typeof cfg === 'object') {
            quarkCookie = cfg.quark_cookie || "";
            baiduCookie = cfg.baidu_cookie || "";
            customLineOrder = cfg.line_order || null;
            customThreads = cfg.threads || null; 
            customQuarkOriginal = cfg.quark_original !== undefined ? cfg.quark_original : null;
        } else if (typeof cfg === 'string') {
            const [url, order] = cfg.split('$');
            try {
                const html = await request(url);
                const json = JSON.parse(html);
                quarkCookie = json.quark_cookie || "";
                baiduCookie = json.baidu_cookie || "";
                siteOrder = order?.trim() || "";
                customLineOrder = json.line_order || null;
                customThreads = json.threads || null; 
                customQuarkOriginal = json.quark_original !== undefined ? json.quark_original : null;
            } catch (e) {
                console.error('解析配置失败:', e.message);
            }
        }
    }
    
    // 设置线路顺序
    line_order = customLineOrder?.length ? customLineOrder : line_order;
    console.log('线路顺序:', line_order);
    
    // 设置统一的下载线程数
    download_threads = customThreads || download_threads;
    console.log('下载线程数:', download_threads);
    
    // 设置夸克是否开启原画
    enable_quark_original = customQuarkOriginal !== null ? customQuarkOriginal : enable_quark_original;
    console.log('夸克原画:', enable_quark_original ? '开启' : '关闭');
    
    if (quarkCookie?.length > 10) {
        Quark.cookie = quarkCookie;
        console.log('夸克Cookie已设置');
    } else {
        console.log('夸克Cookie未设置或长度不足');
    }
    
    if (baiduCookie?.length > 10) {
        Baidu.cookie = baiduCookie;
        console.log('百度Cookie已设置');
    } else {
        console.log('百度Cookie未设置或长度不足');
    }
    
    if (siteOrder) {
        for (const [key] of Object.entries(DOM_CFG)) {
            if (siteOrder.includes(key)) {
                selectedConfig = key;
                break;
            }
        }
    }
    
    const domains = DOM_CFG[selectedConfig];
    
    for (const domain of domains) {
        try {
            const response = await req(domain, {method: 'GET', headers, timeout: 3000});
            const status = parseInt(response.status || response.code || 0);
            
            if (status >= 200 && status < 400) {
                host = domain;
                headers.Referer = host + "/";
                break;
            }
        } catch (e) {}
    }
    
    if (!host) {
        console.error('未找到可用域名');
    }
    
    apitype = await ApiType();
    
    if (host) {
        try {
            const html = await request(host);
            const classes = [];
            const seenTypeIds = new Set();
            
            const navItems = pdfa(html, '.nav-menu-items&&li');
            
            navItems.forEach((item) => {
                const href = pd(item, 'a&&href', host).trim();
                const typeName = pdfh(item, 'a&&Text').trim();
                const match = href.match(/\/([^\/]+)\.html$/);
                
                if (match && typeName && !seenTypeIds.has(match[1])) {
                    const typeId = match[1];
                    if (/^\d+$/.test(typeId)) {
                        classes.push({"type_name": typeName, "type_id": typeId});
                        seenTypeIds.add(typeId);
                    }
                }
            });
            
            cachedClasses = classes;
            
            if (classes.length > 0) {
                const firstTypeId = classes[0].type_id;
                try {
                    const sampleUrl = apitype === "vodshow" ? 
                        `${host}/vodshow/${firstTypeId}-----------.html` : 
                        `${host}/index.php/vod/show/id/${firstTypeId}.html`;
                    
                    const sampleHtml = await request(sampleUrl);
                    const firstFilters = await getFilters(firstTypeId, sampleHtml);
                    
                    classes.forEach(cls => {
                        cachedFilters[cls.type_id] = [...firstFilters];
                    });
                } catch (filterError) {
                    console.error('获取筛选条件失败:', filterError.message);
                    classes.forEach(cls => {
                        cachedFilters[cls.type_id] = [];
                    });
                }
            }
        } catch (error) {
            console.error('获取分类数据失败:', error.message);
            cachedClasses = [];
            cachedFilters = {};
        }
    }
    
    return JSON.stringify({});
}

async function home(filter) {
    if (cachedClasses.length > 0) {
        return JSON.stringify({
            class: cachedClasses, 
            filters: cachedFilters
        });
    }
    
    return JSON.stringify({
        class: [], 
        filters: {}
    });
}

function getList(html) {
    const videos = [];
    const items = pdfa(html, ".module-items .module-item");
    
    items.forEach((it) => {
        const name = pdfh(it, "a&&title");
        const pic = pd(it, "img&&data-src", host);
        const desc = pdfh(it, ".module-item-text&&Text");
        const url = pd(it, "a&&href", host);
        
        if (name && url) {
            videos.push({
                "vod_id": url,
                "vod_name": name,
                "vod_pic": pic,
                "vod_remarks": desc || ""
            });
        }
    });
    
    return videos;
}

async function homeVod() {
    try {
        const html = await request(host);
        return JSON.stringify({ list: getList(html) });
    } catch (error) {
        console.error('首页推荐加载失败:', error.message);
        return JSON.stringify({ list: [] });
    }
}

async function category(tid, pg, filter, extend) {
    const p = pg || 1;
    const fl = extend || {};
    let url = '';
    
    if (apitype === "vodshow") {
        url = `${host}/vodshow/${tid}-${fl.area || ''}-${fl.by || 'time'}-${fl.class || ''}--${fl.letter || ''}---${p}---${fl.year || ''}.html`;
    } else {
        const parts = [
            fl.area ? `area/${fl.area}` : '',
            fl.by ? `by/${fl.by}` : '',
            fl.class ? `class/${fl.class}` : '',
            fl.cateId ? `id/${fl.cateId}` : `id/${tid}`,
            fl.lang ? `lang/${fl.lang}` : '',
            fl.letter ? `letter/${fl.letter}` : '',
            fl.year ? `year/${fl.year}` : ''
        ].filter(Boolean);
        
        url = `${host}/index.php/vod/show/${parts.join('/')}/page/${p}.html`;
    }
    
    try {
        const html = await request(url);
        const videos = getList(html);
        return JSON.stringify({list: videos, page: p, pagecount: 999, limit: 20, total: 999});
    } catch (error) {
        console.error('分类获取失败:', error.message);
        return JSON.stringify({list: [], page: p, pagecount: 1, limit: 20, total: 0});
    }
}

async function detail(id) {
    try {
        let html = await request(id);
        
        let vod_name = pdfh(html, '.video-info h1&&Text') || pdfh(html, 'h1&&Text') || '未知名称';
        let type_name = pdfh(html, '.tag-link&&Text') || '未知类型';
        let vod_pic = pd(html, '.lazyload&&data-original||.lazyload&&data-src||img&&src', host) || '';
        let vod_content = pdfh(html, '.sqjj_a--span&&Text') || pdfh(html, '.video-info-content&&Text') || '暂无简介';
        let vod_remarks = pdfh(html, '.video-info-items:eq(3)&&Text') || '未知';
        let vod_year = pdfh(html, '.tag-link:eq(2)&&Text') || '未知年份';
        let vod_area = pdfh(html, '.tag-link:eq(3)&&Text') || '未知地区';
        let vod_actor = pdfh(html, '.video-info-actor:eq(1)&&Text') || '未知演员';
        let vod_director = pdfh(html, '.video-info-actor:eq(0)&&Text') || '未知导演';
        
        let playFrom = [], playUrl = [];
        let data = pdfa(html, '.module-row-title');
        
        let panCounters = {'夸克': 1, '百度': 1};
        let allLines = [];
        
        data.forEach((item) => {
         //   let html = cheerio.html(item);
            let text = pdfh(item, 'p&&Text');
            if (text) {
                let link = text.trim();
                if (/\.quark/.test(link)) allLines.push({ type: '夸克', link: link });
                else if (/\.baidu/.test(link)) allLines.push({ type: '百度', link: link });
            }
        });
        
        for (let item of allLines) {
            try {
                if (item.type === '夸克') {
                    let shareData = Quark.getShareData(item.link);
                    if (shareData) {
                        let videos = await Quark.getFilesByShareUrl(shareData);
                        let lineName = '夸克#' + panCounters.夸克;
                        
                        if (videos && videos.length > 0) {
                            let url = videos.map(v => `${v.file_name}$${[shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle?.fid || '', v.subtitle?.share_fid_token || ''].join('*')}`).join('#');
                            
                            playFrom.push(lineName);
                            playUrl.push(url);
                            panCounters.夸克++;
                        } 
                    }
                }
                else if (item.type === '百度') {
                    let baiduData = await Baidu.getShareData(item.link);
                    if (baiduData && Object.keys(baiduData).length > 0) {
                        Object.keys(baiduData).forEach((it, index) => {
                            let lineName = '百度#' + panCounters.百度;
                            const url = baiduData[it].map(item => item.name + "$" + [item.path, item.uk, item.shareid, item.fsid].join('*')).join('#');
                            
                            playFrom.push(lineName);
                            playUrl.push(url);
                            panCounters.百度++;
                        });
                    }
                }
            } catch (error) {
                console.error(`${item.type}解析失败:`, error.message);
            }
        }
        
        if (playFrom.length > 0) {
            let sortedLines = playFrom.map((name, index) => ({
                name, 
                url: playUrl[index], 
                type: name.split('#')[0]
            })).sort((a, b) => {
                let aIndex = line_order.indexOf(a.type);
                let bIndex = line_order.indexOf(b.type);
                if (aIndex === -1) aIndex = Infinity;
                if (bIndex === -1) bIndex = Infinity;
                return aIndex - bIndex;
            });
            
            let sorted = sortedLines.filter(line => !/(无名|失效)/.test(line.url));
            
            playFrom = sorted.map(line => line.name);
            playUrl = sorted.map(line => line.url);
        }
        
        let vod = {
            'vod_id': id,
            'vod_name': vod_name,
            'vod_pic': vod_pic,
            'vod_content': vod_content,
            'vod_remarks': vod_remarks,
            'vod_year': vod_year,
            'vod_area': vod_area,
            'vod_actor': vod_actor,
            'vod_director': vod_director,
            'type_name': type_name,
            'vod_play_from': playFrom.join('$$$'),
            'vod_play_url': playUrl.join('$$$')
        };
        
        return JSON.stringify({ list: [vod] });
        
    } catch (error) {
        console.error('详情页加载失败:', error.message);
        return JSON.stringify({ list: [] });
    }
}

async function search(wd, quick, pg) {
    const p = pg || 1;
    let url = '';
    
    if (apitype === "vodshow") {
        url = `${host}/vodsearch/${wd}----------${p}---.html`;
    } else {
        url = `${host}/index.php/vod/search/page/${p}/wd/${encodeURIComponent(wd)}.html`;
    }
    
    try {
        const html = await request(url);
        const data = pdfa(html, '.module-items .module-search-item');
        const videos = [];
        
        data.forEach((it) => {
            const name = pdfh(it, '.video-info&&a&&title');
            const pic = pd(it, 'img&&data-src', host);
            const desc = pdfh(it, '.module-item-text');
            const url = pd(it, '.video-info&&a&&href', host);
            
            if (name && url) {
                videos.push({
                    "vod_id": url,
                    "vod_name": name,
                    "vod_pic": pic,
                    "vod_remarks": desc || ""
                });
            }
        });
        
        const filteredResults = videos.filter(item => {
            const title = item.vod_name || '';
            return title.toLowerCase().includes(wd.toLowerCase());
        });
        
        return JSON.stringify({ 
            list: filteredResults,
            page: p,
            pagecount: 10,
            limit: 20,
            total: 100
        });
    } catch (error) {
        console.error('搜索失败:', error.message);
        return JSON.stringify({ 
            list: [],
            page: p,
            pagecount: 1,
            limit: 20,
            total: 0
        });
    }
}

async function play(flag, id, flags) {
    let urls = [];
    let ids = id.split('*');
    
    if (flag.startsWith('夸克')) {
        if (ids.length >= 4) {
            let [shareId, stoken, fid, share_fid_token] = ids;
            
            try {
                let down = await Quark.getDownload(shareId, stoken, fid, share_fid_token, true);
                
                if (down && down.download_url) {
                    let headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'origin': 'https://pan.quark.cn',
                        'referer': 'https://pan.quark.cn/',
                        'Cookie': Quark.cookie || ''
                    };
                    
                    // 根据夸克原画配置决定是否添加原画
                    if (enable_quark_original) {
                        urls.push("原画", `${down.download_url}#threads=${download_threads}#`);
                    }
                    
                    try {
                        let transcoding = (await Quark.getLiveTranscoding(shareId, stoken, fid, share_fid_token)).filter((t) => t.accessable);
                        transcoding.forEach((t) => {
                            let resolutionName = t.resolution === 'low' ? "流畅" : 
                                                t.resolution === 'high' ? "高清" : 
                                                t.resolution === 'super' ? "超清" : 
                                                t.resolution === '4k' ? "4K" :
                                                t.resolution === 'dolby_vision' ? "HDR" :
                                                "正常";
                            urls.push(resolutionName, `${t.video_info.url}#threads=${download_threads}#`);
                        });
                    } catch (e) {
                        console.log('夸克转码获取失败:', e.message);
                    }
                    
                    return JSON.stringify({
                        parse: 0,
                        url: urls,
                        header: headers
                    });
                }
            } catch (error) {
                console.error('夸克播放解析错误:', error.message);
            }
        }
    }
    else if (flag.startsWith('百度')) {
        if (ids.length >= 4) {
            let [path, uk, shareid, fsid] = ids;
            
            try {
                let url = await Baidu.getAppShareUrl(path, uk, shareid, fsid);
                if (url) {
                    // 百度直接返回原画
                    urls = ["原画", `${url}#fastPlayMode##threads=${download_threads}#`];
                    
                    return JSON.stringify({
                        parse: 0,
                        url: urls,
                        header: {
                            "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;'
                        }
                    });
                }
            } catch (error) {
                console.error('百度播放解析错误:', error.message);
            }
        }
    }
    
    return JSON.stringify({
        parse: 0,
        url: ["错误", "播放解析失败"],
        header: headers
    });
}

async function request(url, obj = {headers, timeout: 50000}) {
    try {
        const response = await req(url, obj);
        return response.content;
    } catch (error) {
        console.error(`请求失败: ${url}`, error.message);
        return '';
    }
}

async function ApiType() {
    if (!host) return "index.php";
    
    try {
        const response = await req(`${host}`, { 
            method: 'GET', 
            headers,
            timeout: 3000 
        });
        
        const content = response.content || '';
        console.log(`API检测响应长度: ${content.length}字节`);
        
        // 判断响应中是否包含vodshow
        if (content.includes('vodshow')) {
            console.log(' 检测到vodshow，返回vodshow类型');
            return "vodshow";
        }
        
        // 判断响应中是否包含show
        if (content.includes('show')) {
            console.log(' 检测到show，返回show类型');
            return "index.php";
        }
        
        console.log('未检测到关键词，使用默认show类型');
    } catch (e) {
        console.log(`API检测失败: ${e.message}`);
    }
    
    return "index.php";
}


async function getFilters(type_id, html) {
    const categories = [
        {key: 'cateId', name: '类型', reg: /\/id\/(\d+)/},
        {key: 'class', name: '剧情'},
        {key: 'lang', name: '语言'},
        {key: 'area', name: '地区'},
        {key: 'year', name: '时间'},
        {key: 'letter', name: '字母'},
    ];
    
    const sort_options = {
        "时间排序": "time",
        "人气排序": "hits", 
        "评分排序": "score",
    };
    
    let filters = [];
    categories.forEach((category) => {
        const libraryBoxes = pdfa(html, '.library-box');
        const box = libraryBoxes.find(box => pdfh(box, 'a&&Text').includes(category.name));
        
        let values = [];
        
        if (box) {
            const filterItems = pdfa(box, 'div a');
            values = filterItems.map(a => {
                const n = pdfh(a, "a&&Text") || "全部";
                let v = n;
                
                if (category.key === 'cateId') {
                    const href = pd(a, 'a&&href', host);
                    const match = href.match(category.reg);
                    v = match ? match[1] : n;
                }
                
                return { n, v };
            }).filter(x => x.n && x.v);
        }
        
        if (values.length > 3) {
            filters.push({
                key: category.key,
                name: category.name,
                value: values
            });
        }
    });
    
    const sortValues = Object.entries(sort_options).map(([name, value]) => ({
        n: name,
        v: value
    }));
    
    if (sortValues.length > 0) {
        filters.push({
            key: "by",
            name: "排序",
            value: sortValues
        });
    }
    
    return filters;
}


export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search,
    }
}