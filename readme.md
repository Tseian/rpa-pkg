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
会在当前目录下生成一个robot.rpk文件
## 说明
- 机器人文件目录结构
```
├── main.js 
├── mainIframe
    ├── xxx.html
    └──assets
       ├──xxx.css
       └──xxx.js
├── popupIframe
    ├── xxx.html
    └──assets
       ├──xxx.css
       └──xxx.js
├── winIframe
    ├── xxx.html
    └──assets
       ├──xxx.css
       └──xxx.js

    
```
## 打包后的json文件
```json
{
    "mainIframe": [
        {
            "name": "filename.html", //文件名
            "html": "",   // html内容
            "codes": [    // html文件中内容
                "console.log('outline script')",
                "console.log('inline script')"
            ]
        } 
    ],
    "popupIframe": [
        {
            "name": "filename.html", //文件名
            "html": "",   // html内容
            "codes": [    // html文件中内容
                "console.log('outline script')",
                "console.log('inline script')"
            ]
        } 
    ],
    "winIframe": [
        {
            "name": "filename.html", //文件名
            "html": "",   // html内容
            "codes": [    // html文件中内容
                "console.log('outline script')",
                "console.log('inline script')"
            ]
        } 
    ],
    "main": {
        "name": "filename.js", // js文件名
        "codes": [   //js内容
            "console.log('main.js')"
        ]
    }
}
```