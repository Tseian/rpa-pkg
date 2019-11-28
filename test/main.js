/*
图像自动去除背景服务
*/

function SVC_REMOVE_BG()
{
	const svcId='SERVICE.REMOVEBG';
	var status=0,frameId,run_result={};;//0:停止 10:等待返回 20:等待图像处理
	var _logicInService=new logicInService();//,_logicInPopupIFrame=new logicInPopupIFrame();
	var buffer_logicInMainIFrame=_RPA_SYS_GetFunction(logicInMainIFrame);
	var serviceData;
	
	this.initial=function($$)
	{
		initialServiceData({
			callback:
			()=>
			{
				_logicInService.initial({logicInPopupIFrame:new logicInPopupIFrame(serviceData)});
			}
		});
	}
	
	this.getSvcId=function()
	{
		return svcId;
	}
	
	this._RPA_RELAY_EVENT=function($$)
	{
		setTimeout(
			()=>
			{
				_logicInService.RPA_EventsLoop($$);
			},100
		)
	}
	
	this._RPA_SYS_GETFUNCTION=function($$)
	{/*系统接口，用于获取要执行的代码*/
		var url=$$.url,result;
		
		if(url.indexOf('https://www.remove.bg')!=-1)
		{
			result={code:buffer_logicInMainIFrame};
		}
		
		return result;
	}

	function initialServiceData($$)
	{/*
		应该从服务器返回，测试阶段放在本地目录下
	*/
		var path=chrome.extension.getURL('/services/service_removebg.txt');
		
		_RPA_SYS_DownloadResource({src:path,
			callback:
				(result)=>
				{
					serviceData=JSON.parse(result);
					
					if(!!$$&&!!$$.callback)
						$$.callback();
				}
			}
		)
	}

	//服务端逻辑
	function logicInService()
	{
		var _lPF;
		
		this.initial=function($$)
		{//初始化
			initial($$);
			_lPF=$$.logicInPopupIFrame;
		}
		
		this.RPA_EventsLoop=function($$)
		{//对外的事件直接调用接口
			RPA_EventsLoop($$);
		}
		
		function removeByUrl($$)
		{/*
			根据url去除背景，向系统发送APP_RB_SEND_URL消息
			$$ {url:url}
		*/
			if(!!$$.data&&!!$$.data.url)
			{
				_RPA_CORE_SWITCH.raiseEvent({key:'APP_RB_SEND_URL',data:{url:$$.data.url}});	
			}
		}
		
		function removeByBase64($$)
		{/*
			根据url或者图像去除背景，向系统发送APP_RB_SEND_BASE64消息
			如果指定了url,则先下载后取base64；或者直接取base64
			$$ {url:url}或{base64:base64}
		*/
			run_result={};
			
			if(!!$$.data)
			{
				if(!!$$.data.url)
				{
					_RPA_SYS_DOWNLOAD_IMAGE({url:$$.data.url,resize:{process:getResize},callback:
						(result)=>
						{
							run_result=result;
							_RPA_CORE_SWITCH.raiseEvent({key:'APP_RB_INNER_SEND_BASE64',data:{base64:!!result.resize?result.resize.base64:result.base64},svcId:svcId});	
						}
					})
				}
			}
		}
		
		function getResize($$)
		{/*
			resize算法 $${width:width,height:height}
			1) 长，宽最大不超过500
			2) 如有超出，取大者，然后缩放
		*/
			let width=$$.width,height=$$.height,value,bwidth,result,MAX=500;
			
			if(width>=height&&width>=MAX)
			{
				value=width;
				bwidth=true;
			}
			else if(height>=width&&height>=MAX)
			{
				value=height;
				bwidth=false;	
			}
			
			if(!!value)
			{
				let ratio=parseInt(value/MAX),mod=value%MAX;
				if(!!mod)
					ratio++;
				
				result=bwidth?{width:width/ratio}:{height:height/ratio};
			}
			
			return result;
		}
		
		function initial()
		{/*
			初始化，包括登记response header拦截和request header请求
		*/
			_RPA_CORE_SWITCH.raiseEvent({key:'RPA_BR_FRAME_FUN_HOOKHEADER',data:{url:'https://www.remove.bg/*',data:[{name:'x-frame-options',value:'',comment:'删除禁止frame使用标志'}]},svcId:svcId});
			
			_RPA_CORE_SWITCH.registerEvents({callback:RPA_EventsLoop,keys:['APP_RB_SEND_URL','APP_RB_GOT_URL'],scope:'LOCALHOST'});
			_RPA_CORE_SWITCH.registerEvents({callback:RPA_EventsLoop,keys:['RPA_BR_POPUP_OPENTAB'],scope:svcId});
			
			frameId=_RPA_CORE_SWITCH.raiseEvent({key:'RPA_BR_FRAME_MAIN_CREATE_IFRAME',data:{url:_RPA_SYS_FORMAT_URL({svcId:svcId,url:'https://www.remove.bg'})}});
		}
		
		function RPA_EventsLoop($$)
		{/*
			服务端消息逻辑处理，主要是接收外部输入，包括请求和中间结果
		*/
			var data,result,sender=$$.sender,svc;
			
			if(!!$$)
			{
				data=$$.data;
				
				switch($$.key)
				{
					case 'APP_RB_SEND_URL'://根据url来去除背景，先由服务判断后，再用APP_RB_INNER_SEND_URL消息发送给实际的处理程序
						removeByBase64($$);
						break;
					case 'APP_RB_GOT_URL'://remove.bg的script发来的消息，包含remove去除背景后的链接,需要下载该图片，并进行合并逻辑处理
						let url=(!!$$.data&&!!$$.data.url)?$$.data.url:null;
						
						if(!!url)
						{
							_RPA_SYS_DOWNLOAD_IMAGE({url:url,resize:{width:run_result.width},callback:
								(result)=>
								{
									run_result.result=result;
									processImage(run_result);
									//向系统推送结果
									_RPA_CORE_SWITCH.raiseEvent({key:'APP_RB_GOT_RESULT',data:{base64:run_result.process.base64}});
								}
							})
						}
						break;
					case 'RPA_BR_POPUP_OPENTAB':/*指定的tab页面打开了，需要动态返回消息*/
						//_RPA_CORE_SWITCH.raiseEvent({key:'RPA_BR_FRAME_POPUP_CREATE_IFRAME',data:_lPF._RPA_SYS_GETFUNCTION()});
						let cdata=_lPF._RPA_SYS_GETFUNCTION(data);
						_RPA_CORE_SWITCH.raiseEvent({key:'RPA_BR_FRAME_POPUP_UPDATE_IFRAME',data:cdata});
						break;
				}
			}
		}
		
		function processImage(idata)
		{/*
			最终的图像处理，根据remove.bg输出图和原始图缩放后对比，输出扣除后内容
		*/
			
			var canvas,context,width=idata.width,height=idata.height,len,SPAN=3;
			var data_origin,data_mask,data_origin_32,data_mask_32,bin;
			
			data_origin=idata.data.imagedata;
			data_origin_32=idata.data.data32;
			
			data_mask=idata.result.resize.data.imagedata;
			data_mask_32=idata.result.resize.data.data32;
			/*
			然后绘制图形，加上了偏差处理，记录是从进入还是离开，各取两个像素的偏差
			*/
			len=data_mask_32.length;
			bin=true;
			
			for(var ni=0;ni<len;ni+=4)
			{
				if(bin&&!!data_mask_32[ni+3])
				{/*改点以及后续SPAN各点均要设置为透明*/
					bin=false;
					data_origin_32[ni+3]=0;
					
					for(var nj=0;nj<SPAN;nj++)
					{
						ni+=4;
						if(ni+3<len)
						{
							data_origin_32[ni+3]=0;
						}
					}
				}
				else if(!bin&&!data_mask_32[ni+3])/*np==0,透明*/
				{/*
					
				*/
					bin=true;
					data_origin_32[ni+3]=0;
					let bni=ni;
					
					for(var nj=0;nj<SPAN;nj++)
					{
						ni-=4;
						if(ni>=0)
						{
							data_origin_32[ni+3]=0;
						}
					}
				}
				else if(!data_mask_32[ni+3])
				{
					data_origin_32[ni+3]=0;
				}
			}
			
			canvas = document.createElement('canvas');
			context = canvas.getContext('2d');
			context.imageSmoothingQuality = 'high';
			canvas.width = width;
			canvas.height = height;
			
			data_origin.data.set(Uint8ClampedArray.from(data_origin_32));
			
			context.putImageData(data_origin,0, 0);
			
			idata.process={base64:canvas.toDataURL('image/png')};
			
			delete context;
			delete canvas;
		}
		
		//initial();
	}

	//用于popup窗口iframe中嵌入逻辑
	function logicInPopupIFrame(data)
	{
		/*此处为popup iframe中的html代码*/
		//var html=`<!DOCTYPE html><html><head><meta charset=utf-8></head><body><input style='width:200px' id='url' value='https://ae01.alicdn.com/kf/H5ba64a0fa4c741388cfb4b549d89bb6e7/Long-Sleeve-Shirt-Dress-2019-Summer-Boho-Beach-Dresses-Women-Casual-Striped-Print-A-line-Mini.jpg'><br><input type='button' value='抠图' style='margin-left:50px' id='btn'><br><img id='result' style='width:300px'></body><script src='/js/sys_core_inject.js'></script></html>`;
		var frameData=data;
		
		this._RPA_SYS_GETFUNCTION=function($$)
		{/*获取popup端 代码*/
			var frmId=$$.frmId,tabId=$$.tabId;
			var result;;
			
			switch(tabId)
			{
				case '1':
					//result={html:frameData.html,code:_RPA_SYS_GetFunction(rbIFrameInject),frmId:frmId};
					result={html:frameData.html,code:frameData.code,frmId:frmId};
				break;
				default:
					result={html:'hehda',frmId:frmId};
				break;
			}
			
			return result;
		}
		
		function rbIFrameInject()
		{/*包含代码将在popup对应的iframe中执行*/
			function RPA_EventsLoop($$)
			{
				var data=!!$$?$$.data:null,result,sender=$$.sender,svc,rt;
				
				if(!!$$)
				{
					switch($$.key)
					{
						case 'APP_RB_GOT_RESULT':/*获取到去除后结果*/
							document.getElementById('result').src=data.base64;
						break;
					}
				}
			}
			
			_RPA_CORE_SWITCH.registerEvents({keys:'APP_RB_GOT_RESULT',scope:'LOCALHOST',callback:RPA_EventsLoop});
			
			document.querySelector('#btn').onclick=
			()=>
			{
				_RPA_CORE_SWITCH.raiseEvent({key:'APP_RB_SEND_URL',data:{url:document.querySelector('#url').value},scope:'LOCALHOST'});
			}
			
			window.RPA_EventsLoop=RPA_EventsLoop;
			
			console.log('popup here');
		}
	}
	
	//用于main窗口iframe中嵌入逻辑，用于调度remove.bg功能
	function logicInMainIFrame()
	{
		function rbIFrameInject()
		{/*包含代码将在remove.bg原生环境下执行*/
			var _RPA_INJECT_HANDLER,_RPA_requestData={},_RPA_TIMER;
		
			function _RPA_INJECT_getHandler()
			{/*获取控制句柄*/
				let keys = Object.keys(document.body);
				let find = keys.find(k => k.includes('jQuery'));
				
				if (find) 
				{
					let bindEvents = document.body[find];
					let handlers = bindEvents.events.paste;
					
					if(!!handlers[0])
					{
						_RPA_INJECT_HANDLER=handlers[0].handler;
					}
				}
			}
			
			function base64ToFile(imgBase64) {
			/*base64转文件*/
				let bsArr = imgBase64.split(',');
				const bs = bsArr[1];
				const type = bsArr[0].replace('data:', '').replace(';base64', '');
				const byteCharacters = window.atob(bs);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const file = new File([byteArray], 'test.png', {type: type.trim()});
				return file;
			}
		
			function _RPA_INJECT_sendUrl(url)
			{/*发送图像url*/
				if(!_RPA_INJECT_HANDLER)
				{
					_RPA_INJECT_getHandler();
				}
					
				if(!!_RPA_INJECT_HANDLER)
				{
					_RPA_INJECT_HANDLER(
						{
							originalEvent: {
								target: {
									is: ()=>{ return false }
								},
								clipboardData: {
									items: [{
										type: "text/plain",
										getAsString: (cb)=> {
											cb(url)
										}
									}]
								}
							}
						}
					)
				}
			}
			
			function _RPA_INJECT_sendBase64(base64)
			{/*发送base64图像*/
				if(!_RPA_INJECT_HANDLER)
				{
					_RPA_INJECT_getHandler();
				}
					
				if(!!_RPA_INJECT_HANDLER)
				{
					_RPA_INJECT_HANDLER(
						{
							originalEvent: {
								target: {
									is: ()=>{ return false }
								},
								clipboardData: {
									items: [{
										type: "image/*",
										getAsFile: function() {
											return base64ToFile(base64);
										}
									}]
								}
							}
						}
					)
				}
			}
			
			function _RPA_checkImage()
			{/*
				检测是否有图像生成
			*/
				var img=document.querySelector('img[data-hj-suppress][src*="/downloads/"]'),clear=document.querySelector('a.image-result--delete-btn');
				
				if(!!img)//&&!!img.width)
				{
					_RPA_CORE_SWITCH.raiseEvent({key:'APP_RB_GOT_URL',data:{url:img.src}});
					
					clearInterval(_RPA_TIMER);

					if(!!clear)
					{
						clear.click();
					}
					
					img.parentNode.removeChild(img);
				}
			}
			
			function RPA_EventsLoop($$)
			{/*
			处理消息队列，由switch调用
			*/
				var data,result,sender=$$.sender,svc;
				
				if(!!$$)
				{
					data=$$.data;
					
					switch($$.key)
					{
						case 'APP_RB_INNER_SEND_URL':/*通过url来去除背景*/
						case 'APP_RB_INNER_SEND_BASE64':/*通过base64来去除背景*/
							if(!!data&&(!!data.url||!!data.base64))
							{							
								if($$.key=='APP_RB_SEND_URL')
								{
									_RPA_INJECT_sendUrl(data.url);
								}
								else
								{
									_RPA_INJECT_sendBase64(data.base64);	
								}
								
								/*启动检测*/
								_RPA_TIMER=setInterval(_RPA_checkImage,100);
							}
						break;
					}
				}
			}
			
			//设置全局变量
			window.RPA_EventsLoop=RPA_EventsLoop;
			//注册本地全局事件，捕获
			_RPA_CORE_SWITCH.registerEvents({keys:['APP_RB_INNER_SEND_URL','APP_RB_INNER_SEND_BASE64'],callback:RPA_EventsLoop});
			console.log('heheda');
		}

		_RPA_SYS_GET_SCRIPT({type:20,src:chrome.extension.getURL('/js/sys_core_inject.js'),callback:
			()=>
			{
				_RPA_SYS_GET_SCRIPT({type:0,src:rbIFrameInject});
			}
		});
	}

	
	return this;
}