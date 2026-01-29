/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '荐片',
  lang: 'cat'
})
*/

let host = 'https://api.ztcgi.com';
let ext = '';
let imghost = '';
let UA = {
    "User-Agent": 'Mozilla/5.0 (Linux; Android 9; V2196A Build/PQ3A.190705.08211809; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:416;packageName:com.jp3.xg3'
};

// 过滤规则
let title_remove = ['名称排除', '广告', '破解', '群'];
let line_remove = ['线路排除', '广告', '666', 'mymv'];
let line_order = ['线路排序', 'cpsh', 'ft', '官', 'ace', '1080p', 'dytt'];

async function request(url, obj) {
    if (!obj) {
        obj = {
            headers: UA,
            timeout: 5000
        }
    }
    try {
        return (await req(url, obj)).content;
    } catch (e) {
        console.log(`请求失败: ${url}`, e.message);
        return ''
    }
}

async function init(cfg) {
    console.log(`传入的cfg参数: 类型: ${typeof cfg}, 值: `, cfg);
    // 统一配置格式
    cfg = cfg.ext ? cfg.ext : cfg;
    
    // 统一处理为字符串配置
    if (cfg && typeof cfg === 'string') {
        host = cfg;
    } else if (cfg && typeof cfg === 'object') {
        // 优先从对象中提取配置
        if (cfg.ext) {
            if (typeof cfg.ext === 'string') {
                try {
                    ext = JSON.parse(cfg.ext);
                } catch (e) {
                    console.log('配置解析失败:', e.message);
                    ext = {};
                }
            } else if (typeof cfg.ext === 'object') {
                ext = cfg.ext;
            }
        }
        
        // 更新主机地址
        if (ext && (ext.host || ext.hosturl || ext.url || ext.site)) {
            host = ext.host || ext.hosturl || ext.url || ext.site;
        }
        
        // 从配置中更新过滤规则
        if (ext) {
            if (ext.title_remove !== undefined) {
                title_remove = Array.isArray(ext.title_remove) ? ext.title_remove : title_remove;
            }
            if (ext.line_remove !== undefined) {
                line_remove = Array.isArray(ext.line_remove) ? ext.line_remove : line_remove;
            }
            if (ext.line_order !== undefined) {
                line_order = Array.isArray(ext.line_order) ? ext.line_order : line_order;
            }
        }
        
        // 清理配置
        if (cfg.skey !== undefined) {
            cfg.skey = '';
            cfg.stype = '3';
        }
    } 
    
    console.log(`host的结果: ${host}`);
}

//分类数据
async function home(filter) {
    
    let classes = [
        {type_id: '1', type_name: '电影'},
        {type_id: '2', type_name: '电视剧'},
        {type_id: '3', type_name: '动漫'},
        {type_id: '4', type_name: '综艺'}
    ];

    // 创建一个通用的过滤配置
    const commonFilter = [{
        "key": "cateId",
        "name": "分类",
        "value": [
            {"v": "1", "n": "剧情"}, {"v": "2", "n": "爱情"}, {"v": "3", "n": "动画"},
            {"v": "4", "n": "喜剧"}, {"v": "5", "n": "战争"}, {"v": "6", "n": "歌舞"},
            {"v": "7", "n": "古装"}, {"v": "8", "n": "奇幻"}, {"v": "9", "n": "冒险"},
            {"v": "10", "n": "动作"}, {"v": "11", "n": "科幻"}, {"v": "12", "n": "悬疑"},
            {"v": "13", "n": "犯罪"}, {"v": "14", "n": "家庭"}, {"v": "15", "n": "传记"},
            {"v": "16", "n": "运动"}, {"v": "18", "n": "惊悚"}, {"v": "20", "n": "短片"},
            {"v": "21", "n": "历史"}, {"v": "22", "n": "音乐"}, {"v": "23", "n": "西部"},
            {"v": "24", "n": "武侠"}, {"v": "25", "n": "恐怖"}
        ]
    }, {
        "key": "area",
        "name": "地區",
        "value": [
            {"v": "1", "n": "国产"}, {"v": "3", "n": "中国香港"}, {"v": "6", "n": "中国台湾"},
            {"v": "5", "n": "美国"}, {"v": "18", "n": "韩国"}, {"v": "2", "n": "日本"}
        ]
    }, {
        "key": "year",
        "name": "年代",
        "value": [
            {"v": "107", "n": "2025"}, {"v": "119", "n": "2024"}, {"v": "153", "n": "2023"},
            {"v": "101", "n": "2022"}, {"v": "118", "n": "2021"}, {"v": "16", "n": "2020"},
            {"v": "7", "n": "2019"}, {"v": "2", "n": "2018"}, {"v": "3", "n": "2017"},
            {"v": "22", "n": "2016"}, {"v": "2015", "n": "2015以前"}
        ]
    }, {
        "key": "sort",
        "name": "排序",
        "value": [
            {"v": "update", "n": "最新"}, {"v": "hot", "n": "最热"}, {"v": "rating", "n": "评分"}
        ]
    }];

    let filterObj = {
        "1": commonFilter,
        "2": commonFilter,
        "3": commonFilter,
        "4": commonFilter
    };
    
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

//主页推荐
async function homeVod() {
    
    try {
        let html = await request(`${host}/api/slide/list?pos_id=88`);
        let res = JSON.parse(html);

        let videos = res.data.map(item => ({
            vod_id: item.jump_id,
            vod_name: item.title,
            vod_pic: `${imghost}${item.thumbnail}`,
            vod_remarks: "",
            style: {"type": "rect", "ratio": 1.33}
        }))

        // 应用标题过滤规则
        const filteredVideos = videos.filter(item => {
            if (!item.vod_name) return false;
            
            const title = item.vod_name;
            const isBadTitle = title_remove && title_remove.some(word =>
                new RegExp(word, 'i').test(title)
            );
            
            return !isBadTitle;
        });

        return JSON.stringify({
            list: filteredVideos,
        });
    } catch (e) {
        console.log('homeVod错误:', e.message);
        return JSON.stringify({
            list: []
        });
    }
}

//分类
async function category(tid, pg, filter, extend) {
    
    try {
        let html = await request(`${host}/api/crumb/list?fcate_pid=${tid}&category_id=&area=${extend.area ? extend.area : ''}&year=${extend.year ? extend.year : ''}&type=${extend.cateId ? extend.cateId : ''}&sort=${extend.sort ? extend.sort : ''}&page=${pg}`);
        let res = JSON.parse(html);

        let videos = res.data.map(item => ({
            vod_id: item.id,
            vod_name: item.title,
            vod_pic: `${imghost}${item.path}`,
            vod_remarks: item.mask,
            vod_year: ""
        }))

        // 应用标题过滤规则
        const filteredVideos = videos.filter(item => {
            if (!item.vod_name) return false;
            
            const title = item.vod_name;
            const isBadTitle = title_remove && title_remove.some(word =>
                new RegExp(word, 'i').test(title)
            );
            
            return !isBadTitle;
        });

        return JSON.stringify({
            page: pg,
            pagecount: 99999,
            limit: 15,
            total: 99999,
            list: filteredVideos
        });
    } catch (e) {
        console.log('category错误:', e.message);
        return JSON.stringify({
            page: pg,
            pagecount: 1,
            limit: 15,
            total: 0,
            list: []
        });
    }
}

//详情
async function detail(id) {
    try {
        let html = await request(`${host}/api/video/detailv2?id=${id}`);
        let res = JSON.parse(html).data;
        
        // 创建线路数组
        const playForm = [];
        const playUrls = [];
        
        // 处理每个线路
        res.source_list_source.forEach(item => {
            const form = item.name || '';
            
            // 添加域名信息
            let finalForm = form;
            if (item.source_list && item.source_list.length > 0 && item.source_list[0].url) {
                let domain = 提取域名(item.source_list[0].url);
                if (domain.length > 8) domain = domain.substring(0, 8);
                finalForm = `${form}(${domain})`;
            }
            
            // 检查是否是需要排除的线路
            const isBadLine = line_remove && line_remove.some(pattern =>
                finalForm.toLowerCase().includes(pattern.toLowerCase())
            );
            
            if (!isBadLine) {
                playForm.push(finalForm);
                
                // 构建播放地址
                const urls = item.source_list.map((source, index) => {
                    return `${source.source_name}$${source.url}`;
                }).join('#');
                
                playUrls.push(urls);
            }
        });
        
        // 对线路进行排序
        const sortedIndices = Array.from({length: playForm.length}, (_, i) => i);
        sortedIndices.sort((a, b) => {
            const getPriority = (s) => {
                const lowerS = s.toLowerCase();
                for (let i = 0; i < line_order.length; i++) {
                    if (lowerS.includes(line_order[i].toLowerCase())) {
                        return i;
                    }
                }
                return line_order.length;
            };
            return getPriority(playForm[a]) - getPriority(playForm[b]);
        });
        
        const sortedPlayForm = sortedIndices.map(i => playForm[i]);
        const sortedPlayUrls = sortedIndices.map(i => playUrls[i]);
        
        // 替换常规线路为边下边播
        const play_from = sortedPlayForm.map(item => item.replace(/常规线路/g, '边下边播')).join('$$$');
        const play_url = sortedPlayUrls.join('$$$');

        var vod = [{
            "vod_id": id,
            "vod_name": res.title || '',
            "type_name": '',
            "vod_year": res.year,
            "vod_area": res.area,
            "vod_remarks": res.mask,
            "vod_content": res.description,
            "vod_pic": `${imghost}${res.thumbnail}`,
            "vod_play_from": play_from,
            "vod_play_url": play_url
        }];

        return JSON.stringify({
            list: vod
        });
    } catch (e) {
        console.log('detail错误:', e.message);
        return JSON.stringify({
            list: []
        });
    }
}

//播放
async function play(flag, id, flags) {
    if (id.indexOf(".m3u8") > -1) {
        return JSON.stringify({
            parse: 0,
            url: id
        });
    } else {
        return JSON.stringify({
            parse: 0,
            url: `tvbox-xg:${id}`
        });
    }
}

//搜索
async function search(wd, quick) {
    
    // 先检查关键词是否需要排除
    for (let keyword of title_remove) {
        if (wd.includes(keyword)) {
            return JSON.stringify({
                limit: 20,
                list: []
            });
        }
    }
    
    try {
        let html = await request(`${host}/api/v2/search/videoV2?key=${wd}&category_id=88&page=1&pageSize=20`);
        let res = JSON.parse(html);

        let videos = res.data.map(item => ({
            vod_id: item.id,
            vod_name: item.title,
            vod_pic: `${imghost}${item.thumbnail}`,
            vod_remarks: item.mask,
            vod_year: ""
        }))

        // 应用标题过滤规则
        const filteredVideos = videos.filter(item => {
            if (!item.vod_name) return false;
            
            const title = item.vod_name;
            const isBadTitle = title_remove && title_remove.some(word =>
                new RegExp(word, 'i').test(title)
            );
            
            return !isBadTitle;
        });

        return JSON.stringify({
            limit: 20,
            list: filteredVideos
        });
    } catch (e) {
        console.log('search错误:', e.message);
        return JSON.stringify({
            limit: 20,
            list: []
        });
    }
}

/**
 * 提取域名
 */
function 提取域名(url) {
    if (!url) return "";
    
    try {
        const cleanUrl = url.replace(/^(https?:\/\/)?/, '');
        const domainPart = cleanUrl.split('/')[0];
        
        if (domainPart.includes('-')) {
            return domainPart.split('-')[0];
        }
        
        if (domainPart.includes('.')) {
            const dotParts = domainPart.split('.');
            if (dotParts.length > 2) {
                return dotParts[dotParts.length - 2];
            } else if (dotParts.length === 2) {
                return dotParts[0];
            }
        }
        
        return domainPart;
    } catch (e) {
        return "";
    }
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