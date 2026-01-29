/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '瓜子APP',
  lang: 'cat'
})
*/
import 'assets://js/lib/crypto-js.js';
//import '../lib/crypto-js.js';
import "../lib/jsencrypt.js";

let host = 'https://api.w32z7vtd.com';
let ext = '';

// md5函数
function md5(str) {
  return CryptoJS.MD5(str).toString(CryptoJS.enc.Hex).toLowerCase();
}

// 加密配置
const cryptoConfig = {
    key: CryptoJS.enc.Utf8.parse("mvXBSW7ekreItNsT"),
    iv: CryptoJS.enc.Utf8.parse("2U3IrJL8szAKp0Fj"),
    rsaKey: `-----BEGIN PUBLIC KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGAe6hKrWLi1zQmjTT1
ozbE4QdFeJGNxubxld6GrFGximxfMsMB6BpJhpcTouAqywAFppiKetUBBbXwYsYU
1wNr648XVmPmCMCy4rY8vdliFnbMUj086DU6Z+/oXBdWU3/b1G0DN3E9wULRSwcK
ZT3wj/cCI1vsCm3gj2R5SqkA9Y0CAwEAAQKBgAJH+4CxV0/zBVcLiBCHvSANm0l7
HetybTh/j2p0Y1sTXro4ALwAaCTUeqdBjWiLSo9lNwDHFyq8zX90+gNxa7c5EqcW
V9FmlVXr8VhfBzcZo1nXeNdXFT7tQ2yah/odtdcx+vRMSGJd1t/5k5bDd9wAvYdI
DblMAg+wiKKZ5KcdAkEA1cCakEN4NexkF5tHPRrR6XOY/XHfkqXxEhMqmNbB9U34
saTJnLWIHC8IXys6Qmzz30TtzCjuOqKRRy+FMM4TdwJBAJQZFPjsGC+RqcG5UvVM
iMPhnwe/bXEehShK86yJK/g/UiKrO87h3aEu5gcJqBygTq3BBBoH2md3pr/W+hUM
WBsCQQChfhTIrdDinKi6lRxrdBnn0Ohjg2cwuqK5zzU9p/N+S9x7Ck8wUI53DKm8
jUJE8WAG7WLj/oCOWEh+ic6NIwTdAkEAj0X8nhx6AXsgCYRql1klbqtVmL8+95KZ
K7PnLWG/IfjQUy3pPGoSaZ7fdquG8bq8oyf5+dzjE/oTXcByS+6XRQJAP/5ciy1b
L3NhUhsaOVy55MHXnPjdcTX0FaLi+ybXZIfIQ2P4rb19mVq1feMbCXhz+L1rG8oa
t5lYKfpe8k83ZA==
-----END PUBLIC KEY-----`
};

// 公共加密函数
const Encrypt = function(plainText) {
    let encrypted = CryptoJS.AES.encrypt(plainText, cryptoConfig.key, {
        iv: cryptoConfig.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
};

// 公共解密函数
const Decrypt = function(word, key, iv) {
    let encryptedHexStr = CryptoJS.enc.Hex.parse(word);
    let decrypt = CryptoJS.AES.decrypt({
        ciphertext: encryptedHexStr
    }, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypt.toString(CryptoJS.enc.Utf8);
};

// JSEncrypt解密函数
function RSA_decode(encrypted, key) {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(key);
    return encrypt.decrypt(encrypted);
}

// 公共请求体生成
const getbody = function(key, t) {
    return `token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79&token_id=&phone_type=1&time=${t}&phone_model=xiaomi-22021211rc&keys=qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ%2BIOJyHnHflCj5w%2F7ESK7FgywMvrgjxbx0GklEFLI4%2BJshgySe633OIRstuktwdiCy3CT%2BfLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz%2FuurUif2OK4%3D&request_key=${key}&signature=${md5(`token_id=,token=1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79,phone_type=1,request_key=${key},app_id=1,time=${t},keys=qDpotE2bedimK3QGqlyV5ieXXC3EhaPLQ+IOJyHnHflCj5w/7ESK7FgywMvrgjxbx0GklEFLI4+JshgySe633OIRstuktwdiCy3CT+fLSpuxBJDIlfXQDaeH3ig1wiB0JsZ601XHiFweGMu4tZfnSpHg3OnoL6nz/uurUif2OK4=*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`).toUpperCase()}&app_id=1&ad_version=1`;
};

// 获取HTML（使用JSEncrypt解密）
const gethtml = async function(u, body) {
    const headers = {
        'Cache-Control': 'no-cache',
        'Version': '2406025',
        'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
        'Ver': '1.9.2',
        'Referer': 'https://api.w32z7vtd.com',
        'X-Customer-Client-Ip': '127.0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Host': 'api.w32z7vtd.com',
        'Connection': 'Keep-Alive',
        'User-Agent': 'okhttp/3.12.0'
    };
    
    const response = await req(u, {
        headers: headers,
        body: body,
        method: 'POST'
    });
    
    const responseData = JSON.parse(response.content);
    const banner = responseData.data;
    const response_key = banner.response_key;
    const keys = banner.keys;
    
    const bodykeyivStr = RSA_decode(keys, cryptoConfig.rsaKey);
    const bodykeyiv = JSON.parse(bodykeyivStr);
    const key = CryptoJS.enc.Utf8.parse(bodykeyiv.key);
    const iv = CryptoJS.enc.Utf8.parse(bodykeyiv.iv);
    
    const html = Decrypt(response_key, key, iv);
    return html;
};

const hqsub = function(MY_CATE) {
    const subs = ["5", "12", "30", "22", ""];
    const tids = ["1", "2", "4", "3", "64"];
    const index = tids.indexOf(MY_CATE);
    return index !== -1 ? subs[index] : "";
};

// 初始化函数

async function init(cfg) {
    console.log(`cfg参数类型: ${typeof cfg}, 值:`, cfg);
    
    // 统一处理为字符串配置
    if (cfg && typeof cfg === 'string') {
        host = cfg;
    } else if (cfg && typeof cfg === 'object') {
        // 优先从对象中提取配置
        ext = cfg.ext
        
        host = ext.host || ext.hosturl || ext.url || ext.site  ;
        // 设置应用需要的属性
        cfg.skey = '';
        cfg.stype = '3';
    } 
    
    console.log(`host: ${host}`);
}


// 首页分类函数 - 返回筛选信息
function home(filter) {
    let classes = [];
    const class_names = ['电影', '电视剧', '动漫', '综艺', '短剧'];
    const class_urls = ['1', '2', '4', '3', '64'];
    
    class_names.forEach((name, index) => {
        classes.push({
            'type_id': class_urls[index],
            'type_name': name
        });
    });
    
    return JSON.stringify({
        'class': classes,
        'filters': filterConfig
    });
}

// 首页视频函数
async function homeVod(params) {
    try {
        const t = Math.floor(Date.now() / 1000).toString();
        const request_key = JSON.stringify({
            "page": 1,
            "pageSize": 20,
            "sort": "d_addtime"
        });
        
        const request_key2 = Encrypt(request_key);
        const body = getbody(request_key2, t);
        const html = await gethtml(host + "/App/IndexList/indexList", body);
        
        if (!html || html.length < 10) {
            return JSON.stringify({list: []});
        }
        
        const data = JSON.parse(html);
        const list = data.list ? data.list.map(item => ({
            vod_name: item.vod_name,
            vod_id: `${item.vod_id}/${item.vod_continu}`,
            vod_pic: item.vod_pic,
            vod_remarks: item.vod_continu === 0 ? '全1集' : `更新至${item.vod_continu}集`
        })) : [];
        
        return JSON.stringify({list});
        
    } catch (error) {
        console.log("homeVod error:", error);
        return JSON.stringify({list: []});
    }
}

// 分类列表函数 - 支持筛选
async function category(tid, pg, filter, extend) {
    let d = [];
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const t = timestamp.toString();
    
    const area = extend?.area  || "";
    const year = extend?.year  || "";
    const sub = extend?.sub  || hqsub(tid);
    const sort = extend?.sort  || "d_id";
    
    const request_key = JSON.stringify({
        "area": area,
        "sub": sub,
        "year": year,
        "sort": sort,
        "page": pg,
        "tid": tid
    });
    
    const request_key2 = Encrypt(request_key);
    const body = getbody(request_key2, t);
    
    const html = await gethtml(host + "/App/IndexList/indexList", body);
    
    if (!html || html.length < 10) {
        return JSON.stringify({list: []});
    }
    
    const data = JSON.parse(html);
    
    if (data.list) {
        data.list.forEach((item) => {
            d.push({
                vod_name: item.vod_name,
                vod_id: `${item.vod_id}/${item.vod_continu}`,
                vod_pic: item.vod_pic,
                vod_remarks: item.t_id === 1 ? '已完结' : item.vod_continu === 0 ? '更新至1集' : `更新至${item.vod_continu}集`,
                vod_year: item.vod_year,
                vod_area: item.vod_area,
                vod_score: item.vod_score
            });
        });
    }
    
    const result = {
        list: d,
        page: pg,
        pagecount: Math.ceil(data.total / data.pageSize),
        total: data.total,
        limit: data.pageSize
    };
    
    return JSON.stringify(result);
}

// 详情函数
async function detail(vod_url) {
    const vod_id = vod_url.split("/")[0];
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const t = timestamp.toString();
    
    const request_key = JSON.stringify({
        "token_id": "393668",
        "vod_id": vod_id,
        "mobile_time": t,
        "token": "1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79"
    });
    
    const request_key2 = Encrypt(request_key);
    const body = getbody(request_key2, t);
    const html = await gethtml(host + "/App/IndexPlay/playInfo", body);
    
    const data2 = JSON.parse(html).vodInfo;
    
    const request_key3 = JSON.stringify({
        "vurl_cloud_id": "2",
        "vod_d_id": vod_id
    });
    
    const request_key4 = Encrypt(request_key3);
    const body2 = getbody(request_key4, t);
    const html3 = await gethtml(host + "/App/Resource/Vurl/show", body2);
    
    const list = JSON.parse(html3).list;
    let playList = [];
    
    list.forEach(item => {
        const playParams = Object.values(item.play);
        let lastParam = null;
        for (let i = playParams.length - 1; i >= 0; i--) {
            if (playParams[i].param) {
                lastParam = playParams[i].param;
                break;
            }
        }
        const vurlIdMatch = lastParam?.match(/vurl_id=(\d+)/);
        const resolution = lastParam?.match(/resolution=(\d+)/);
        if (vurlIdMatch) {
            playList.push(`${item.title}$${vod_id}/${vurlIdMatch[1]}?${resolution?.[1] || '1'}`);
        }
    });
    
    const vod = {
        vod_name: data2.vod_name,
        type_name: data2.videoTag?.toString() || '',
        vod_remarks: data2.vod_addtime,
        vod_actor: data2.vod_actor,
        vod_area: data2.vod_area,
        vod_director: data2.vod_director,
        vod_pic: data2.vod_pic,
        vod_content: data2.vod_use_content,
        vod_play_from: '瓜子',
        vod_play_url: playList.join('#')
    };
    
    return JSON.stringify({
        list: [vod]
    });
}

// 播放函数
async function play(flag, id, flags) {
    const vod_id = id.split("/")[0];
    const vurl_id = id.split("/")[1];
    const resolution = id.split("?")[1] || '1';
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const t = timestamp.toString();
    
    const request_key = JSON.stringify({
        "domain_type": "8",
        "vod_id": vod_id,
        "type": "play",
        "resolution": resolution,
        "vurl_id": vurl_id
    });
    
    const request_key2 = Encrypt(request_key);
    const body = getbody(request_key2, t);
    const html = await gethtml(host + '/App/Resource/VurlDetail/showOne', body);
    
    const url = JSON.parse(html).url;
    
    return JSON.stringify({
        parse: 0,
        url: url,
        header: {}
    });
}

// 搜索函数
async function search(wd, quick) {
    let d = [];
    
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const t = timestamp.toString();
    
    const request_key = JSON.stringify({
        "keywords": wd,
        "order_val": "1"
    });
    
    const request_key2 = Encrypt(request_key);
    const body = getbody(request_key2, t);
    const html = await gethtml(host + '/App/Index/findMoreVod', body);
    
    const list = JSON.parse(html).list;
    list.forEach(data => {
        d.push({
            vod_name: data.vod_name,
            vod_id: `${data.vod_id}/${data.vod_continu}`,
            vod_pic: data.vod_pic,
            vod_remarks: data.vod_continu === 0 ? '电影' : `更新至${data.vod_continu}集`
        });
    });
    
    if (d.length > 0) {
        d = d.filter(it => it.vod_name.includes(wd));
    }
    
    return JSON.stringify({
        list: d
    });
}

// 筛选配置
const filterConfig = {
    "1": [
        {
            "key": "area",
            "name": "area",
            "value": [
                {"n": "全部", "v": "0"},
                {"n": "大陆", "v": "大陆"},
                {"n": "香港", "v": "香港"},
                {"n": "台湾", "v": "台湾"},
                {"n": "欧美", "v": "俄罗斯,加拿大,德国,意大利,法国,欧美,美国,英国,西班牙"},
                {"n": "日本", "v": "日本"},
                {"n": "韩国", "v": "韩国"},
                {"n": "东南亚", "v": "印度,新加坡,泰国,马来西亚"},
                {"n": "其他", "v": "其他"}
            ]
        },
        {
            "key": "year",
            "name": "year",
            "value": [
                {"n": "全部", "v": "0"},
                {"n": "2025", "v": "2025"},{"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"},
                {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"},
                {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"},
                {"n": "2016", "v": "2016"},
                {"n": "10-15年", "v": "2015,2014,2013,2012,2011,2010"},
                {"n": "00年代", "v": "2000,2001,2002,2003,2004,2005,2006,2007,2008,2009"},
                {"n": "90年代", "v": "1990,1991,1992,1993,1994,1995,1996,1997,1998,1999"},
                {"n": "80年代", "v": "1980,1981,1982,1983,1984,1985,1986,1987,1988,1989"},
                {"n": "更早", "v": "2"}
            ]
        },
        {
            "key": "sub",
            "name": "sub",
            "value": [
                {"n": "全部", "v": "0"},
                {"n": "动作片", "v": 5},
                {"n": "悬疑片", "v": 29},
                {"n": "喜剧片", "v": 6},
                {"n": "爱情片", "v": 7},
                {"n": "科幻片", "v": 8},
                {"n": "恐怖片", "v": 9},
                {"n": "剧情片", "v": 10},
                {"n": "战争片", "v": 11},
                {"n": "动画片", "v": 36},
                {"n": "纪录片", "v": 20},
                {"n": "灾难片", "v": 38},
                {"n": "犯罪片", "v": 61}
            ]
        },
        {
            "key": "sort",
            "name": "sort",
            "value": [
                {"n": "综合", "v": "d_id"},
                {"n": "最新", "v": "d_addtime"},
                {"n": "最热", "v": "d_score"},
                {"n": "高分", "v": "d_score"}
            ]
        }
    ],
    "2": [
        {
            "key": "area",
            "name": "area",
            "value": [
                {"n": "地区", "v": "0"},
                {"n": "大陆", "v": "大陆"},
                {"n": "香港", "v": "香港"},
                {"n": "台湾", "v": "台湾"},
                {"n": "欧美", "v": "俄罗斯,加拿大,德国,意大利,法国,欧美,美国,英国,西班牙"},
                {"n": "日本", "v": "日本"},
                {"n": "韩国", "v": "韩国"},
                {"n": "东南亚", "v": "印度,新加坡,泰国,马来西亚"},
                {"n": "其他", "v": "其他"}
            ]
        },
        {
            "key": "year",
            "name": "year",
            "value": [
                {"n": "年份", "v": "0"},
                {"n": "2025", "v": "2025"},{"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"},
                {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"},
                {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"},
                {"n": "2016", "v": "2016"},
                {"n": "10-15年", "v": "2015,2014,2013,2012,2011,2010"},
                {"n": "00年代", "v": "2000,2001,2002,2003,2004,2005,2006,2007,2008,2009"},
                {"n": "90年代", "v": "1990,1991,1992,1993,1994,1995,1996,1997,1998,1999"},
                {"n": "80年代", "v": "1980,1981,1982,1983,1984,1985,1986,1987,1988,1989"},
                {"n": "更早", "v": "2"}
            ]
        },
        {
            "key": "sub",
            "name": "sub",
            "value": [
                {"n": "国产剧", "v": 12},
                {"n": "香港剧", "v": 13},
                {"n": "台湾剧", "v": 14},
                {"n": "欧美剧", "v": 15},
                {"n": "日本剧", "v": 16},
                {"n": "韩国剧", "v": 17},
                {"n": "海外剧", "v": 18},
                {"n": "泰国剧", "v": 19},
                {"n": "新加坡", "v": 69}
            ]
        },
        {
            "key": "sort",
            "name": "sort",
            "value": [
                {"n": "综合", "v": "d_id"},
                {"n": "最新", "v": "d_addtime"},
                {"n": "最热", "v": "d_score"},
                {"n": "高分", "v": "d_score"}
            ]
        }
    ],
    "4": [
        {
            "key": "area",
            "name": "area",
            "value": [
                {"n": "地区", "v": "0"},
                {"n": "大陆", "v": "大陆"},
                {"n": "香港", "v": "香港"},
                {"n": "台湾", "v": "台湾"},
                {"n": "欧美", "v": "俄罗斯,加拿大,德国,意大利,法国,欧美,美国,英国,西班牙"},
                {"n": "日本", "v": "日本"},
                {"n": "韩国", "v": "韩国"},
                {"n": "东南亚", "v": "印度,新加坡,泰国,马来西亚"},
                {"n": "其他", "v": "其他"}
            ]
        },
        {
            "key": "year",
            "name": "year",
            "value": [
                {"n": "年份", "v": "0"},
                {"n": "2025", "v": "2025"},{"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"},
                {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"},
                {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"},
                {"n": "2016", "v": "2016"},
                {"n": "10-15年", "v": "2015,2014,2013,2012,2011,2010"},
                {"n": "00年代", "v": "2000,2001,2002,2003,2004,2005,2006,2007,2008,2009"},
                {"n": "90年代", "v": "1990,1991,1992,1993,1994,1995,1996,1997,1998,1999"},
                {"n": "80年代", "v": "1980,1981,1982,1983,1984,1985,1986,1987,1988,1989"},
                {"n": "更早", "v": "2"}
            ]
        },
        {
            "key": "sub",
            "name": "sub",
            "value": [
                {"n": "中国动漫", "v": 30},
                {"n": "日本动漫", "v": 31},
                {"n": "欧美动漫", "v": 33}
            ]
        },
        {
            "key": "sort",
            "name": "sort",
            "value": [
                {"n": "综合", "v": "d_id"},
                {"n": "最新", "v": "d_addtime"},
                {"n": "最热", "v": "d_score"},
                {"n": "高分", "v": "d_score"}
            ]
        }
    ],
    "3": [
        {
            "key": "area",
            "name": "area",
            "value": [
                {"n": "地区", "v": "0"},
                {"n": "大陆", "v": "大陆"},
                {"n": "香港", "v": "香港"},
                {"n": "台湾", "v": "台湾"},
                {"n": "欧美", "v": "俄罗斯,加拿大,德国,意大利,法国,欧美,美国,英国,西班牙"},
                {"n": "日本", "v": "日本"},
                {"n": "韩国", "v": "韩国"},
                {"n": "东南亚", "v": "印度,新加坡,泰国,马来西亚"},
                {"n": "其他", "v": "其他"}
            ]
        },
        {
            "key": "year",
            "name": "year",
            "value": [
                {"n": "年份", "v": "0"},
                {"n": "2025", "v": "2025"},{"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"},
                {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"},
                {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"},
                {"n": "2016", "v": "2016"},
                {"n": "10-15年", "v": "2015,2014,2013,2012,2011,2010"},
                {"n": "00年代", "v": "2000,2001,2002,2003,2004,2005,2006,2007,2008,2009"},
                {"n": "90年代", "v": "1990,1991,1992,1993,1994,1995,1996,1997,1998,1999"},
                {"n": "80年代", "v": "1980,1981,1982,1983,1984,1985,1986,1987,1988,1989"},
                {"n": "更早", "v": "2"}
            ]
        },
        {
            "key": "sub",
            "name": "sub",
            "value": [
                {"n": "大陆综艺", "v": 22},
                {"n": "港台综艺", "v": 23},
                {"n": "日韩综艺", "v": 24},
                {"n": "欧美综艺", "v": 25}
            ]
        },
        {
            "key": "sort",
            "name": "sort",
            "value": [
                {"n": "综合", "v": "d_id"},
                {"n": "最新", "v": "d_addtime"},
                {"n": "最热", "v": "d_score"},
                {"n": "高分", "v": "d_score"}
            ]
        }
    ]
};

// 导出函数对象
export default {
    init: init,
    home: home,
    homeVod: homeVod,
    category: category,
    detail: detail,
    play: play,
    search: search
};