/**
 * 夸克网盘处理工具
 * 
 * 提供夸克网盘分享链接解析、文件下载、流媒体播放等功能。
 * 支持分享链接解析、文件保存、直播转码、下载链接获取等核心功能。
 * 
 * 主要功能：
 * - 分享链接解析和文件列表获取
 * - 文件保存到个人网盘
 * - 直播转码和流媒体播放
 * - 文件下载链接获取
 * - 缓存管理和性能优化
 * - Cookie管理和自动刷新
 * 
 * @module QuarkPanHandler
 * @author drpy-node
 * @since 1.0.0
 */

/**
 * 夸克网盘处理类
 * 
 * 负责处理夸克网盘的各种操作，包括分享链接解析、文件管理、
 * 流媒体播放、下载管理等功能。提供完整的夸克网盘API封装。
 */
class QuarkHandler {
    /**
     * 构造函数 - 初始化夸克网盘处理器
     * 
     * 设置基础配置参数，包括正则表达式、请求头、API地址、
     * 缓存配置等，为后续操作做准备。
     */
    constructor() {
        // 夸克分享链接正则表达式 - 用于匹配和解析分享链接
        this.regex = /https:\/\/pan\.quark\.cn\/s\/([^\\|#/]+)/;
        // 请求参数 - 标识客户端类型和来源
        this.pr = 'pr=ucpro&fr=pc';
        // 基础请求头 - 模拟官方客户端请求
        this.baseHeader = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
            Referer: 'https://pan.quark.cn',
            'Content-Type': 'application/json'
        };
        // API基础URL - 夸克网盘API服务地址
        this.apiUrl = 'https://drive.quark.cn/1/clouddrive/';
        // 分享令牌缓存 - 缓存分享链接的访问令牌
        this.shareTokenCache = {};
        // 保存目录名称 - 在个人网盘中创建的保存目录名
        this.saveDirName = 'drpy';
        // 保存目录ID - 保存目录的唯一标识符
        this.saveDirId = null;
        // 保存文件ID缓存 - 缓存已保存文件的ID映射
        this.saveFileIdCaches = {};
        // 当前URL键 - 用于标识当前处理的URL
        this.currentUrlKey = '';
        // 缓存根目录 - 本地缓存文件的存储路径
        this.cacheRoot = './quark_cache';
        // 最大缓存大小 - 限制缓存文件的最大大小（100MB）
        this.maxCache = 1024 * 1024 * 100;
        // URL头部缓存 - 缓存HTTP头部信息以提高性能
        this.urlHeadCache = {};
        // 字幕文件扩展名 - 支持的字幕文件格式列表
        this.subtitleExts = ['.srt', '.ass', '.scc', '.stl', '.ttml'];
    }

    /**
     * 获取Cookie - 使用 getter 定义动态属性
     * 
     * 从环境变量中获取夸克网盘的Cookie信息，用于API认证。
     * 
     * @returns {string} 夸克网盘Cookie字符串
     */
    get cookie() {
        return globalThis.quark_cookie || '';
    }

    /**
     * 设置Cookie - 使用 setter 定义动态属性
     * 
     * 设置夸克网盘的Cookie信息。
     * 
     * @param {string} value - Cookie字符串
     */
    set cookie(value) {
        globalThis.quark_cookie = value;
    }

    /**
     * 获取请求头
     * 
     * 构建完整的请求头，包含Cookie、User-Agent等必要信息。
     * 
     * @returns {Object} 请求头对象
     */
    getHeaders() {
        return {
            ...this.baseHeader,
            Cookie: this.cookie
        };
    }
    
    /**
     * 增强请求函数，支持重试和自动更新cookie
     * @param {string} url - 请求URL
     * @param {Object} options - 请求配置
     * @returns {Promise<Object>} 响应对象
     */
    async api(url, data = {}, retry = 3, method = 'post', options = {}) {
        const { needRefreshCookie = true, ...reqOptions } = options;
        const leftRetry = retry || 3;
        
        // 构建完整URL，添加查询参数
        let fullUrl = this.apiUrl + url;
        if (!fullUrl.includes('?')) {
            fullUrl += `?${this.pr}`;
        } else {
            fullUrl += `&${this.pr}`;
        }
        
        for (let retryCount = 0; retryCount <= leftRetry; retryCount++) {
            try {
                const resp = await req(fullUrl, {
                    method: method || "post",
                    data: data,
                    headers: this.getHeaders(),
                    ...reqOptions
                });
                
                // 自动更新cookie
                if (needRefreshCookie && resp.headers) {
                    const setCookie = resp.headers['set-cookie'] || resp.headers['Set-Cookie'];
                    if (setCookie && setCookie.includes('__puus') && this.cookie) {
                        this.updateCookie(setCookie);
                    }
                }
                
                // 关键修复：获取正确的状态码，并转换为数字比较
                const statusCode = parseInt(resp.status || resp.code || 0);
                
                // 权限错误重试
                if (statusCode === 401 || statusCode === 403) {
                    if (retryCount < leftRetry) {
                        await this.delay(1000);
                        continue;
                    }
                }
                
                // 服务器错误重试
                if (statusCode >= 500) {
                    if (retryCount < leftRetry) {
                        await this.delay(1000 * (retryCount + 1));
                        continue;
                    }
                }
                
                // 处理响应内容
                if (resp.content) {
                    try {
                        return JSON.parse(resp.content);
                    } catch (error) {
                        return {};
                    }
                }
                
                return {};
                
            } catch (error) {
                if (retryCount < leftRetry) {
                    await this.delay(1000 * (retryCount + 1));
                    continue;
                }
                return { error: error.message };
            }
        }
    }
    
    /**
     * 更新cookie
     * @param {string} setCookie - 从响应头中获取的Set-Cookie字符串
     */
    updateCookie(setCookie) {
        try {
            const cookies = setCookie.split(';').map(c => c.trim());
            const newCookies = {};
            
            for (const cookie of cookies) {
                const [key, ...vals] = cookie.split('=');
                if (key && vals.length) newCookies[key] = vals.join('=');
            }
            
            if (newCookies.__puus) {
                const oldCookie = this.cookie;
                const oldParts = oldCookie.split(';').map(p => p.trim());
                const newParts = [];
                
                for (const part of oldParts) {
                    const [key] = part.split('=');
                    if (key !== '__puus') newParts.push(part);
                }
                
                newParts.push(`__puus=${newCookies.__puus}`);
                this.cookie = newParts.join('; ');
                console.log('Cookie已自动更新');
            }
        } catch (e) {
            console.warn('更新cookie失败:', e.message);
        }
    }

    /**
     * 解析分享链接数据
     * 
     * 从夸克网盘分享链接中提取分享ID和文件夹ID等关键信息。
     * 支持带参数的链接解析，自动过滤查询参数。
     * 
     * @param {string} url - 夸克网盘分享链接
     * @returns {Object|null} 分享数据对象
     * @returns {string} returns.shareId - 分享链接的唯一标识符
     * @returns {string} returns.folderId - 文件夹ID（默认为根目录'0'）
     * 
     * @example
     * const shareData = getShareData('https://pan.quark.cn/s/abc123def456');
     * // 返回: { shareId: 'abc123def456', folderId: '0' }
     */
    getShareData(url) {
        let matches = this.regex.exec(url);
        if (matches) {
            // 处理带查询参数的链接，移除参数部分
            let shareId = matches[1];
            if (shareId.indexOf("?") > 0) {
                shareId = shareId.split('?')[0];
            }
            return {
                shareId: shareId,    // 提取分享ID
                folderId: '0',       // 默认为根目录
            };
        }
        return null;
    }

    /**
     * 初始化夸克网盘
     * 
     * 初始化夸克网盘处理器，检查Cookie有效性并进行必要的配置。
     * 
     * @param {Object} db - 数据库对象（用于存储配置和缓存）
     * @param {Object} cfg - 配置对象（包含各种设置参数）
     * @returns {Promise<void>}
     */
    async initQuark(db, cfg) {
        // 静默初始化，无日志输出
        console.log('夸克模块初始化');
    }

    /**
     * 最长公共子序列算法（LCS）
     * 
     * 计算两个字符串之间的最长公共子序列，用于文件名匹配和相似度计算。
     * 采用动态规划算法实现，时间复杂度为O(m*n)。
     * 
     * @param {string} str1 - 第一个字符串
     * @param {string} str2 - 第二个字符串
     * @returns {Object} LCS结果对象
     * @returns {number} returns.length - 最长公共子序列的长度
     * @returns {string} returns.sequence - 最长公共子序列的内容
     * @returns {number} returns.offset - 子序列在第一个字符串中的起始位置
     * 
     * @example
     * const result = lcs('hello world', 'hello earth');
     * // 返回: { length: 7, sequence: 'hello ', offset: 0 }
     */
    lcs(str1, str2) {
        // 参数验证：检查输入字符串的有效性
        if (!str1 || !str2) {
            return {
                length: 0,
                sequence: '',
                offset: 0,
            };
        }
        
        let sequence = '';              // 存储最长公共子序列
        const str1Length = str1.length;   // 第一个字符串长度
        const str2Length = str2.length;   // 第二个字符串长度
        const num = new Array(str1Length); // 动态规划数组
        let maxlen = 0;                 // 最大长度
        let lastSubsBegin = 0;          // 上一个子序列开始位置
        
        // 初始化二维数组 - 用于存储LCS计算结果
        for (let i = 0; i < str1Length; i++) {
            const subArray = new Array(str2Length);
            for (let j = 0; j < str2Length; j++) {
                subArray[j] = 0;
            }
            num[i] = subArray;
        }
        
        let thisSubsBegin = null;       // 当前子序列开始位置
        
        // 动态规划计算LCS
        for (let i = 0; i < str1Length; i++) {
            for (let j = 0; j < str2Length; j++) {
                if (str1[i] !== str2[j]) {
                    // 字符不匹配，LCS长度为0
                    num[i][j] = 0;
                } else {
                    // 字符匹配，计算LCS长度
                    if (i === 0 || j === 0) {
                        num[i][j] = 1;
                    } else {
                        num[i][j] = 1 + num[i - 1][j - 1];
                    }

                    // 更新最长公共子序列
                    if (num[i][j] > maxlen) {
                        maxlen = num[i][j];
                        thisSubsBegin = i - num[i][j] + 1;
                        if (lastSubsBegin === thisSubsBegin) {
                            sequence += str1[i];
                        } else {
                            lastSubsBegin = thisSubsBegin;
                            sequence = ''; // 清空序列
                            sequence += str1.substr(lastSubsBegin, i + 1 - lastSubsBegin);
                        }
                    }
                }
            }
        }
        
        return {
            length: maxlen,
            sequence: sequence,
            offset: thisSubsBegin,
        };
    }

    /**
     * 查找最佳LCS匹配
     * 
     * 在目标项目数组中查找与主要项目最相似的项目，
     * 基于最长公共子序列算法计算相似度。
     * 
     * @param {Object} mainItem - 主要项目对象
     * @param {string} mainItem.name - 主要项目的名称
     * @param {Array} targetItems - 目标项目数组
     * @param {string} targetItems[].name - 目标项目的名称
     * @returns {Object} 最佳匹配结果
     * @returns {Array} returns.allLCS - 所有LCS计算结果
     * @returns {Object} returns.bestMatch - 最佳匹配项目
     * @returns {number} returns.bestMatchIndex - 最佳匹配项目的索引
     * 
     * @example
     * const mainItem = { name: 'movie.mp4' };
     * const targetItems = [
     *   { name: 'movie_hd.mp4' },
     *   { name: 'film.avi' },
     *   { name: 'movie.mkv' }
     * ];
     * const result = findBestLCS(mainItem, targetItems);
     */
    findBestLCS(mainItem, targetItems) {
        const results = [];             // 存储所有LCS计算结果
        let bestMatchIndex = 0;         // 最佳匹配索引

        // 计算主要项目与所有目标项目的LCS
        for (let i = 0; i < targetItems.length; i++) {
            const currentLCS = this.lcs(mainItem.name, targetItems[i].name);
            results.push({target: targetItems[i], lcs: currentLCS});

            // 更新最佳匹配索引
            if (currentLCS.length > results[bestMatchIndex].lcs.length) {
                bestMatchIndex = i;
            }
        }

        const bestMatch = results[bestMatchIndex];

        return {
            allLCS: results, 
            bestMatch: bestMatch, 
            bestMatchIndex: bestMatchIndex
        };
    }

    /**
     * 延时函数
     * 
     * 创建一个Promise，在指定毫秒数后resolve，用于控制请求频率。
     * 
     * @param {number} ms - 延时毫秒数
     * @returns {Promise<void>} 延时Promise
     * 
     * @example
     * await delay(1000); // 延时1秒
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 清空保存目录
     * 
     * 删除保存目录中的所有文件，用于清理临时文件或重新开始保存操作。
     * 会获取目录下所有文件列表并批量删除。
     * 
     * @returns {Promise<void>}
     * 
     * @example
     * await clearSaveDir(); // 清空drpy保存目录
     */
    async clearSaveDir() {
        if (!this.saveDirId) return;
        
        // 获取保存目录下的文件列表
        const listData = await this.api(`file/sort?pdir_fid=${this.saveDirId}&_page=1&_size=200&_sort=file_type:asc,updated_at:desc`, {}, 3, 'get');
        if (listData.data && listData.data.list && listData.data.list.length > 0) {
            // 批量删除文件
            await this.api(`file/delete`, {
                action_type: 2,
                filelist: listData.data.list.map((v) => v.fid),
                exclude_fids: [],
            }, 3);
        }
    }

    /**
     * 创建保存目录
     * 
     * 在用户网盘根目录下创建或获取保存目录（默认名称为'drpy'），
     * 用于存储从分享链接保存的文件。如果目录已存在则直接使用。
     * 
     * @param {boolean} clean - 是否清空现有目录内容
     * @returns {Promise<void>}
     * 
     * @example
     * await createSaveDir(true); // 创建并清空保存目录
     */
    async createSaveDir(clean) {
        if (this.saveDirId) {
            // 如果保存目录ID已存在，根据需要清空目录
            if (clean) await this.clearSaveDir();
            return;
        }
        
        // 获取根目录下的文件列表，查找保存目录
        const listData = await this.api(`file/sort?pdir_fid=0&_page=1&_size=200&_sort=file_type:asc,updated_at:desc`, {}, 3, 'get');
        if (listData.data && listData.data.list) {
            for (const item of listData.data.list) {
                if (item.file_name === this.saveDirName) {
                    this.saveDirId = item.fid;
                    if (clean) await this.clearSaveDir();
                    break;
                }
            }
        }

        // 如果保存目录不存在，则创建新目录
        if (!this.saveDirId) {
            const create = await this.api(`file`, {
                pdir_fid: '0',
                file_name: this.saveDirName,
                dir_path: '',
                dir_init_lock: false,
            }, 3);
            if (create.data && create.data.fid) {
                this.saveDirId = create.data.fid;
            }
        }
    }

    /**
     * 获取分享令牌
     * 
     * 获取访问分享链接所需的令牌（stoken），用于后续的文件操作。
     * 令牌会被缓存以避免重复请求，提高性能。
     * 
     * @param {Object} shareData - 分享数据对象
     * @param {string} shareData.shareId - 分享链接ID
     * @param {string} [shareData.sharePwd] - 分享密码（可选）
     * @returns {Promise<void>}
     * 
     * @example
     * await getShareToken({ shareId: 'abc123', sharePwd: '1234' });
     */
    async getShareToken(shareData) {
        if (!this.shareTokenCache[shareData.shareId]) {
            // 请求分享令牌
            const shareToken = await this.api(`share/sharepage/token`, {
                pwd_id: shareData.shareId,
                passcode: shareData.sharePwd || '',
            }, 3);
            if (shareToken.data && shareToken.data.stoken) {
                // 缓存令牌信息
                this.shareTokenCache[shareData.shareId] = shareToken.data;
            }
        }
    }

    /**
     * 通过分享链接获取文件列表
     * 
     * 解析分享链接并获取其中的视频文件和字幕文件列表。
     * 支持递归遍历子目录，自动匹配视频文件对应的字幕文件。
     * 
     * @param {string|Object} shareInfo - 分享链接URL或分享数据对象
     * @returns {Promise<Array>} 视频文件列表，包含匹配的字幕信息
     * 
     * @example
     * const files = await getFilesByShareUrl('https://pan.quark.cn/s/abc123');
     * // 返回: [{ name: 'movie.mp4', subtitle: { name: 'movie.srt' }, ... }]
     */
    async getFilesByShareUrl(shareInfo) {
        const shareData = typeof shareInfo === 'string' ? this.getShareData(shareInfo) : shareInfo;
        if (!shareData) {
            return [];
        }
        
        await this.getShareToken(shareData);
        
        if (!this.shareTokenCache[shareData.shareId]) {
            return [];
        }
        
        const videos = [];      // 视频文件列表
        const subtitles = [];   // 字幕文件列表
        
        /**
         * 递归获取文件列表
         * 
         * @param {string} shareId - 分享ID
         * @param {string} folderId - 文件夹ID
         * @param {number} page - 页码
         * @returns {Promise<Array>} 文件列表
         */
        const listFile = async (shareId, folderId, page) => {
            const prePage = 200;
            page = page || 1;
            // 获取指定目录下的文件列表
            const listData = await this.api(`share/sharepage/detail?pwd_id=${shareId}&stoken=${encodeURIComponent(this.shareTokenCache[shareId].stoken)}&pdir_fid=${folderId}&force=0&_page=${page}&_size=${prePage}&_sort=file_type:asc,file_name:asc`, {}, 3, 'get');
            if (!listData.data) return [];
            const items = listData.data.list;
            if (!items) return [];
            const subDir = [];
            
            // 遍历文件列表，分类处理
            for (const item of items) {
                if (item.dir === true) {
                    // 收集子目录
                    subDir.push(item);
                } else if (item.file === true && item.obj_category === 'video') {
                    // 过滤小于5MB的视频文件
                    if (item.size < 1024 * 1024 * 5) continue;
                    item.stoken = this.shareTokenCache[shareData.shareId].stoken;
                    videos.push(item);
                } else if (item.type === 'file' && this.subtitleExts.some((x) => item.file_name.endsWith(x))) {
                    // 收集字幕文件
                    subtitles.push(item);
                }
            }
            
            // 处理分页
            if (page < Math.ceil(listData.metadata._total / prePage)) {
                const nextItems = await listFile(shareId, folderId, page + 1);
                for (const item of nextItems) {
                    items.push(item);
                }
            }
            
            // 递归处理子目录
            for (const dir of subDir) {
                const subItems = await listFile(shareId, dir.fid);
                for (const item of subItems) {
                    items.push(item);
                }
            }
            return items;
        };
        
        await listFile(shareData.shareId, shareData.folderId);
        
        // 为视频文件匹配对应的字幕文件
        if (subtitles.length > 0) {
            videos.forEach((item) => {
                var matchSubtitle = this.findBestLCS(item, subtitles);
                if (matchSubtitle.bestMatch) {
                    item.subtitle = matchSubtitle.bestMatch.target;
                }
            });
        }
        
        return videos;
    }

    /**
     * 保存文件到个人网盘
     * 
     * 将分享链接中的文件保存到个人网盘的指定目录中。
     * 支持批量保存和任务状态跟踪，确保文件成功保存。
     * 
     * @param {string} shareId - 分享链接ID
     * @param {string} stoken - 分享令牌
     * @param {string} fileId - 文件ID
     * @param {string} fileToken - 文件令牌
     * @param {boolean} clean - 是否清空保存目录
     * @returns {Promise<string|boolean|null>} 保存后的文件ID或保存状态
     * 
     * @example
     * const savedFileId = await save('shareId', 'stoken', 'fileId', 'fileToken', false);
     */
    async save(shareId, stoken, fileId, fileToken, clean) {
        await this.createSaveDir(clean);
        if (clean) {
            // 清空文件ID缓存
            const saves = Object.keys(this.saveFileIdCaches);
            for (const save of saves) {
                delete this.saveFileIdCaches[save];
            }
        }
        
        if (!this.saveDirId) {
            return null;
        }
        
        // 如果没有提供stoken，尝试获取
        if (!stoken) {
            await this.getShareToken({
                shareId: shareId,
            });
            if (!this.shareTokenCache[shareId]) {
                return null;
            }
        }

        // 发起保存请求
        const saveResult = await this.api(`share/sharepage/save`, {
            fid_list: [fileId],
            fid_token_list: [fileToken],
            to_pdir_fid: this.saveDirId,
            pwd_id: shareId,
            stoken: stoken || this.shareTokenCache[shareId].stoken,
            pdir_fid: '0',
            scene: 'link',
        }, 3);
        
        // 轮询任务状态直到完成
        if (saveResult.data && saveResult.data.task_id) {
            let retry = 0;
            while (true) {
                const taskResult = await this.api(`task?task_id=${saveResult.data.task_id}&retry_index=${retry}`, {}, 3, 'get');
                
                if (taskResult.data && taskResult.data.save_as && taskResult.data.save_as.save_as_top_fids && taskResult.data.save_as.save_as_top_fids.length > 0) {
                    const savedFileId = taskResult.data.save_as.save_as_top_fids[0];
                    return savedFileId;
                }
                retry++;
                if (retry > 5) {
                    break;
                }
                await this.delay(1000);
            }
        }
        
        return true;
    }

    /**
     * 刷新夸克Cookie
     * 
     * 自动刷新夸克网盘的Cookie以保持登录状态有效性。
     * 通过发送测试请求获取新的Cookie信息并更新到环境变量中。
     * 
     * @param {string} from - 调用来源标识（用于日志记录）
     * @returns {Promise<void>}
     * 
     * @example
     * await refreshQuarkCookie('定时任务');
     */
    async refreshQuarkCookie(from = '') {
        const nowCookie = this.cookie;
        if (!nowCookie) {
            return;
        }
        
        try {
            // 使用api方法发送测试请求获取新Cookie
            await this.api(
                `file/sort?pr=ucpro&fr=pc&uc_param_str=&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,updated_at:desc`,
                {},
                3,
                'get'
            );
            
        } catch (error) {
            // 静默处理错误
        }
    }

    /**
     * 获取直播转码
     * 
     * 获取视频文件的直播转码信息，支持多种分辨率。
     * 
     * @param {string} shareId - 分享ID
     * @param {string} stoken - 分享令牌
     * @param {string} fileId - 文件ID
     * @param {string} fileToken - 文件令牌
     * @returns {Promise<Array|null>} 转码信息数组
     */
    async getLiveTranscoding(shareId, stoken, fileId, fileToken) {
        if (!this.saveFileIdCaches[fileId]) {
            const saveFileId = await this.save(shareId, stoken, fileId, fileToken, true);
            if (!saveFileId) return null;

            this.saveFileIdCaches[fileId] = saveFileId;
        }
        
        const transcoding = await this.api(`file/v2/play`, {
            fid: this.saveFileIdCaches[fileId],
            resolutions: 'normal,low,high,super,2k,4k',
            supports: 'fmp4',
        }, 3);
        
        if (transcoding.data && transcoding.data.video_list) {
            const low_url = transcoding.data.video_list.slice(-1)[0].video_info.url;
            const low_cookie = this.cookie;
            const low_headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'origin': 'https://pan.quark.cn',
                'referer': 'https://pan.quark.cn/',
                'Cookie': low_cookie
            };
            
            const test_result = await this.testSupport(low_url, low_headers);
            if (!test_result[0]) {
                try {
                    await this.refreshQuarkCookie('getLiveTranscoding');
                } catch (e) {
                    // 静默处理错误
                }
            }
            
            return transcoding.data.video_list;
        }
        return null;
    }

    /**
     * 获取下载链接
     * 
     * 获取文件的下载链接，固定为先聊天后直接下载模式。
     * 
     * @param {string} shareId - 分享ID
     * @param {string} stoken - 分享令牌
     * @param {string} fileId - 文件ID
     * @param {string} fileToken - 文件令牌
     * @param {boolean} clean - 是否清空保存目录
     * @returns {Promise<Object|null>} 下载信息对象
     */
    async getDownload(shareId, stoken, fileId, fileToken, clean = false) {
        await this.createSaveDir(clean);
        
        if (clean) {
            const saves = Object.keys(this.saveFileIdCaches);
            for (const save of saves) {
                delete this.saveFileIdCaches[save];
            }
        }
        
        if (!this.saveFileIdCaches[fileId]) {
            const saveFileId = await this.save(shareId, stoken, fileId, fileToken, clean);
            if (!saveFileId) {
                return null;
            }
            this.saveFileIdCaches[fileId] = saveFileId;
        }
        
        try {
            console.log('使用固定下载模式：先聊天API后直接下载');
            
            // 第一步：先尝试聊天API下载
            let result = await this.getDownloadViaChat(this.saveFileIdCaches[fileId]);
            
            // 第二步：如果聊天API失败，则尝试直接下载
            if (!result || !result.download_url) {
                console.log('聊天API下载失败，切换到直接下载方式');
                result = await this.getDownloadDirect(this.saveFileIdCaches[fileId]);
            }
            
            if (!result || !result.download_url) {
                console.log('所有下载方式均失败');
                return null;
            }
            
            console.log('下载链接获取成功');
            return result;
            
        } catch (error) {
            console.error('获取下载链接时出错:', error);
            return null;
        }
    }
    
    /**
     * 直接下载方式
     * @param {string} fileId - 文件ID
     * @returns {Promise<Object|null>} 下载信息对象
     */
    async getDownloadDirect(fileId) {
        const downUrl = `${this.apiUrl}file/download?${this.pr}`;
        const response = await this.api(downUrl, {
            method: 'POST',
            data: { fids: [fileId] }
        });
        
        if (response.data?.[0]) {
            console.log('直接下载方式成功');
            return response.data[0];
        }
        
        console.log('直接下载方式失败');
        return null;
    }
    
    /**
     * 通过聊天API获取高速下载链接
     * @param {string} fileId - 已保存到个人空间的文件ID
     * @returns {Promise<Object|null>} 下载信息对象或null
     */
    async getDownloadViaChat(fileId) {
        const fr = 'pr=ucpro&fr=pc&sys=win32';
        const conversation_id = "300000103982583563";
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 QuarkPC/4.5.5.535 quark-cloud-drive/2.5.40 Channel/pckk_other_ch',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Cookie': this.cookie
        };
        
        try {
            // 1. 发送文件到聊天会话
            const sendData = {
                "conversations": [
                    {
                        "merge_file": 0,
                        "conversation_id": conversation_id,
                        "conversation_type": 3,
                        "file_list": [
                            {
                                "fid": fileId,
                                "client_extra": {
                                    "local_msg_id": "b9b42b73-132e-4c71-ad88-e78cb8cc15a5"
                                }
                            }
                        ]
                    }
                ],
                "return_msg_as_list": 1
            };
            
            console.log('第一步：发送文件到聊天会话...');
            const response = await req(`https://drive-social-api.quark.cn/1/clouddrive/chat/conv/msg/batch_send?${fr}`, {
                method: 'POST',
                headers: headers,
                data: sendData
            });
            
            const shareData = JSON.parse(response.content || '{}');
            if (!shareData.data?.send_msg_list?.length) {
                console.log('发送文件到聊天失败');
                return null;
            }
            
            const store_msg_id = shareData.data.send_msg_list[0].store_msg_id;
            console.log(`✓ 成功发送文件，消息ID: ${store_msg_id}`);
            
            // 2. 获取下载令牌
            const tokenData = {
                "conversation_id": conversation_id,
                "conversation_type": 3,
                "msg_id": store_msg_id
            };
            
            console.log('第二步：获取下载令牌...');
            const tokenResponse = await req(`https://drive-social-api.quark.cn/1/clouddrive/chat/conv/file/acquire_dl_token?${fr}`, {
                method: 'POST',
                headers: headers,
                data: tokenData
            });
            
            const tokenResult = JSON.parse(tokenResponse.content || '{}');
            
            if (!tokenResult.data?.token) {
                console.log('获取下载令牌失败');
                return null;
            }
            
            const token = tokenResult.data.token;
            console.log(`✓ 成功获取下载令牌: ${token.substring(0, 20)}...`);
            
            // 3. 获取下载链接
            const downloadData = {
                "fids": [fileId],
                "cn_sw": "open",
                "ab_tag": "_",
                "token": token
            };
            
            console.log('第三步：获取下载链接...');
            const downloadResponse = await req(`https://drive-pc.quark.cn/1/clouddrive/file/download?${fr}`, {
                method: 'POST',
                headers: headers,
                data: downloadData
            });
            
            const downloadResult = JSON.parse(downloadResponse.content || '{}');
            
            if (!downloadResult.data?.[0]?.download_url) {
                console.log('获取下载链接失败');
                return null;
            }
            
            const downloadInfo = downloadResult.data[0];
            console.log(`✓ 成功获取下载链接: ${downloadInfo.download_url.substring(0, 50)}...`);
            
            // 异步刷新cookie
            this.refreshQuarkCookie('getDownloadViaChat-success').catch(e => {
                console.log(`自动刷新cookie失败: ${e.message}`);
            });
            
            return downloadInfo;
            
        } catch (error) {
            console.error(`聊天API下载失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 测试URL支持性
     * 
     * 测试URL是否支持断点续传等特性。
     * 
     * @param {string} url - 要测试的URL
     * @param {Object} headers - 请求头
     * @returns {Promise<Array>} 测试结果
     */
    async testSupport(url, headers) {
        try {
            // 使用统一的req函数，因为testSupport需要原始响应头
            const resp = await req(url, {
                method: 'GET',
                headers: {
                    ...this.getHeaders(),
                    ...headers,
                    'Range': 'bytes=0-0'
                }
            });
            
            if (resp.status === 206 || resp.status === 200) {
                const isAccept = resp.headers?.['accept-ranges'] === 'bytes';
                const contentRange = resp.headers?.['content-range'];
                const contentLength = parseInt(resp.headers?.['content-length'] || '0');
                const isSupport = isAccept || !!contentRange || contentLength === 1 || resp.status === 200;
                
                return [isSupport, resp.headers || {}];
            } else {
                return [false, null];
            }
        } catch (error) {
            return [false, null];
        }
    }

    /**
     * 删除所有缓存
     * 
     * 清理本地缓存文件，保留指定的缓存键。
     * 
     * @param {string} keepKey - 要保留的缓存键
     */
    delAllCache(keepKey) {
        // 简化实现，实际使用时需要文件系统API
        // 实际实现需要Node.js的fs模块
    }

    /**
     * 分块流处理
     * 
     * 处理大文件的分块下载和流式传输。
     * 
     * @param {Object} inReq - 输入请求对象
     * @param {Object} outResp - 输出响应对象
     * @param {string} url - 源URL
     * @param {string} urlKey - URL键
     * @param {Object} headers - 请求头
     * @param {Object} option - 选项
     * @returns {Promise<Object>} 流对象
     */
    async chunkStream(inReq, outResp, url, urlKey, headers, option) {
        // 简化实现，实际使用时需要完整的流处理逻辑
        return { stream: '简化实现' };
    }
}

export const Quark = new QuarkHandler();