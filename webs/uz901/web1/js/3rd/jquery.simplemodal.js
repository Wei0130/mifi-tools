(function(a){if(typeof define==="function"&&define.amd){define(["jquery"],a)}else{a(jQuery)}}(function(e){var i=[],f=e(document),c=e.browser.msie&&parseInt(e.browser.version)===6&&typeof window.XMLHttpRequest!=="object",b=e.browser.msie&&parseInt(e.browser.version)===7,h=null,g=e(window),a=[];e.modal=function(j,d){return e.modal.impl.init(j,d)};e.modal.close=function(){e.modal.impl.close()};e.modal.focus=function(d){e.modal.impl.focus(d)};e.modal.setContainerDimensions=function(){e.modal.impl.setContainerDimensions()};e.modal.setPosition=function(){e.modal.impl.setPosition()};e.modal.update=function(d,j){e.modal.impl.update(d,j)};e.fn.modal=function(d){return e.modal.impl.init(this,d)};e.modal.defaults={appendTo:"body",focus:true,opacity:50,overlayId:"simplemodal-overlay",overlayCss:{},containerId:"simplemodal-container",containerCss:{},dataId:"simplemodal-data",dataCss:{},minHeight:null,minWidth:null,maxHeight:null,maxWidth:null,autoResize:false,autoPosition:true,zIndex:1000,close:true,closeHTML:'<a class="modalCloseImg" title="Close"></a>',closeClass:"simplemodal-close",escClose:true,overlayClose:false,fixed:true,position:null,persist:false,modal:true,onOpen:null,onShow:null,onClose:null};e.modal.impl={d:{},init:function(k,d){var j=this;if(j.d.data){return false}h=e.browser.msie&&!e.boxModel;j.o=e.extend({},e.modal.defaults,d);j.zIndex=j.o.zIndex;j.occb=false;if(typeof k==="object"){k=k instanceof jQuery?k:e(k);j.d.placeholder=false;if(k.parent().parent().size()>0){k.before(e("<span></span>").attr("id","simplemodal-placeholder").css({display:"none"}));j.d.placeholder=true;j.display=k.css("display");if(!j.o.persist){j.d.orig=k.clone(true)}}}else{if(typeof k==="string"||typeof k==="number"){k=e("<div></div>").html(k)}else{alert("SimpleModal Error: Unsupported data type: "+typeof k);return j}}j.create(k);k=null;j.open();if(e.isFunction(j.o.onShow)){j.o.onShow.apply(j,[j.d])}return j},create:function(j){var d=this;d.getDimensions();if(d.o.modal&&c){d.d.iframe=e('<iframe src="javascript:false;"></iframe>').css(e.extend(d.o.iframeCss,{display:"none",opacity:0,position:"fixed",height:a[0],width:a[1],zIndex:d.o.zIndex,top:0,left:0})).appendTo(d.o.appendTo)}d.d.overlay=e("<div></div>").attr("id",d.o.overlayId).addClass("simplemodal-overlay").css(e.extend(d.o.overlayCss,{display:"none",opacity:d.o.opacity/100,height:d.o.modal?i[0]:0,width:d.o.modal?i[1]:0,position:"fixed",left:0,top:0,zIndex:d.o.zIndex+1})).appendTo(d.o.appendTo);d.d.container=e("<div></div>").attr("id",d.o.containerId).addClass("simplemodal-container").css(e.extend({position:d.o.fixed?"fixed":"absolute"},d.o.containerCss,{display:"none",zIndex:d.o.zIndex+2})).append(d.o.close&&d.o.closeHTML?e(d.o.closeHTML).addClass(d.o.closeClass):"").appendTo(d.o.appendTo);d.d.wrap=e("<div></div>").attr("tabIndex",-1).addClass("simplemodal-wrap").css({height:"100%",outline:0,width:"100%"}).appendTo(d.d.container);d.d.data=j.attr("id",j.attr("id")||d.o.dataId).addClass("simplemodal-data").css(e.extend(d.o.dataCss,{display:"none"})).appendTo("body");j=null;d.setContainerDimensions();d.d.data.appendTo(d.d.wrap);if(c||h){d.fixIE()}},bindEvents:function(){var d=this;e("."+d.o.closeClass).bind("click.simplemodal",function(j){j.preventDefault();d.close()});if(d.o.modal&&d.o.close&&d.o.overlayClose){d.d.overlay.bind("click.simplemodal",function(j){j.preventDefault();d.close()})}f.bind("keydown.simplemodal",function(j){if(d.o.modal&&j.keyCode===9){d.watchTab(j)}else{if((d.o.close&&d.o.escClose)&&j.keyCode===27){j.preventDefault();d.close()}}});g.bind("resize.simplemodal orientationchange.simplemodal",function(){d.getDimensions();d.o.autoResize?d.setContainerDimensions():d.o.autoPosition&&d.setPosition();if(c||h){d.fixIE()}else{if(d.o.modal){d.d.iframe&&d.d.iframe.css({height:a[0],width:a[1]});d.d.overlay.css({height:i[0],width:i[1]})}}})},unbindEvents:function(){e("."+this.o.closeClass).unbind("click.simplemodal");f.unbind("keydown.simplemodal");g.unbind(".simplemodal");this.d.overlay.unbind("click.simplemodal")},fixIE:function(){var d=this,j=d.o.position;e.each([d.d.iframe||null,!d.o.modal?null:d.d.overlay,d.d.container.css("position")==="fixed"?d.d.container:null],function(v,n){if(n){var t="document.body.clientHeight",x="document.body.clientWidth",z="document.body.scrollHeight",w="document.body.scrollLeft",q="document.body.scrollTop",m="document.body.scrollWidth",l="document.documentElement.clientHeight",u="document.documentElement.clientWidth",r="document.documentElement.scrollLeft",A="document.documentElement.scrollTop",B=n[0].style;B.position="absolute";if(v<2){B.removeExpression("height");B.removeExpression("width");B.setExpression("height",""+z+" > "+t+" ? "+z+" : "+t+' + "px"');B.setExpression("width",""+m+" > "+x+" ? "+m+" : "+x+' + "px"')}else{var p,k;if(j&&j.constructor===Array){var y=j[0]?typeof j[0]==="number"?j[0].toString():j[0].replace(/px/,""):n.css("top").replace(/px/,"");p=y.indexOf("%")===-1?y+" + (t = "+A+" ? "+A+" : "+q+') + "px"':parseInt(y.replace(/%/,""))+" * (("+l+" || "+t+") / 100) + (t = "+A+" ? "+A+" : "+q+') + "px"';if(j[1]){var o=typeof j[1]==="number"?j[1].toString():j[1].replace(/px/,"");k=o.indexOf("%")===-1?o+" + (t = "+r+" ? "+r+" : "+w+') + "px"':parseInt(o.replace(/%/,""))+" * (("+u+" || "+x+") / 100) + (t = "+r+" ? "+r+" : "+w+') + "px"'}}else{p="("+l+" || "+t+") / 2 - (this.offsetHeight / 2) + (t = "+A+" ? "+A+" : "+q+') + "px"';k="("+u+" || "+x+") / 2 - (this.offsetWidth / 2) + (t = "+r+" ? "+r+" : "+w+') + "px"'}B.removeExpression("top");B.removeExpression("left");B.setExpression("top",p);B.setExpression("left",k)}}})},focus:function(l){var j=this,k=l&&e.inArray(l,["first","last"])!==-1?l:"first";var d=e(":input:enabled:visible:"+k,j.d.wrap);setTimeout(function(){d.length>0?d.focus():j.d.wrap.focus()},10)},getDimensions:function(){var j=this,d=e.browser.opera&&e.browser.version>"9.5"&&e.fn.jquery<"1.3"||e.browser.opera&&e.browser.version<"9.5"&&e.fn.jquery>"1.2.6"?g[0].innerHeight:g.height();i=[f.height(),f.width()];a=[d,g.width()]},getVal:function(j,k){return j?(typeof j==="number"?j:j==="auto"?0:j.indexOf("%")>0?((parseInt(j.replace(/%/,""))/100)*(k==="h"?a[0]:a[1])):parseInt(j.replace(/px/,""))):null},update:function(d,k){var j=this;if(!j.d.data){return false}j.d.origHeight=j.getVal(d,"h");j.d.origWidth=j.getVal(k,"w");j.d.data.hide();d&&j.d.container.css("height",d);k&&j.d.container.css("width",k);j.setContainerDimensions();j.d.data.show();j.o.focus&&j.focus();j.unbindEvents();j.bindEvents()},setContainerDimensions:function(){var u=this,l=c||b;var d=u.d.origHeight?u.d.origHeight:e.browser.opera?u.d.container.height():u.getVal(l?u.d.container[0].currentStyle.height:u.d.container.css("height"),"h"),k=u.d.origWidth?u.d.origWidth:e.browser.opera?u.d.container.width():u.getVal(l?u.d.container[0].currentStyle.width:u.d.container.css("width"),"w"),p=u.d.data.outerHeight(true),j=u.d.data.outerWidth(true);u.d.origHeight=u.d.origHeight||d;u.d.origWidth=u.d.origWidth||k;var m=u.o.maxHeight?u.getVal(u.o.maxHeight,"h"):null,q=u.o.maxWidth?u.getVal(u.o.maxWidth,"w"):null,o=m&&m<a[0]?m:a[0],t=q&&q<a[1]?q:a[1];var n=u.o.minHeight?u.getVal(u.o.minHeight,"h"):"auto";if(!d){if(!p){d=n}else{if(p>o){d=o}else{if(u.o.minHeight&&n!=="auto"&&p<n){d=n}else{d=p}}}}else{d=u.o.autoResize&&d>o?o:d<n?n:d}var r=u.o.minWidth?u.getVal(u.o.minWidth,"w"):"auto";if(!k){if(!j){k=r}else{if(j>t){k=t}else{if(u.o.minWidth&&r!=="auto"&&j<r){k=r}else{k=j}}}}else{k=u.o.autoResize&&k>t?t:k<r?r:k}u.d.container.css({"min-height":d,width:k});u.o.autoPosition&&u.setPosition()},setPosition:function(){var k=this,m,l,n=(a[0]/2)-(k.d.container.outerHeight(true)/2),j=(a[1]/2)-(k.d.container.outerWidth(true)/2),d=k.d.container.css("position")!=="fixed"?g.scrollTop():0;if(k.o.position&&Object.prototype.toString.call(k.o.position)==="[object Array]"){m=d+(k.o.position[0]||n);l=k.o.position[1]||j}else{m=d+n;l=j}k.d.container.css({left:l,top:m})},watchTab:function(j){var d=this;if(e(j.target).parents(".simplemodal-container").length>0){d.inputs=e(":input:enabled:visible:first, :input:enabled:visible:last",d.d.data[0]);if((!j.shiftKey&&j.target===d.inputs[d.inputs.length-1])||(j.shiftKey&&j.target===d.inputs[0])||d.inputs.length===0){j.preventDefault();var k=j.shiftKey?"last":"first";d.focus(k)}}else{j.preventDefault();d.focus()}},open:function(){var d=this;d.d.iframe&&d.d.iframe.show();if(e.isFunction(d.o.onOpen)){d.o.onOpen.apply(d,[d.d])}else{d.d.overlay.show();d.d.container.show();d.d.data.show()}d.o.focus&&d.focus();d.bindEvents()},close:function(){var d=this;if(!d.d.data){return false}d.unbindEvents();if(e.isFunction(d.o.onClose)&&!d.occb){d.occb=true;d.o.onClose.apply(d,[d.d])}else{if(d.d.placeholder){var j=e("#simplemodal-placeholder");if(d.o.persist){j.replaceWith(d.d.data.removeClass("simplemodal-data").css("display",d.display))}else{d.d.data.hide().remove();j.replaceWith(d.d.orig)}}else{d.d.data.hide().remove()}d.d.container.hide().remove();d.d.overlay.hide();d.d.iframe&&d.d.iframe.hide().remove();d.d.overlay.remove();d.d={}}}}}));