#!node
// const isLog = false;
const isLog = false;
const lib = require("../lib");
const spinner = lib.ora('开始打包\r\n').start();
const logger = (...log) => isLog && console.log(log);
const cLogger = (c, ...log) => lib.chalk[c] && console.log(lib.chalk[c](...log));
// cLogger("green", "...");
const pwd = process.cwd();
const argv = lib.minimist(process.argv.slice(2));
// const replaceDomain = "https://rpa.gw-ec.com"
const replaceDomain = "https://rpa.gw-ec.com";
const replacePath = "";
//返回运行路径下面绝对路径
const fullPath = (dir) => lib.path.join(pwd, dir);
let dirs = ["mainIframe", "popupIframe", "winIframe"];
const mainJs = fullPath("main.js");
const manifestJson = fullPath("manifest.json");

//校验manifest是否合格
const manifestValidate = require("../lib/manifestValidate")
if (!manifestValidate(manifestJson)) throw new TypeError("manifest.json格式不正确");

// 返回文件夹下面的所有文件 dirent 类型
const getDirFile = (dir) => lib.fs.
    readdirSync(dir, { encoding: "utf8", withFileTypes: true })
    .filter(f => f.isFile());

// 获取文件内容 字符串形式返回
const getFileContent = (file, con = false, com = false) => {
    let str = lib.fs.readFileSync(file, { encoding: "utf8" });
    logger("file====", file);
    logger("con==", con, "com===", com);

    if (con) str = lib.javaScriptObfuscator(str, {
        compact: true,
        controlFlowFlattening: true
    });
    if (com) str = lib.lzString.compress(str);
    return str;
}

//是否压缩&混淆
const isCon = argv._.includes("con");
const isCom = argv._.includes("com");

let result = {
    main: getFileContent(mainJs, isCon, isCom),
    mainIframe: [],
    popupIframe: [],
    winIframe: []
};

spinner.succeed(`打包 main.js 成功`);

dirs.forEach(e => {

    const fullDir = fullPath(e);
    let res = [];

    spinner.color = "yellow";
    spinner.text = fullDir;
    const htmlFiles = getDirFile(fullDir).filter(f => /\.html$/.test(f.name));

    const assets = lib.path.join(fullDir, "assets");
    let isExists = lib.fs.existsSync(fullDir);

    if (!isExists) {
        spinner.warn(`${e} 不存在`);
    }

    let cssJsFiles = lib.fs.existsSync(assets) ? getDirFile(assets).filter(f => /(\.(css|js))$/.test(f.name)) : [];

    const jss = [];
    const csss = [];

    cssJsFiles.forEach(f => {
        let res = /\.js$/.test(f.name) ? jss : csss;

        let filePath = lib.path.join(assets, f.name);
        let name = `./assets/${f.name}`;

        let str = "";
        if (jss == res) getFileContent(filePath, isCon, isCom);
        else getFileContent(filePath);
        return res.push({ name, str });

    });

    htmlFiles.forEach(f => {

        let r = {
            name: f.name,
            codes: [],
            html: ""
        };
        let html = getFileContent(lib.path.join(fullDir, f.name));
        let $ = lib.$.load(html, { decodeEntities: false });

        let scripts = $("script");
        let links = $("link");

        // 抽取script
        scripts.each((s, e) => {

            let src = e.attribs.src;
            let scr = $(e).html();

            //直接删除
            if (scr && !src) {
                r.codes.push(scr);
                return $(e).remove();
            }

            // 删除但从assets中获取
            if (!scr && src.indexOf("./assets/") == 0) {
                let js = jss.find(j => j.name == src);
                r.codes.push(js.str);
                return $(e).remove();
            }

            // 替换domain
            if (src && src.indexOf(replaceDomain) == 0) {
                $(e).attr("src", src.replace(replaceDomain, replacePath));
            }

        });

        // 填充style
        links.each((s, e) => {
            let href = e.attribs.href;
            if (href && href.indexOf("./assets/") == 0) {
                let css = csss.find(c => c.name == href);
                if (css) {
                    $(e.parent).append(`\r\n<style>\r\n${css.str}\r\n</style>\r\n`);
                    return $(e).remove();
                }
            }

            if (href && href.indexOf(replaceDomain) == 0) {
                $(e).attr("href", href.replace(replaceDomain, replacePath));
            }
        });

        r.html = $.html();
        // console.log("test=====", "html===", r.html, "name", r.name, "codes", r.codes);
        res.push(r);
    });

    result[e] = res;
    if (isExists) spinner.succeed(`打包 ${e} 成功`);
});
lib.fs.writeFileSync("robot.rpk", JSON.stringify(result));
spinner.stop();