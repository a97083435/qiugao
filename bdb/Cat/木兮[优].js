/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '木兮',
  '类型': '影视',
  lang: 'cat'
})
*/

let host = 'https://film.symx.club';
let UA = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.200 Safari/537.36',
    'x-platform': 'web'
};

// 过滤规则 
let title_remove = ['名称', '排除', '广告', '破解', '测试'];
let line_remove = ['广告线路', '测试线路', '备用线路'];
let line_order = ['线路排序', '官方', '高清', '超清', '蓝光', '1080p'];

async function request(url) {
    try {
        return (await req(url, {headers: UA, timeout: 5000})).content;
    } catch (e) {
        console.log(`请求失败: ${url}`, e.message);
        return '';
    }
}

async function init(cfg) {
    console.log(`传入的cfg参数:`, cfg);
    if (cfg) {
        if (typeof cfg === 'string' && cfg.startsWith('http')) {
            host = cfg;
        } else if (cfg.host) {
            host = cfg.host;
        }
    }
    console.log(`host的结果: ${host}`);
}

async function home() {
    try {
        let html = await request(`${host}/api/category/top`);
        let response = JSON.parse(html);
        let categoriesData = response.data || [];
        
        let classes = categoriesData.map(item => ({
            type_id: item.id.toString(),
            type_name: item.name
        }));

        let filters = {};
        for (let cls of classes) {
            let filterUrl = `${host}/api/film/category/filter?categoryId=${cls.type_id}`;
            let filterHtml = await request(filterUrl);
            let filterResponse = JSON.parse(filterHtml);
            let filterData = filterResponse.data || {};
                
            let filterConfig = [];
            if (filterData.languageOptions?.length > 0) {
                filterConfig.push({
                    key: "lang",
                    name: "语言",
                    value: filterData.languageOptions.map(lang => ({v: lang, n: lang}))
                });
            }
            if (filterData.areaOptions?.length > 0) {
                filterConfig.push({
                    key: "area",
                    name: "地区",
                    value: filterData.areaOptions.map(area => ({v: area, n: area}))
                });
            }
            if (filterData.yearOptions?.length > 0) {
                filterConfig.push({
                    key: "year",
                    name: "年代",
                    value: filterData.yearOptions.map(year => ({v: year, n: year}))
                });
            }

            if (filterData.sortOptions?.length > 0) {
                filterConfig.push({
                    key: "by",
                    name: "排序",
                    value: filterData.sortOptions.map(sort => ({v: sort.value, n: sort.label}))
                });
            }
            filters[cls.type_id] = filterConfig;
        }
        return JSON.stringify({class: classes, filters: filters});
    } catch (e) {
        console.log('home错误:', e.message);
        return JSON.stringify({class: [], filters: {}});
    }
}

async function homeVod() {
    try {
        let html = await request(`${host}/api/film/category`);
        let response = JSON.parse(html);
        let categories = response.data || [];
        
        let videos = [];
        for (let category of categories) {
            if (category.filmList?.length > 0) {
                for (let item of category.filmList) {
                    let title = item.name || '';
                    let isBadTitle = title_remove.some(word => 
                        word && title && title.toLowerCase().includes(word.toLowerCase())
                    );
                    if (!isBadTitle && title) {
                        videos.push({
                            vod_id: item.id || '',
                            vod_name: title,
                            vod_pic: item.cover || '',
                            vod_remarks: item.updateStatus || '',
                            vod_content: item.blurb || '',
                            vod_score: item.doubanScore || ''
                        });
                    }
                }
            }
        }
        return JSON.stringify({list: videos});
    } catch (e) {
        console.log('homeVod错误:', e.message);
        return JSON.stringify({list: []});
    }
}

async function category(tid, pg, filter, extend) {
    try {
        let url = `${host}/api/film/category/list?categoryId=${tid}&pageNum=${pg}&pageSize=15`;
        if (extend) {
            if (extend.year) url += `&year=${extend.year}`;
            if (extend.area) url += `&area=${encodeURIComponent(extend.area)}`;
            if (extend.lang) url += `&language=${encodeURIComponent(extend.lang)}`;
            if (extend.by) url += `&sort=${extend.by}`;
        }
        
        let html = await request(url);
        let data = JSON.parse(html).data;
        let list = data.list || [];
        
        let videos = [];
        for (let item of list) {
            let title = item.name;
            let isBadTitle = title_remove.some(word => word && new RegExp(word, 'i').test(title));
            if (!isBadTitle) {
                videos.push({
                    vod_id: item.id,
                    vod_name: item.name,
                    vod_pic: item.cover,
                    vod_remarks: item.updateStatus || '',
                    vod_content: item.blurb || '',
                    vod_score: item.doubanScore || ''
                });
            }
        }

        return JSON.stringify({
            page: pg,
            pagecount: data.pages || 999,
            limit: 15,
            total: data.total || 999,
            list: videos
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

async function detail(id) {
    try {
        let html = await request(`${host}/api/film/detail?id=${id}`);
        let data = JSON.parse(html).data;
        
        // 线路过滤和排序 - 类似荐片的处理逻辑
        let playForm = [];
        let playUrls = [];
        let playlist = data.playLineList || [];
        
        for (let line of playlist) {
            const playerName = line.playerName || '';
            
            // 检查是否是需要排除的线路
            let isBadLine = line_remove && line_remove.some(pattern =>
                playerName.toLowerCase().includes(pattern.toLowerCase())
            );
            
            if (!isBadLine) {
                // 添加域名信息（如果有URL的话）
                let finalForm = playerName;
                if (line.lines && line.lines.length > 0 && line.lines[0].id) {
                    // 这里可以添加域名提取逻辑
                    let domain = 提取域名(line.lines[0].id);
                    if (domain) finalForm = `${playerName}(${domain})`;
                }
                playForm.push(finalForm);
                
                let lineUrls = (line.lines || []).map(tag => `${tag.name || ''}$${tag.id || ''}`).join('#');
                playUrls.push(lineUrls);
            }
        }
        
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

        let vod = [{
            vod_id: id,
            vod_name: data.name || '',
            type_name: '',
            vod_year: data.year || '',
            vod_area: data.other || '',
            vod_remarks: data.updateStatus || data.doubanScore,
            vod_content: data.blurb || '',
            vod_pic: data.cover || '',
            vod_play_from: sortedPlayForm.join('$$$'),
            vod_play_url: sortedPlayUrls.join('$$$')
        }];

        return JSON.stringify({list: vod});
    } catch (e) {
        console.log('detail错误:', e.message);
        return JSON.stringify({list: []});
    }
}

async function play(flag, id, flags) {
    try {
        let purl = `${host}/api/line/play/parse?lineId=${id}`;
        let html = await request(purl);
        let url = JSON.parse(html).data;
        return JSON.stringify({parse: 0, url: url || ''});
    } catch (e) {
        console.log('play错误:', e.message);
        return JSON.stringify({parse: 0, url: ''});
    }
}

async function search(wd, quick, pg=1) {
    try {
        // 确保 pg 是正整数
        pg = parseInt(pg) || 1;
        let url = `${host}/api/film/search?keyword=${encodeURIComponent(wd)}&pageNum=${pg}&pageSize=10`;
        let html = await request(url);
        let response = JSON.parse(html);
        let data = response.data?.list || [];
        
        let videos = [];
        for (let item of data) {
            let title = item.name || '';
            let isBadTitle = title_remove.some(word => word && title.toLowerCase().includes(word.toLowerCase()));
            if (!isBadTitle && title) {
                videos.push({
                    vod_id: item.id || '',
                    vod_name: title,
                    vod_pic: item.cover || '',
                    vod_remarks: item.updateStatus || '',
                    vod_content: item.blurb || '',
                    vod_score: item.doubanScore || ''
                });
            }
        }
        
        let total = response.data?.total || 0;
        let pagecount = Math.ceil(total / 10) || 1;
        
        return JSON.stringify({
            page: pg,
            pagecount: pagecount,
            limit: 10,
            total: total,
            list: videos
        });
    } catch (e) {
        console.log('search错误:', e.message);
        return JSON.stringify({
            page: pg || 1,
            pagecount: 1,
            limit: 10,
            total: 0,
            list: []
        });
    }
}

// 添加提取域名函数
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
    return {init, home, homeVod, category, detail, play, search};
}