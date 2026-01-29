import cheerio from 'assets://js/lib/cheerio.min.js';
import 'assets://js/lib/crypto-js.js';

let ext = '';
let host = 'https://www.aowu.tv';
let UA = {
"User-Agent": 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
};



async function request(url, obj) {
    if (!obj) {
        obj = {
            headers: UA,
            timeout: 5000
        }
    }
    const response = await req(url, obj);
    return response.content;
}

async function init(cfg) {
    // 统一处理为字符串配置
    ext = 'ext' in cfg ? cfg.ext : cfg;
    console.log(`ext参数类型: ${typeof ext}, 值:`, ext);
    
    // 只有当 ext 不为空字符串时才处理配置
    if (ext && ext.trim() !== '') {
        if (cfg && typeof cfg === 'string') {
            host = cfg;
        } else if (cfg && typeof cfg === 'object') {
            // 优先从对象中提取配置
            host = cfg.site || cfg.url || cfg.host || host;
        }
    }
    
    // 设置host
    host = host.replace(/\/$/, '');
    console.log(`host: ${host}`);
}

async function home(filter) {
    try {
        let kclassName = '新番$20&番剧$21&剧场$22';
        let classes = kclassName.split('&').map(item => {
            let [cName, cId] = item.split('$');
            return {type_name: cName, type_id: cId}; 
        });
        
        let filters = {};
        try {
            const nameObj = { class: 'class,剧情', year: 'year,年份', by: 'by,排序' };
            const flValues = { 
                class: ['搞笑','恋爱','校园','后宫','治愈','日常','原创','战斗','百合','BL','卖肉','漫画改','游戏改','异世界','泡面番','轻小说改','OVA','OAD','京阿尼','芳文社','A-1Pictures','CloverWorks','J.C.STAFF','动画工房','SUNRISE','Production.I.G','MADHouse','BONES','P.A.WORKS','SHAFT','MAPPA','ufotable','TRIGGER','WITSTUDIO'], 
                year: ['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001','2000','1999','1998','1997','1996','1995','1994','1993','1992','1991','1990'], 
                by: ['按最新,time', '按最热,hits', '按评分,score'] 
            };
            
            for (let item of classes) {
                filters[item.type_id] = Object.entries(nameObj).map(([nObjk, nObjv]) => {
                    let [kkey, kname] = nObjv.split(',');
                    let fvalue = flValues[nObjk] || [];
                    if (item.type_id === '20' && nObjk === 'year') {
                        fvalue = fvalue.slice(0, 2); // 新番只显示最近两年
                    }
                    let kvalue = fvalue.map(it => {
                        let [n, v] = [it, it];
                        if (nObjk === 'by') {
                            [n, v] = it.split(',');
                        }
                        return {n: n, v: v}; 
                    });
                    if (nObjk !== 'by') {
                        kvalue.unshift({n: '全部', v: ''});
                    }
                    return {key: kkey, name: kname, value: kvalue};
                }).filter(flt => flt.key && flt.value.length > 1);
            }
        } catch (e) {
            console.log('filters错误:', e.message);
            filters = {};
        }
        
        return JSON.stringify({class: classes, filters: filters});
    } catch (e) {
        console.log('home错误:', e.message);
        return JSON.stringify({class: [], filters: {}});
    }
}

async function homeVod() {
    try {
        let html = await request(host);
        let videos = [];
        let items = pdfa(html, '.public-list-box');
        
        items.forEach((it) => {
            let name = pdfh(it, 'a&&title');
            let pic = pd(it, '.lazy&&data-src', host);
            let desc = pdfh(it, '.ft2&&Text');
            let url = pd(it, 'a&&href', host);
            
            if (name && url) {
                videos.push({
                    "vod_id": url,
                    "vod_name": name,
                    "vod_pic": pic,
                    "vod_remarks": desc || ""
                });
            }
        });
        
        return JSON.stringify({ list: videos });
    } catch (e) {
        console.log('homeVod错误:', e.message);
        return JSON.stringify({ list: [] });
    }
}

async function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg, 10);
        pg = pg > 0 ? pg : 1;
        
        let cateBody = `type=${tid}&class=${extend?.class ?? ''}&year=${extend?.year ?? ''}&by=${extend?.by ?? ''}&page=${pg}`;
        let cateUrl = `${host}/index.php/ds_api/vod`;
        
        let apiResponse = await request(cateUrl, {
            headers: {...UA, 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            method: 'POST',
            body: cateBody,
            timeout: timeout
        });
        
        // 内联 JSON 解析
        let resObj;
        try {
            resObj = JSON.parse(apiResponse);
        } catch (e) {
            resObj = null;
        }
        
        if (!resObj) {
            throw new Error('API返回数据为空或解析失败');
        }
        
        let videos = [];
        let listArr = Array.isArray(resObj.list) ? resObj.list : [];
        
        for (let it of listArr) {
            let kname = it.vod_name || '名称';
            let kpic = it.vod_pic || '';
            let kremarks = `${it.vod_remarks || '状态'}|${it.vod_douban_score || '无评分'}`;
            let kid = it.url || '';
            
            if (kname && kid) {
                videos.push({
                    vod_id: `${host}${kid}`,
                    vod_name: kname,
                    vod_pic: kpic,
                    vod_remarks: kremarks
                });
            }
        }
        
        let {pagecount=1000, limit=30, total=30000} = resObj;
        return JSON.stringify({
            list: videos, 
            page: pg, 
            pagecount: pagecount, 
            limit: limit, 
            total: total
        });
    } catch (e) {
        console.log('category错误:', e.message);
        return JSON.stringify({ 
            list: [], 
            page: pg || 1,
            pagecount: 0,
            limit: 30,
            total: 0
        });
    }
}

async function detail(id) {
    try {
        let html = await request(id);
        let vod_name = pdfh(html, 'h3&&Text') || '未知';
        let vod_pic = pd(html, '.vodlist_thumb&&data-original', id) || '';
        let vod_content = pdfh(html, '.switch-box&&Text') || '暂无简介';
        
        // 提取详细信息
        let type_name = '', status = '', update = '', vod_year = '', vod_area = '', vod_lang = '', vod_director = '', vod_actor = '';
        let allLis = pdfa(html, '.search-show li');
        
        allLis.forEach(li => {
            let text = pdfh(li, 'li&&Text');
            if (text.includes('类型：')) type_name = text.replace('类型：', '').trim();
            else if (text.includes('状态：')) status = text.replace('状态：', '').trim();
            else if (text.includes('更新：')) update = text.replace('更新：', '').trim();
            else if (text.includes('年份：')) vod_year = text.replace('年份：', '').trim();
            else if (text.includes('地区：')) vod_area = text.replace('地区：', '').trim();
            else if (text.includes('语言：')) vod_lang = text.replace('语言：', '').trim();
            else if (text.includes('导演：')) vod_director = text.replace('导演：', '').replace(/,$/, '').trim();
            else if (text.includes('主演：')) vod_actor = text.replace('主演：', '').replace(/,$/, '').trim();
        });
        
        // 播放列表提取
        let playFrom = [], playUrl = [];
        let playlist = pdfa(html, '.anthology-list-play');
        let tabs = pdfa(html, '.anthology-tab a');
        
        tabs.forEach((item, i) => {
            const form = pdfh(item, 'a&&Text') || `线路${i+1}`;
            const list = playlist[i];
            if (list) {
                let videoItems = pdfa(list, 'a').map(it => {
                    let title = pdfh(it, 'a&&title') || pdfh(it, 'a&&Text');
                    let urls = pd(it, 'a&&href', id);
                    return title && urls ? `${title}$${urls}` : '';
                }).filter(item => item);
                
                if (videoItems.length > 0) {
                    playFrom.push(form);
                    playUrl.push(videoItems.join('#'));
                }
            }
        });
        
        let vod = {
            'vod_id': id,
            'vod_name': vod_name,
            'vod_pic': vod_pic,
            'type_name': type_name || '动漫',
            'vod_remarks': `${status || '连载中'}|${update || '2026-01-15'}`,
            'vod_year': vod_year || '2026',
            'vod_area': vod_area || '日本',
            'vod_lang': vod_lang || '日语',
            'vod_director': vod_director || '导演',
            'vod_actor': vod_actor || '主演',
            'vod_content': vod_content,
            'vod_play_from': playFrom.join('$$$'),
            'vod_play_url': playUrl.join('$$$')
        };
        
        return JSON.stringify({ list: [vod] });
    } catch (e) {
        console.log('detail错误:', e.message);
        return JSON.stringify({ list: [] });
    }
}

async function search(wd, quick, pg) {
    try {
        pg = parseInt(pg, 10) || 1;
        let searchUrl = `${host}/search/${encodeURIComponent(wd)}----------${pg}---.html`;
        let html = await request(searchUrl);
        
        let videos = pdfa(html, '.row .vod-detail').map(it => {
            let name = pdfh(it, 'h3&&Text');
            let url = pd(it, 'a&&href', host);
            if (!name || !url) return null;
            
            return {
                "vod_id": url,
                "vod_name": name,
                "vod_pic": pd(it, 'img&&data-src', host),
                "vod_remarks": pdfh(it, '.pic_text&&Text') || ""
            };
        }).filter(item => item);
        
        // 如果搜索词不为空，则进行过滤
        let filteredResults = wd ? videos.filter(item => 
            item.vod_name.toLowerCase().includes(wd.toLowerCase())
        ) : videos;
        
        return JSON.stringify({ 
            list: filteredResults,
            page: pg,
            pagecount: 10,
            limit: 20,
            total: filteredResults.length
        });
    } catch (e) {
        console.log('search错误:', e.message);
        return JSON.stringify({ 
            list: [],
            page: pg || 1,
            pagecount: 1,
            limit: 20,
            total: 0
        });
    }
}

async function play(flag, id, flags) {
    try {
        let playUrl = !/^http/.test(id) ? `${host}${id}` : id;
        let kp = 0, kurl = '';
        let html = await request(playUrl);
        
        let scriptMatch = html.match(/var player_.*?=(.*?)</);
        let codeObj = JSON.parse(scriptMatch[1]);
        let jurl = codeObj?.url ?? '';
        
        if (jurl) {
            try {
                // 先 URL 解码
                jurl = decodeURIComponent(jurl);
                console.log(`✅[URL解码后: ]${jurl}`);
                
                // 再 Base64 解码
                jurl = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(jurl));
                console.log(`✅[Base64解码后: ]${jurl}`);
            } catch (e) {
                console.log('解码失败:', e.message);
                jurl = '';
            }
        }
        
        if (jurl) {
            jurl = `${host}/player/?url=${jurl}&next=`;
            
            let resHtml = await request(jurl, {
                headers: {UA, 'Referer': host},
            });
            
            // 直接使用正则表达式提取（不使用 pdfh）
            let encryptedUrlMatch = resHtml.match(/const encryptedUrl\s*=\s*"([^"]+)"/);
            let sessionKeyMatch = resHtml.match(/const sessionKey\s*=\s*"([^"]+)"/);
            
            let encryptedUrl = encryptedUrlMatch ? encryptedUrlMatch[1] : '';
            let sessionKey = sessionKeyMatch ? sessionKeyMatch[1] : '';
            
            console.log(`✅[encryptedUrl: ]${encryptedUrl}`);
            console.log(`✅[sessionKey: ]${sessionKey}`);
            
            if (encryptedUrl && sessionKey) {
                kurl = Decrypt(encryptedUrl, sessionKey);
                console.log(`✅[解密后kurl: ]${kurl}`);
            } else {
                // 如果没有加密参数，尝试直接提取 m3u8 链接
                let m3u8Match = resHtml.match(/"(https?:\/\/[^"]+\.m3u8[^"]*)"/);
                if (m3u8Match) {
                    kurl = m3u8Match[1];
                    console.log(`✅[直接提取m3u8: ]${kurl}`);
                }
            }
        }
        
        return JSON.stringify({
            jx: 0, 
            parse: kp, 
            url: kurl, 
            header: UA
        });
    } catch (e) {
        console.log('play错误:', e.message);
        console.log('play错误堆栈:', e.stack);
        // 出错时返回原始链接让外部解析器处理
        return JSON.stringify({
            jx: 0, 
            parse: 1, 
            url: id, 
            header: UA
        });
    }
}
function Decrypt(ciphertext, key) {
    try {
        const rawData = CryptoJS.enc.Base64.parse(ciphertext);
        const keyWordArr = CryptoJS.enc.Utf8.parse(key);
        const ivWordArr = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4));
        const encrypted = CryptoJS.lib.WordArray.create(rawData.words.slice(4));
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: encrypted }, keyWordArr,
            { 
                iv: ivWordArr, 
                mode: CryptoJS.mode.CBC, 
                padding: CryptoJS.pad.Pkcs7 
            }
        );
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return '';
    }
}

function proxy(params) {
    console.log("proxy:", params);
    return [200, 'text/plain;charset=utf-8', '嗷呜动漫代理测试', null];
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search
    };
}