/**
 * 百度网盘解析模块
 * 提供百度网盘分享链接的解析和文件获取功能
 * 支持获取分享文件列表、生成播放链接等操作
 */
import 'assets://js/lib/crypto-js.js';

/**
 * 百度网盘驱动类
 * 用于解析百度网盘分享链接，获取文件信息和播放地址
 */
class BaiduDrive {
    /**
     * 构造函数 - 初始化百度网盘相关配置
     */
    constructor() {
        // 百度网盘分享链接正则表达式 - 与baidu2.js保持一致
        this.regex = /https:\/\/pan\.baidu\.com\/s\/(.*)\?.*?pwd=([^&]+)/;
        // 支持的视频质量类型
        this.type = ["M3U8_AUTO_4K", "M3U8_AUTO_2K", "M3U8_AUTO_1080", "M3U8_AUTO_720", "M3U8_AUTO_480"];
        // 请求头配置
        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
            "Connection": "keep-alive",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6"
        };
        // 百度网盘API基础地址
        this.api = 'https://pan.baidu.com';
        // 分享链接
        this.link = ''
        // 提取码
        this.pwd = '';
        // 短链接标识
        this.surl = '';
        // 短链接（去掉首字符）
        this.shorturl = ''
        // 用户标识
        this.uk = '';
        // 分享ID
        this.shareid = '';
        // 应用ID
        this.app_id = 250528;
        // 视图模式
        this.view_mode = 1;
        // 渠道标识
        this.channel = 'chunlei';
    }

    /**
     * 获取百度网盘Cookie
     * @returns {string} 百度网盘Cookie
     */
    get cookie() {
        return globalThis.baidu_cookie || '';
    }

    /**
     * 设置百度网盘Cookie
     * @param {string} value - Cookie字符串
     */
    set cookie(value) {
        globalThis.baidu_cookie = value;
    }

    /**
     * 解析分享链接，提取surl和密码
     * @param {string} url - 百度网盘分享链接
     * @returns {Promise<void>}
     */
    async getSurl(url) {
        this.link = url;
        const matches = this.regex.exec(url);
        
        if (matches && matches[1]) {
            this.surl = matches[1];
            this.shorturl = this.surl.split('').slice(1).join('');
            this.pwd = matches[2] || '';
        }
    }

    /**
     * 获取签名信息
     * @returns {Promise<string>} 签名字符串
     */
    async getSign() {
        const url = `${this.api}/share/tplconfig?surl=${this.surl}&fields=Espace_info,card_info,sign,timestamp&view_mode=${this.view_mode}&channel=${this.channel}&web=1&app_id=${this.app_id}`;
        
        try {
            const response = await req(url, {
                method: "GET",
                headers: this.headers
            });
            
            if (response.content) {
                const data = JSON.parse(response.content);
                if (data.errno === 0 && data.data) {
                    return data.data.sign || '';
                }
            }
        } catch (error) {
            console.error('[BaiduDrive][getSign] 错误:', error);
        }
        
        return '';
    }

    /**
     * 获取分享数据的主入口方法
     * @param {string} link - 百度网盘分享链接
     * @returns {Promise<Object>} 分享文件数据
     */
    async getShareData(link) {
        await this.getSurl(link);
        return await this.getShareList();
    }

    /**
     * 获取随机密钥(randsk)并更新Cookie
     * @returns {Promise<string>} 随机密钥
     */
    async getRandsk() {
        const url = `${this.api}/share/verify?surl=${this.shorturl}`;
        
        try {
            const response = await req(url, {
                method: "POST",
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
                    'Referer': 'https://pan.baidu.com',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `pwd=${this.pwd}`,
                timeout: 10000
            });
            
            if (response && response.content) {
                const result = JSON.parse(response.content);
                if (result.errno === 0 && result.randsk) {
                    const randsk = result.randsk;
                    let finalRandsk = randsk;
                    try {
                        finalRandsk = decodeURIComponent(randsk);
                    } catch (e) {
                        console.error('[BaiduDrive][getRandsk] 解码错误:', e);
                    }
                    
                    const BDCLND = "BDCLND=" + finalRandsk;
                    let currentCookie = this.cookie;
                    
                    if (!currentCookie.includes('BDCLND')) {
                        const newCookie = currentCookie ? currentCookie + ';' + BDCLND : BDCLND;
                        this.cookie = newCookie;
                    } else {
                        const cookieParts = currentCookie.split(';');
                        const updatedCookieParts = cookieParts.map(item => {
                            const trimmed = item.trim();
                            if (/^BDCLND=/.test(trimmed)) {
                                return BDCLND;
                            }
                            return trimmed;
                        });
                        const updatedCookie = updatedCookieParts.join('; ');
                        this.cookie = updatedCookie;
                    }
                    
                    return finalRandsk;
                }
            }
        } catch (error) {
            console.error('[BaiduDrive][getRandsk] 错误:', error);
        }
        
        return '';
    }

    /**
     * 获取分享文件列表
     * @returns {Promise<Object>} 文件列表对象
     */
    async getShareList() {
        await this.getRandsk();
        this.headers['cookie'] = this.cookie;
        
        const url = `${this.api}/share/list?web=5&shorturl=${this.shorturl}&root=1`;
        
        try {
            const response = await req(url, {
                method: "GET",
                headers: this.headers
            });
            
            if (response.content) {
                const data = JSON.parse(response.content);
                if (data.errno === 0 && data.list && data.list.length > 0) {
                    this.uk = data.uk;
                    this.shareid = data.share_id;
                    return await this.processFileList(data);
                }
            }
        } catch (error) {
            console.error('[BaiduDrive][getShareList] 错误:', error);
        }
        
        return {};
    }

    /**
     * 处理文件列表数据
     * @param {Object} data - 文件列表数据
     * @returns {Promise<Object>} 处理后的文件对象
     */
    async processFileList(data) {
        let file = {};
        let dirs = [];
        let videos = [];
        
        // 遍历文件列表，分类处理
        data.list.forEach((item) => {
            // 目录类型 (category: 6)
            if (item.category === '6' || item.category === 6) {
                dirs.push(item.path);
            }
            
            // 视频类型 (category: 1)
            if (item.category === '1' || item.category === 1) {
                const fileName = item.server_filename || item.path.split('/').pop();
                videos.push({
                    name: fileName,
                    path: item.path.replaceAll('#', '\0'),
                    uk: this.uk,
                    shareid: this.shareid,
                    fsid: item.fs_id || item.fsid
                });
            }
        });
        
        // 初始化文件对象
        if (data.title !== undefined) {
            file[data.title] = [];
            if (videos.length > 0) {
                file[data.title] = [...videos];
            }
        }
        
        // 递归获取子目录中的文件
        if (dirs.length > 0) {
            const results = await Promise.all(dirs.map(async (path) => {
                return await this.getSharepath(path);
            }));
            
            const subVideos = results
                .filter(item => item !== undefined && item !== null && item.length > 0)
                .flat();
            
            if (subVideos.length > 0 && data.title !== undefined) {
                const processedSubVideos = subVideos.map(item => {
                    if (item.name && item.name.includes('/')) {
                        item.name = item.name.split('/').pop();
                    }
                    return item;
                });
                file[data.title].push(...processedSubVideos);
            }
        }
        
        return file;
    }

    /**
     * 获取指定路径下的文件列表（递归）
     * @param {string} path - 目录路径
     * @returns {Promise<Array>} 文件列表数组
     */
    async getSharepath(path) {
        const currentCookie = this.cookie;
        const requestHeaders = {
            ...this.headers,
            'cookie': currentCookie
        };
        
        const encodedPath = encodeURIComponent(path);
        const url = `${this.api}/share/list?is_from_web=true&uk=${this.uk}&shareid=${this.shareid}&order=name&desc=0&showempty=0&view_mode=${this.view_mode}&web=1&page=1&num=100&dir=${encodedPath}&channel=${this.channel}&web=1&app_id=${this.app_id}`;
        
        try {
            const response = await req(url, {
                method: "GET",
                headers: requestHeaders
            });
            
            if (response.content) {
                const data = JSON.parse(response.content);
                if (data.errno === 0 && data.list && data.list.length > 0) {
                    let dirs = [];
                    let videos = [];
                    
                    data.list.forEach(item => {
                        if (item.category === '6' || item.category === 6) {
                            dirs.push(item.path);
                        }
                        if (item.category === '1' || item.category === 1) {
                            const fileName = item.server_filename || item.path.split('/').pop();
                            videos.push({
                                name: fileName,
                                path: item.path.replaceAll('#', '\0'),
                                uk: this.uk,
                                shareid: this.shareid,
                                fsid: item.fs_id || item.fsid
                            });
                        }
                    });
                    
                    // 递归处理子目录
                    if (dirs.length > 0) {
                        const results = await Promise.all(dirs.map(async (subPath) => {
                            return await this.getSharepath(subPath);
                        }));
                        const subDirVideos = results
                            .filter(item => item !== undefined && item !== null)
                            .flat();
                        const processedSubDirVideos = subDirVideos.map(item => {
                            if (item.name && item.name.includes('/')) {
                                item.name = item.name.split('/').pop();
                            }
                            return item;
                        });
                        return [...videos, ...processedSubDirVideos];
                    }
                    return videos;
                }
            }
        } catch (error) {
            console.error(`[BaiduDrive][getSharepath] 错误:`, error);
        }
        
        return [];
    }

    /**
     * 获取文件的播放链接（Web版）
     * @param {string} path - 文件路径
     * @param {string} uk - 用户标识
     * @param {string} shareid - 分享ID
     * @param {string} fsid - 文件ID
     * @returns {Promise<Array>} 不同清晰度的播放链接数组
     */
    async getShareUrl(path, uk, shareid, fsid) {
        path = path.replaceAll('\0', '#');
        let sign = await this.getSign();
        if (!sign) return [];
        
        let urls = [];
        let t = Math.floor(Date.now() / 1000);
        this.type.forEach(it => {
            urls.push({
                name: it.replace('M3U8_AUTO_', ''),
                url: `${this.api}/share/streaming?channel=${this.channel}&uk=${uk}&fid=${fsid}&sign=${sign}&timestamp=${t}&shareid=${shareid}&type=${it}&vip=0&jsToken&isplayer=1&check_blue=1&adToken`
            });
        });
        return urls;
    }

    /**
     * 获取用户UID
     * @returns {Promise<string>} 用户UID
     */
    async getUid() {
        const url = 'https://mbd.baidu.com/userx/v1/info/get?appname=baiduboxapp&fields=%20%20%20%20%20%20%20%20%5B%22bg_image%22,%22member%22,%22uid%22,%22avatar%22,%20%22avatar_member%22%5D&client&clientfrom&lang=zh-cn&tpl&ttt';
        
        try {
            const response = await req(url, {
                method: "GET",
                headers: this.headers
            });
            if (response.content) {
                const data = JSON.parse(response.content);
                if (data.data?.fields?.uid) {
                    return data.data.fields.uid;
                }
            }
        } catch (error) {
            console.error('[BaiduDrive][getUid] 错误:', error);
        }
        return '';
    }

    /**
     * SHA1哈希计算
     * @param {string} message - 待哈希的消息
     * @returns {string} SHA1哈希值
     */
    sha1(message) {
        return CryptoJS.SHA1(message).toString(CryptoJS.enc.Hex);
    }

    /**
     * 获取文件的直链地址（App版）
     * @param {string} path - 文件路径
     * @param {string} uk - 用户标识
     * @param {string} shareid - 分享ID
     * @param {string} fsid - 文件ID
     * @returns {Promise<string>} 直链地址
     */
    async getAppShareUrl(path, uk, shareid, fsid) {
        path = path.replaceAll('\0', '#');
        let BDCLND = await this.getRandsk();
        if (!BDCLND) return null;
        
        let uid = await this.getUid();
        if (!uid) return null;
        
        let header = {
            ...this.headers,
            "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;',
            'cookie': this.cookie
        };
        
        let devuid = "73CED981D0F186D12BC18CAE1684FFD5|VSRCQTF6W";
        let time = String(Date.now());
        
        const bdussMatch = this.cookie.match(/BDUSS=(.+?);/);
        if (!bdussMatch) return null;
        const bduss = bdussMatch[1];
        
        let rand = this.sha1(this.sha1(bduss) + uid + "ebrcUYiuxaZv2XGu7KIYKxUrqfnOfpDF" + time + devuid + "11.30.2ae5821440fab5e1a61a025f014bd8972");
        
        let url = this.api + "/share/list?shareid=" + shareid + "&uk=" + uk + "&fid=" + fsid + "&sekey=" + BDCLND + "&origin=dlna&devuid=" + devuid + "&clienttype=1&channel=android_12_zhao_bd-netdisk_1024266h&version=11.30.2&time=" + time + "&rand=" + rand;
        
        try {
            const response = await req(url, {
                method: "GET",
                headers: header
            });
            if (response.content) {
                const data = JSON.parse(response.content);
                if (data.errno === 0 && data.list && data.list.length > 0) {
                    return data.list[0].dlink;
                }
            }
        } catch (error) {
            console.error('[BaiduDrive][getAppShareUrl] 错误:', error);
        }
        return null;
    }

    /**
     * 通过分享URL获取文件列表
     * @param {string|Object} shareInfo - 分享链接或分享数据
     * @returns {Promise<Object>} 文件数据对象
     */
    async getFilesByShareUrl(shareInfo) {
        const shareData = typeof shareInfo === 'string' ? await this.getShareData(shareInfo) : shareInfo;
        if (!shareData || Object.keys(shareData).length === 0) return {};
        return shareData;
    }
}

// 导出百度网盘实例
export const Baidu = new BaiduDrive();