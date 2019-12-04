# rpa-cli

## install 
```js
npm install rpa-cli -g
```

## example
```js
// con js混淆  com压缩成二级制
cd existsRobotDir;
rpa-cli con com;
```
## 打包后会在当前目录下生成一个robot.rpk文件
- 解压方式 let decompressedString = lz-string.decompress(compressedStr);
- robot.rpk文件内容格式
```json
{
    "mainIframe": [
        {
            "name": "filename.html", //文件名
            "html": "",   // html内容
            "codes": "console.log('outline script') \r\n console.log('inline script')" 
        } 
    ],
    "popupIframe": [
        {
            "name": "filename.html", //文件名
            "html": "",   // html内容
            "codes": "console.log('outline script') \r\n console.log('inline script')" 
        } 
    ],
    "winIframe": [
        {
            "name": "filename.html", //文件名
            "html": "",   // html内容
            "codes": "console.log('outline script') \r\n console.log('inline script')" 
        } 
    ],
    "main": {
        "name": "filename.js", // js文件名
        "codes": "console.log('outline script') \r\n console.log('inline script')" 
    },
    "manifest": {
        "name": "String",
        "description": "String"
    }
}
```

## 说明
- 机器人文件目录结构
```
├── main.js 
├── mainIframe
│   ├── xxx.html
│   └──assets
│      ├──xxx.css
│      └──xxx.js
├── popupIframe
│   ├── xxx.html
│   └──assets
│      ├──xxx.css
│      └──xxx.js
├── winIframe
│   ├── xxx.html
│   └──assets
│      ├──xxx.css
│      └──xxx.js
├── manifest.json

    
```


