// دریافت تمام تگ های ویجت ها
var widgets = document.querySelectorAll('tgju');

// حلقه تکرار جهت انجام عملیات پیاده سازی ویجت ها
widgets.forEach(function (item) {
    item.innerHTML = '<div style="max-width: 25px;margin: auto; padding: 15px 0;"><div style="height: 26px; width: 26px;position: relative;animation-timing-function: linear;animation-name: mymove;animation-iteration-count: infinite;animation-duration: .75s;"><svg height="100%" viewBox="0 0 32 32" width="100%"><circle cx="16" cy="16" fill="none" r="14" stroke-width="4" style="stroke: rgb(248, 148, 26); opacity: 0.2;"></circle><circle cx="16" cy="16" fill="none" r="14" stroke-width="4" style="stroke: rgb(248, 148, 26); stroke-dasharray: 80; stroke-dashoffset: 60;"></circle></svg></div><style>@keyframes mymove {0% {transform:rotate(0)} 100% {transform:rotate(360deg)}} .highcharts-credits {font-size: 0 !important;}</style></div>';
    // ارسال درخواست به وب سرویس جهت دریافت اطلاعات داده های ویجت
    var http = new XMLHttpRequest();
    http.open("GET", "https://api.tgju.org/v1/widget/tmp?keys=" + item.getAttribute('items'));
    http.send();

    //عملیات پس از دریافت اطلاعات از وب سرویس
    http.onload = () => {
        var apiData = JSON.parse(http.responseText).response.indicators;
        var widgetID = Math.floor(Math.random() * 9999);
        var styles = JSON.parse(item.getAttribute('styles'));
        var widgetData = [];
        var rows = '';
        var embed_style = '';
        var embed_js = '';
        var _HTML = '';
        var copyright = '';
        var copyright_fix = '';
        var dot = '';
        if (item.getAttribute('columns').split(',').includes("dot")) { dot = "dot"; }

        var tokens = [
            "104hjk",
            "2jh4kjh",
            "254h545j4jh"
        ];

        // //پیاده سازی div کپی رایت
        // if (item.getAttribute('token') === 'webservice' || !tokens.includes(item.getAttribute('token'))) {
        //     copyright = '<div class="tgju-copyright" style="display: block !important;">By <a href="https://www.tgju.org" target="_blank">TGJU</a></div>';
        //     copyright_fix = '<div class="tgju-copyright-fix" style="display: block !important;"><a href="https://www.tgju.org" target="_blank"><img src="https://static.tgju.org/views/default/images/widgets/TGJU-LOGO.png" alt="TGJU"> <span>TGJU.ORG</span></a></div>';
        // }

        // آماده سازی دیتا های دریافتی از وب سرویس جهت تبدیل به خروجی ویجت
        apiData.forEach(function (item) {
            widgetData[item.item_id] = {
                symbol: item.name ? item.name : item.slug,
                item_id: item.item_id,
                title: item.title,
                p: item.p,
                h: item.h,
                l: item.l,
                d: item.d,
                dp: item.dp,
                dt: item.dt,
                t: item.t
            };
        });

        var count = 0;
        // تولید تگ های html ظاهر ویجت
        item.getAttribute('items').split(',').forEach(function (key) {
            switch (item.getAttribute('type')) {
                case "ticker":
                    // پیاده سازی یجهت  ticker-widget
                    rows += '<div class="tgju-widget-item widget-' + widgetData[key].dt + '">';
                    rows += '<div class="tgju-widget-title-row">'
                    rows += '<div class="tgju-widget-title">';
                    if (item.getAttribute('columns').split(',').includes("logo")) {
                        rows += '<div class="tgju-widget-title-icon">';
                        rows += '<div class="tgju-widget-flag">';
                        rows += '<img class="tgju-widget-flag-img" src="https://static.tgju.org/images/crypto/icons/bitcoin_btc.png" alt="usd">';
                        rows += '</div>';
                        rows += '</div>';
                    }
                    rows += '<div class="tgju-widget-title-text ' + dot + '">' + widgetData[key].title + '</div>';
                    rows += '</div>';
                    rows += '<div class="tgju-widget-current-price">';
                    rows += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].p);
                    rows += '</div>';
                    rows += ' </div>';
                    rows += '<div class="tgju-widget-content-row">';
                    rows += '<div class="tgju-widget-change">';
                    rows += '<span class="tgju-widget-change-arrow">';
                    rows += ' <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8"><path fill="none" stroke="currentcolor" stroke-linecap="round" stroke-width="2" d="m1 6 5-4 5 4"></path></svg>';
                    rows += '</span>';
                    rows += '<div class="widget-change">' + widgetData[key].dp + '%</div>';
                    rows += '<div class="widget-change-price">' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</div>';
                    rows += '</div>';
                    rows += '</div>';
                    rows += '</div>';
                    break;
                case "ticker-single":
                    if (count < 1) {
                        // پیاده سازی یجهت  single-ticker-widget
                        rows += '<div class="tgju-widget-item widget-' + widgetData[key].dt + '">';
                        rows += '<div class="tgju-widget-title-row">'
                        rows += '<div class="tgju-widget-title">';
                        if (item.getAttribute('columns').split(',').includes("logo")) {
                            rows += '<div class="tgju-widget-title-icon">';
                            rows += '<div class="tgju-widget-flag">';
                            rows += '<img class="tgju-widget-flag-img" src="https://static.tgju.org/images/crypto/icons/bitcoin_btc.png" alt="usd">';
                            rows += '</div>';
                            rows += '</div>';
                        }
                        rows += '<div class="tgju-widget-title-text ' + dot + '">' + widgetData[key].title + '</div>';
                        rows += '</div>';
                        rows += '<div class="tgju-widget-current-price">';
                        rows += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].p);
                        rows += '</div>';
                        rows += ' </div>';
                        rows += '<div class="tgju-widget-content-row">';
                        rows += '<div class="tgju-widget-change">';
                        rows += '<span class="tgju-widget-change-arrow">';
                        rows += ' <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8"><path fill="none" stroke="currentcolor" stroke-linecap="round" stroke-width="2" d="m1 6 5-4 5 4"></path></svg>';
                        rows += '</span>';
                        rows += '<div class="widget-change">' + widgetData[key].dp + '%</div>';
                        rows += '<div class="widget-change-price">' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</div>';
                        rows += '</div>';
                        rows += '</div>';
                        rows += '</div>';

                    }
                    count++;
                    break;
                case "ticker-tap":
                    var dt_p = '';
                    if (widgetData[key].dt == "high") {
                        dt_p = '+';
                    } else if (widgetData[key].dt == "low") {
                        dt_p = '-';
                    }
                    // پیاده سازی یجهت  ticker-tap-widget
                    rows += '<div class="tgju-widget-item widget-' + widgetData[key].dt + '">';
                    rows += '<div class="tgju-widget-title-row">'
                    rows += '<div class="tgju-widget-title">';
                    if (item.getAttribute('columns').split(',').includes("logo")) {
                        rows += '<div class="tgju-widget-title-icon">';
                        rows += '<div class="tgju-widget-flag">';
                        rows += '<img class="tgju-widget-flag-img" src="https://static.tgju.org/images/crypto/icons/bitcoin_btc.png" alt="usd">';
                        rows += '</div>';
                        rows += '</div>';
                    }
                    rows += '<div class="tgju-widget-title-text ' + dot + '">' + widgetData[key].title + '</div>';
                    rows += '</div>';
                    rows += '<div class="tgju-widget-current-price">';
                    rows += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].p);
                    rows += '</div>';
                    rows += ' </div>';
                    rows += '<div class="tgju-widget-content-row">';
                    rows += '<div class="tgju-widget-change">';
                    rows += '<div class="tgju-widget-change-arrow">';
                    rows += ' <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8"><path fill="none" stroke="currentcolor" stroke-linecap="round" stroke-width="2" d="m1 6 5-4 5 4"></path></svg>';
                    rows += '</div>';
                    rows += '<div class="widget-change">(' + widgetData[key].dp + '%<div class="dt-p">' + dt_p + '</div>)</div>';
                    rows += '<div class="widget-change-price"><div class="dt-p">' + dt_p + '</div>' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</div>';
                    rows += '</div>';
                    rows += '</div>';
                    rows += '</div>';
                    break;
                case "market-data":
                    //پیاده سازی ظاهر ویجت market-data-widget
                    var dt_p = dt_p = '<td>(' + widgetData[key].dp + '%) ' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</td>';;
                    if (widgetData[key].dt == "high") {
                        dt_p = '<td class="c-high"><span class="tgju-widget-change-arrow"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8"><path fill="none" stroke="currentcolor" stroke-linecap="round" stroke-width="2" d="m1 6 5-4 5 4"></path></svg></span> (' + widgetData[key].dp + '%) ' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</td>';
                    } else if (widgetData[key].dt == "low") {
                        dt_p = '<td class="c-low"><span class="tgju-widget-change-arrow"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8"><path fill="none" stroke="currentcolor" stroke-linecap="round" stroke-width="2" d="m1 6 5-4 5 4"></path></svg></span> (' + widgetData[key].dp + '%) ' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</td>';
                    }
                    rows += '<tr data-title="" class="tr-high">';
                    rows += '<td><div class="tgju-widget-table-title">';
                    if (item.getAttribute('columns').split(',').includes("logo")) {
                        rows += '<div class="tgju-widget-title-icon"><div class="tgju-widget-flag">';
                        rows += '<img class="tgju-widget-flag-img" src="https://static.tgju.org/images/crypto/icons/bitcoin_btc.png" alt="usd">';
                        rows += '</div></div>';
                    }
                    rows += '<div class="tgju-widget-title-text ' + dot + '">' + widgetData[key].title + '</div>';
                    rows += '</div></td>';
                    rows += '<td class="nf">' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].p); +'</td>';
                    if (item.getAttribute('columns').split(',').includes("diff")) { rows += dt_p; }
                    if (item.getAttribute('columns').split(',').includes("low")) { rows += '<td class="nf">' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].l); +'</td>'; }
                    if (item.getAttribute('columns').split(',').includes("high")) { rows += '<td class="nf">' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].h); +'</td>'; }
                    if (item.getAttribute('columns').split(',').includes("time")) { rows += '<td class="nf">' + widgetData[key].t + '</td>'; }
                    break;
                case "market-overview":
                    // پیاده سازی یجهت  market-overview-widget

                    rows += '<li onclick="updateChart(' + "'tgju-chart-" + widgetID + "'" + ' ,' + "'" + widgetData[key].item_id + "'" + ' , ' + "'" + widgetData[key].title + "'" + ')">';
                    rows += '<div class="tgju-widget-item widget-' + widgetData[key].dt + '">';
                    rows += '<div class="tgju-widget-title-row">'
                    rows += '<div class="tgju-widget-title">';
                    if (item.getAttribute('columns').split(',').includes("logo")) {
                        rows += '<div class="tgju-widget-title-icon">';
                        rows += '<div class="tgju-widget-flag">';
                        rows += '<img class="tgju-widget-flag-img" src="https://static.tgju.org/images/crypto/icons/bitcoin_btc.png" alt="usd">';
                        rows += '</div>';
                        rows += '</div>';
                    }
                    rows += '<div class="tgju-widget-title-text ' + dot + '">' + widgetData[key].title + '</div>';
                    rows += '</div>';
                    rows += '<div class="tgju-widget-current-price">';
                    rows += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].p);
                    rows += '</div>';
                    rows += ' </div>';
                    rows += '<div class="tgju-widget-content-row">';
                    rows += '<div class="tgju-widget-change">';
                    rows += '<span class="tgju-widget-change-arrow">';
                    rows += ' <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 8"><path fill="none" stroke="currentcolor" stroke-linecap="round" stroke-width="2" d="m1 6 5-4 5 4"></path></svg>';
                    rows += '</span>';
                    rows += '<div class="widget-change">(' + widgetData[key].dp + '%)</div>';
                    rows += '<div class="widget-change-price">' + new Intl.NumberFormat('en-US', { style: 'decimal' }).format(widgetData[key].d) + '</div>';
                    rows += '</div>';
                    rows += '</div>';
                    rows += '</div>';
                    rows += '</li>';
                    break;
                default:
                // حالت پیشفرض;
            }
        })

        embed_style += '.tgju-copyright-fix svg,.tgju-copyright-fix img{max-width:12px;margin-left:8px;position:relative;top:0;display:inline-block;width:12px}.tgju-copyright-fix a{font-size:12px;direction:rtl;display:flex;align-items:center;text-decoration:none!important;color:#222!important;font-weight:600}.tgju-copyright-fix a span{padding-top:2px}.tgju-copyright-fix{z-index: 5;transition:margin-left .6s cubic-bezier(.4,.01,.22,1) 0s,background .3s cubic-bezier(.4,.01,.22,1) 0s;box-shadow:2px 0 3px 0 #e0e3eb;position:absolute;bottom:10px;padding:5px;background:#fff;-webkit-border-top-right-radius:20px;-webkit-border-bottom-right-radius:20px;-moz-border-radius-topright:20px;-moz-border-radius-bottomright:20px;border-top-right-radius:20px;border-bottom-right-radius:20px;padding:6px 7px;margin-left:-66px;left:0}.tgju-copyright-fix:hover{margin-left:0}@font-face{font-family:iranyekan;font-style:normal;font-weight:700;src:url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/eot/iranyekanwebbold(fanum).eot");src:url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/eot/iranyekanwebbold(fanum).eot?#iefix") format("embedded-opentype"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/woff2/iranyekanwebbold(fanum).woff2") format("woff2"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/woff/iranyekanwebbold(fanum).woff") format("woff"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/ttf/iranyekanwebbold(fanum).ttf") format("truetype")}@font-face{font-family:iranyekan;font-style:normal;font-weight:300;src:url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/eot/iranyekanweblight(fanum).eot");src:url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/eot/iranyekanweblight(fanum).eot?#iefix") format("embedded-opentype"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/woff2/iranyekanweblight(fanum).woff2") format("woff2"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/woff/iranyekanweblight(fanum).woff") format("woff"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/ttf/iranyekanweblight(fanum).ttf") format("truetype")}@font-face{font-family:iranyekan;font-style:normal;font-weight:400;src:url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/eot/iranyekanwebregular(fanum).eot");src:url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/eot/iranyekanwebregular(fanum).eot?#iefix") format("embedded-opentype"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/woff2/iranyekanwebregular(fanum).woff2") format("woff2"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/woff/iranyekanwebregular(fanum).woff") format("woff"),url("https://static.tgju.org/views/default/fonts/iranyekan/Farsi_numerals_(Non_Standard)/WebFonts/fonts/ttf/iranyekanwebregular(fanum).ttf") format("truetype")}@font-face{font-family:roboto;font-weight:400;font-style:normal;src:url(https://static.tgju.org/views/default/fonts/roboto-v18-latin/roboto-v18-latin-regular.eot);src:url(https://static.tgju.org/views/default/fonts/roboto-v18-latin/roboto-v18-latin-regular.eot?#iefix) format("embedded-opentype"),url(https://static.tgju.org/views/default/fonts/roboto-v18-latin/roboto-v18-latin-regular.woff) format("woff"),url(https://static.tgju.org/views/default/fonts/roboto-v18-latin/roboto-v18-latin-regular.ttf) format("truetype")}.tgju-copyright{width: 100%; float: right;text-align:center;font-size:12px;font-family:tahoma;color:#9db2bd;padding-top:5px;padding-bottom:5px;display:block}.tgju-copyright a{text-decoration:unset!important;color:#9db2bd;font-weight:600}';
        // افزودنی های نهایی برای هر ویجت مانند css , js
        switch (item.getAttribute('type')) {
            case "ticker":
            case "ticker-single":
                //ticker-widget
                //single-ticker-widget
                embed_style += '.tgju-widget-title-text.dot:before{content:"";width:6px;height:6px;display:inline-block;background:#fa941a;border-radius:50%;margin-left:6px}.tgju-widget{position:relative;overflow:hidden;background:#fff;margin:auto;direction:rtl;font-weight:500;font-size:13px;line-height:1;font-family:iranyekan;display:flex;border:1px solid #e0e3eb;border-radius:3px}.tgju-widget-item{flex-grow:1;padding:12px 23px;position:relative}.tgju-widget-item:last-child:after{display:none}.tgju-widget-item:hover{background:#f0f3fa}.tgju-widget-item:hover:after{display:none}.tgju-widget-item:after{background:#f0f3fa;bottom:10px;content:"";left:-1px;position:absolute;top:10px;width:1px}.tgju-widget-title-row{column-gap: 5px;display:flex;margin-bottom:5px}.tgju-widget-title{padding: 0 !important; border: 0 !important;display:flex;align-items:center}.tgju-widget-title-icon{margin-left:6px}.tgju-widget-flag{width:17px;position:relative;top:1px}.tgju-widget-flag img.tgju-widget-flag-img{width:100%;border-radius:50%}.tgju-widget-sub-flag{position:absolute;top:-3px;right:-6px;border-radius:50%;overflow:hidden;border:1px #fff solid;width:12px;height:12px}.tgju-widget-sub-flag img{width:100%;height:100%}.tgju-widget-title-text{font-size:14px;white-space:nowrap}.tgju-widget-change{display:flex;align-items:center;padding:4px 0 0}.tgju-widget-change .widget-change-price{font-size:12px;margin-right:8px}.tgju-widget-change .widget-change{font-size:18px}.tgju-widget-change .tgju-widget-change-arrow{width:13px;margin-left:8px;height:15px;position:relative;top:-1px}.tgju-widget-change-price{display:flex}.tgju-widget-title-date{display:flex;flex-grow:1;justify-content:left;align-items:center}.tgju-widget-content-row{display:none}.tgju-widget-current-price{flex-grow:1;text-align:left;font-size:14px;font-weight:500;padding-top:3px}.tgju-widget-item.widget-low .tgju-widget-content-row{color:#ef5350}.tgju-widget-item.widget-low .tgju-widget-change .tgju-widget-change-arrow svg{transform:scale(-1)}.tgju-widget-item.widget-high .tgju-widget-content-row{color:#26a69a}@media (max-width:1024px){.tgju-widget-item:nth-child(5){display:none}.tgju-widget-item:nth-child(4):after{display:none}}@media (max-width:860px){.tgju-widget-item:nth-child(4){display:none}.tgju-widget-item:nth-child(3):after{display:none}}@media (max-width:720px){.tgju-widget-item:nth-child(3){display:none}.tgju-widget-item:nth-child(2):after{display:none}}@media (max-width:520px){.tgju-widget-item:nth-child(2){display:none}.tgju-widget-item:nth-child(1):after{display:none}}';
                if (styles && styles.background) { embed_style += '[tgju-widget-id="' + widgetID + '"] {background: ' + styles.background + ' !important;}'; }
                if (styles && styles.border) { embed_style += '[tgju-widget-id="' + widgetID + '"] {border: 1px solid ' + styles.border + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {box-shadow:-1px 0 3px 0 ' + styles.border + ' !important;}'; }
                if (styles && styles.hover) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item:hover {background: ' + styles.hover + ' !important;}'; }
                if (styles && styles.seprator) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item::after {background: ' + styles.seprator + ' !important;}'; }
                if (styles && styles.separator) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item::after {background: ' + styles.separator + ' !important;}'; }
                if (styles && styles.title) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-title-text {color: ' + styles.title + ' !important;}'; }
                if (styles && styles.dot) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-title-text.dot:before {background: ' + styles.dot + ' !important;}'; }
                if (styles && styles.price) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-current-price {color: ' + styles.price + ' !important;}'; }
                if (styles && styles.low) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item.widget-low .tgju-widget-content-row {color: ' + styles.low + ' !important;}'; }
                if (styles && styles.high) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item.widget-high .tgju-widget-content-row {color: ' + styles.high + ' !important;}'; }
                if (styles && styles.copyright) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright {color:' + styles.copyright + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright a{color: ' + styles.copyright + ' !important;}'; }
                if (styles && styles.copyright_fix) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {color:' + styles.copyright_fix + ' !important;}'; }
                if (styles && styles.copyright_fix_text) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a svg g {fill:' + styles.copyright_fix_text + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a{color: ' + styles.copyright_fix_text + ' !important;}'; }
                _HTML = '<style>' + embed_style + '</style><div class="tgju-widget" tgju-widget-id="' + widgetID + '">' + rows + '' + copyright_fix + '</div>' + copyright + '<script tgju-widget-js>' + embed_js + '</script>';
                break;
            case "ticker-tap":
                //ticker-tap-widget
                embed_style += '#marquee-' + widgetID + ':{direction:ltr}.marquee-row{display:flex;direction: rtl;}.tgju-widget{position:relative;overflow:hidden;background:#fff;margin:auto;direction:rtl;font-weight:500;font-size:13px;line-height:1;font-family:iranyekan;display:flex;border:1px solid #e0e3eb;border-radius:3px}.marquee-row .tgju-widget-item{flex-grow:1;white-space: nowrap;position:relative;padding:12px 23px;display:flex;align-items:center}.tgju-widget-item:last-child:after{display:none}.tgju-widget-item:hover{background:#f0f3fa}.tgju-widget-item:hover:after{display:none}.tgju-widget-item:after{background:#f0f3fa;bottom:10px;content:"";left:-1px;position:absolute;top:10px;width:1px}.marquee-row .tgju-widget-title-row{display:flex;margin-bottom:0}.marquee-row .tgju-widget-title{padding: 0 !important; border: 0 !important;display:flex;align-items:center;margin-left:20px}.tgju-widget-title-text.dot:before{content:"";width:6px;height:6px;display:inline-block;background:#fa941a;border-radius:50%;margin-left:6px}.tgju-widget-title-icon{margin-left:6px}.marquee-row .dt-p{display:inline-block;margin-right:1px;font-size:15px;font-weight:500}.marquee-row .tgju-widget-flag{width:20px;position:relative;top:0}.tgju-widget-flag img.tgju-widget-flag-img{width:100%;border-radius:50%}.tgju-widget-sub-flag{position:absolute;top:-3px;right:-6px;border-radius:50%;overflow:hidden;border:1px #fff solid;width:12px;height:12px}.tgju-widget-sub-flag img{width:100%;height:100%}.tgju-widget-title-text{font-size:14px;white-space:nowrap;font-weight:600}.marquee-row .tgju-widget-change{display:flex;align-items:end;padding:0;margin-right:20px}.marquee-row .tgju-widget-change .widget-change-price{font-size:15px;margin-right:8px;position:relative;font-weight:600;direction:ltr}.marquee-row .tgju-widget-change .widget-change{font-size:15px;font-weight:600}.marquee-row .tgju-widget-change .tgju-widget-change-arrow{width:9px;margin-left:5px;display:inline-block;height:15px}.tgju-widget-change-price{display:flex}.tgju-widget-title-date{display:flex;flex-grow:1;justify-content:left;align-items:center}.tgju-widget-content-row{display:flex}.marquee-row .tgju-widget-current-price{flex-grow:1;text-align:left;font-size:15px;font-weight:600;padding-top:0;line-height:1.3;position:relative;top:1px}.tgju-widget-item.widget-low .tgju-widget-content-row{color:#ef5350}.tgju-widget-item.widget-low .tgju-widget-change .tgju-widget-change-arrow svg{transform:scale(-1)}.tgju-widget-item.widget-high .tgju-widget-content-row{color:#26a69a}@media (max-width:1024px){.tgju-widget-item:nth-child(5){display:none}.tgju-widget-item:nth-child(4):after{display:none}}@media (max-width:860px){.tgju-widget-item:nth-child(4){display:none}.tgju-widget-item:nth-child(3):after{display:none}}@media (max-width:720px){.tgju-widget-item:nth-child(3){display:none}.tgju-widget-item:nth-child(2):after{display:none}}@media (max-width:520px){.tgju-widget-item:nth-child(2){display:none}.tgju-widget-item:nth-child(1):after{display:none}}';
                embed_style += '.marquee-tgju{margin:0 auto;overflow:hidden;box-sizing:border-box;} [tgju-widget-id="' + widgetID + '"] .marquee-tgju span{width:max-content;padding-right:100%;will-change:transform;animation:marquee ' + item.getAttribute('speed') + 's linear infinite}.marquee-tgju span:hover{animation-play-state:paused}@keyframes marquee{0%{transform:translate(0,0)}100%{transform:translate(+100%,0)}}@media (prefers-reduced-motion:reduce){.marquee-tgju span{animation-iteration-count:1;animation-duration:.01;width:auto;padding-left:0}}';
                if (styles && styles.background) { embed_style += '[tgju-widget-id="' + widgetID + '"] {background: ' + styles.background + ' !important;}'; }
                if (styles && styles.border) { embed_style += '[tgju-widget-id="' + widgetID + '"] {border: 1px solid ' + styles.border + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {box-shadow:-1px 0 3px 0 ' + styles.border + ' !important;}'; }
                if (styles && styles.hover) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item:hover {background: ' + styles.hover + ' !important;}'; }
                if (styles && styles.seprator) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item::after {background: ' + styles.seprator + ' !important;}'; }
                if (styles && styles.separator) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item::after {background: ' + styles.separator + ' !important;}'; }
                if (styles && styles.title) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-title-text {color: ' + styles.title + ' !important;}'; }
                if (styles && styles.dot) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-title-text.dot:before {background: ' + styles.dot + ' !important;}'; }
                if (styles && styles.price) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-current-price {color: ' + styles.price + ' !important;}'; }
                if (styles && styles.low) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item.widget-low .tgju-widget-content-row {color: ' + styles.low + ' !important;}'; }
                if (styles && styles.high) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item.widget-high .tgju-widget-content-row {color: ' + styles.high + ' !important;}'; }
                if (styles && styles.copyright) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright {color:' + styles.copyright + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright a{color: ' + styles.copyright + ' !important;}'; }
                if (styles && styles.copyright_fix) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {color:' + styles.copyright_fix + ' !important;}'; }
                if (styles && styles.copyright_fix_text) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a svg g {fill:' + styles.copyright_fix_text + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a{color: ' + styles.copyright_fix_text + ' !important;}'; }
                _HTML = '<style>' + embed_style + '</style><div class="tgju-widget" tgju-widget-id="' + widgetID + '"><div class="marquee-tgju"><span class="marquee-row">' + rows + '</span></div>' + copyright_fix + '</div>' + copyright + '<script tgju-widget-js>' + embed_js + '</script>';
                break;
            case "market-data":
                //market-data-widget
                var rows_table = '';
                rows_table += '<table class="tgju-widget-table">';
                rows_table += '<thead><tr>';
                rows_table += '<th>عنوان نرخ</th>';
                rows_table += '<th>قیمت زنده</th>';
                if (item.getAttribute('columns').split(',').includes("diff")) { rows_table += '<th>تغییر</th>'; }
                if (item.getAttribute('columns').split(',').includes("low")) { rows_table += '<th>کمترین</th>'; }
                if (item.getAttribute('columns').split(',').includes("high")) { rows_table += '<th>بیشترین</th>'; }
                if (item.getAttribute('columns').split(',').includes("time")) { rows_table += '<th>زمان</th>'; }
                rows_table += '</tr></thead><tbody>';
                rows_table += rows;
                rows_table += '</tbody></table>';
                embed_style += '.tgju-widget-title-text.dot:before {content: "";width: 6px;height: 6px;display: inline-block;background: #fa941a;border-radius: 50%;margin-left: 6px;} .tgju-widget{position: relative;overflow:hidden;background:#fff;margin:auto;direction:rtl;font-weight:500;font-size:13px;line-height:1;font-family:iranyekan;display:flex;border:1px solid #e0e3eb;border-radius:3px}.tgju-widget-table{line-height:1.5;width:100%;text-align:center;border-collapse:collapse}.tgju-widget-table thead tr th:first-child,.tgju-widget-table thead tr th:last-child{border-radius:0!important}.tgju-widget-table tr td{border-bottom:0!important}.tgju-widget-table thead tr th{font-weight:600!important;font-size:13px!important;text-align:right!important;padding:8px 10px}.tgju-widget-table tr td{border-top:1px solid #ececec;text-align:right;font-size:13px;padding:8px 10px}.tgju-widget-table tr td:nth-child(1){font-weight:600}.tgju-widget-table .c-low{color:#ef5350}.tgju-widget-table .c-high{color:#26a69a}.tgju-widget-table .tgju-widget-table .high:before,.tgju-widget-table .low:before{display:none!important}.tgju-widget-table tr td .tgju-widget-change-arrow{width:10px!important;margin-left:0;position:relative;top:0;display:inline-block}.tgju-widget-table tr td.c-low .tgju-widget-change-arrow svg{transform:scale(-1)}@media (max-width:769px){.tgju-widget-table tr td:nth-child(4),.tgju-widget-table tr td:nth-child(5),.tgju-widget-table tr td:nth-child(6),.tgju-widget-table tr td:nth-child(7),.tgju-widget-table tr td:nth-child(8),.tgju-widget-table tr th:nth-child(4),.tgju-widget-table tr th:nth-child(5),.tgju-widget-table tr th:nth-child(6),.tgju-widget-table tr th:nth-child(7),.tgju-widget-table tr th:nth-child(8){display:none!important}.tgju-widget-table tr th:nth-child(3),.tgju-widget-table tr td:nth-child(3){text-align:left!important}}@media (max-width:360px){.tgju-widget-table tr td:nth-child(3),.tgju-widget-table tr th:nth-child(3){display:none!important}.tgju-widget-table tr td:nth-child(2),.tgju-widget-table tr th:nth-child(2){text-align:left!important}}.tgju-widget-table .tgju-widget-table-title{display:flex;margin-bottom:0;white-space:nowrap;align-items:center}.tgju-widget-table .tgju-widget-table-title .tgju-widget-title-icon{margin-left:6px;display:inline-block;position:relative;top:-1px}.tgju-widget-table tbody tr:hover,.tgju-widget-table tbody tr:hover td{background:#ffffd7!important}.tgju-widget-table .tgju-widget-flag{width:17px;position:relative;top:1px}.tgju-widget-table .tgju-widget-flag img.tgju-widget-flag-img{width:100%;border-radius:50%}.tgju-widget-table .tgju-widget-sub-flag{position:absolute;top:-3px;right:-6px;border-radius:50%;overflow:hidden;border:1px #fff solid;width:12px;height:12px}.tgju-widget-table .tgju-widget-sub-flag img{width:100%;height:100%}.tgju-widget-table .tgju-widget-title-text{font-size:14px;white-space:nowrap}';
                if (styles && styles.background) { embed_style += '[tgju-widget-id="' + widgetID + '"] {background: ' + styles.background + ' !important;}'; }
                if (styles && styles.border) { embed_style += '[tgju-widget-id="' + widgetID + '"] {border: 1px solid ' + styles.border + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {box-shadow:-1px 0 3px 0 ' + styles.border + ' !important;}'; }
                if (styles && styles.hcolor) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table thead tr th {color:' + styles.hcolor + ' !important;}'; }
                if (styles && styles.hbackground) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table thead tr th {background-color:' + styles.hbackground + ' !important;}'; }
                if (styles && styles.hover) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table tbody tr:hover {background: ' + styles.hover + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table tbody tr:hover td {background: ' + styles.hover + ' !important;}'; }
                if (styles && styles.borderlist) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table tr td {border-top: 1px solid ' + styles.borderlist + ' !important;}'; }
                if (styles && styles.title) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table .tgju-widget-table-title {color: ' + styles.title + ' !important;}'; }
                if (styles && styles.price) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table tr td {color: ' + styles.price + ' !important;}'; }
                if (styles && styles.low) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table .c-low {color: ' + styles.low + ' !important;}'; }
                if (styles && styles.high) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-table .c-high {color: ' + styles.high + ' !important;}'; }
                if (styles && styles.copyright) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright {color:' + styles.copyright + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright a{color: ' + styles.copyright + ' !important;}'; }
                if (styles && styles.copyright_fix) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {color:' + styles.copyright_fix + ' !important;}'; }
                if (styles && styles.copyright_fix_text) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a svg g {fill:' + styles.copyright_fix_text + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a{color: ' + styles.copyright_fix_text + ' !important;}'; }
                _HTML = '<style>' + embed_style + '</style><div class="tgju-widget" tgju-widget-id="' + widgetID + '">' + rows_table + ' ' + copyright_fix + '</div>' + copyright + '<script tgju-widget-js>' + embed_js + '</script>';
                break;
            case "market-overview":
                //market-overview-widget
                var _loading = '<div class="tgju-loading"><svg version="1.1" id="loading-circle" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve"> <path d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"> <animateTransform attributeType="XML" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/> </path> </svg> </div>';
                var script_inc = '<script tgju-widget-js> updateChart("tgju-chart-' + widgetID + '","' + widgetData[Object.keys(widgetData)[0]].item_id + '", "' + widgetData[Object.keys(widgetData)[0]].title + '") </script>';

                embed_style += '.highcharts-container{width: 100% !important; }.highcharts-root{width: 100% !important;} #tgju-chart-' + widgetID + ' {display: flex; justify-content: center; width: 100%;} #tgju-chart-' + widgetID + ' .highcharts-container {width: 100% !important;}.tgju-widget-box .tgju-loading svg{max-width:20px;display:block;margin:auto;padding:50px 0}.highcharts-title{font-size:12px!important}.highcharts-container,.highcharts-background,.highcharts-root{max-height:200px}.highcharts-axis-title,.highcharts-axis-labels.highcharts-xaxis-labels,.highcharts-title,.highcharts-axis-labels.highcharts-yaxis-labels{font-family:iranyekan!important}.tgju-widget{position:relative;overflow:hidden;background:#fff;margin:auto;direction:rtl;font-weight:500;font-size:13px;line-height:1;font-family:iranyekan;display:flex;border:1px solid #e0e3eb;border-radius:3px}.tgju-widget-box ul li{cursor:pointer}.tgju-widget-box{display:block!important}.tgju-widget-box .tgju-widget-content-row{justify-content:left;direction:ltr}.tgju-widget-box .tgju-widget-content-row .tgju-widget-change{direction:rtl}.tgju-widget-box .tgju-widget-item{padding:12px 16px}.tgju-widget-box .tgju-loading svg{fill:#222}.tgju-widget-box .tgju-widget-change .widget-change{font-size:13px}.tgju-widget-box .tgju-widget-change .tgju-widget-change-arrow{width:9px;margin-left:6px;position:relative;top:0}.tgju-widget-box .tgju-widget-current-price{padding-top:0}.tgju-widget-box .tgju-widget-title-text{position:relative;top:10px}.tgju-widget-box .tgju-widget-change .widget-change-price{font-size:13px;margin-right:8px;position:relative;top:0}.tgju-widget-box ul{margin:0;list-style:none!important;padding:0}.tgju-widget-box ul li{border-top:1px solid #e0e3eb}.tgju-widget-title-text.dot:before{content:"";width:6px;height:6px;display:inline-block;background:#fa941a;border-radius:50%;margin-left:6px}.tgju-widget-item{flex-grow:1;padding:12px 23px;position:relative}.tgju-widget-item:last-child:after{display:none}.tgju-widget-item:hover{background:#f0f3fa}.tgju-widget-item:hover:after{display:none}.tgju-widget-item:after{background:#f0f3fa;bottom:10px;content:"";left:-1px;position:absolute;top:10px;width:1px}.tgju-widget-title-row{display:flex;margin-bottom:5px}.tgju-widget-title{padding: 0 !important; border: 0 !important;display:flex;align-items:center}.tgju-widget-title-icon{margin-left:6px}.tgju-widget-flag{width:17px;position:relative;top:1px}.tgju-widget-flag img.tgju-widget-flag-img{width:100%;border-radius:50%}.tgju-widget-sub-flag{position:absolute;top:-3px;right:-6px;border-radius:50%;overflow:hidden;border:1px #fff solid;width:12px;height:12px}.tgju-widget-sub-flag img{width:100%;height:100%}.tgju-widget-title-text{font-size:14px;white-space:nowrap}.tgju-widget-change{display:flex;align-items:end;padding:4px 0 0}.tgju-widget-change .widget-change-price{font-size:12px;margin-right:8px;position:relative;top:0}.tgju-widget-change .widget-change{font-size:18px}.tgju-widget-change .tgju-widget-change-arrow{width:13px;margin-left:8px;position:relative;top:-5px}.tgju-widget-change-price{display:flex}.tgju-widget-title-date{display:flex;flex-grow:1;justify-content:left;align-items:center}.tgju-widget-content-row{display:flex}.tgju-widget-current-price{flex-grow:1;text-align:left;font-size:14px;font-weight:500;padding-top:3px}.tgju-widget-item.widget-low .tgju-widget-content-row{color:#ef5350}.tgju-widget-item.widget-low .tgju-widget-change .tgju-widget-change-arrow svg{transform:scale(-1)}.tgju-widget-item.widget-high .tgju-widget-content-row{color:#26a69a}@media (max-width:1024px){.tgju-widget-item:nth-child(5){display:none}.tgju-widget-item:nth-child(4):after{display:none}}@media (max-width:860px){.tgju-widget-item:nth-child(4){display:none}.tgju-widget-item:nth-child(3):after{display:none}}@media (max-width:720px){.tgju-widget-item:nth-child(3){display:none}.tgju-widget-item:nth-child(2):after{display:none}}@media (max-width:520px){.tgju-widget-item:nth-child(2){display:none}.tgju-widget-item:nth-child(1):after{display:none}}';
                if (styles && styles.background) { embed_style += '[tgju-widget-id="' + widgetID + '"] {background: ' + styles.background + ' !important;}'; }
                if (styles && styles.background) { embed_style += '[tgju-widget-id="' + widgetID + '"] .highcharts-background{fill: ' + styles.background + ' !important;}'; }
                if (styles && styles.border) { embed_style += '[tgju-widget-id="' + widgetID + '"] {border: 1px solid ' + styles.border + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {box-shadow:-1px 0 3px 0 ' + styles.border + ' !important;}'; }
                if (styles && styles.hover) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item:hover {background: ' + styles.hover + ' !important;}'; }
                if (styles && styles.seprator) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-box ul li {border-top: ' + styles.seprator + ' !important;}'; }
                if (styles && styles.separator) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-box ul li {border-top: ' + styles.separator + ' !important;}'; }
                if (styles && styles.title) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-title-text {color: ' + styles.title + ' !important;}'; }
                if (styles && styles.dot) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-title-text.dot:before {background: ' + styles.dot + ' !important;}'; }
                if (styles && styles.price) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-current-price {color: ' + styles.price + ' !important;}'; }
                if (styles && styles.low) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item.widget-low .tgju-widget-content-row {color: ' + styles.low + ' !important;}'; }
                if (styles && styles.high) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-widget-item.widget-high .tgju-widget-content-row {color: ' + styles.high + ' !important;}'; }
                if (styles && styles.copyright) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright {color:' + styles.copyright + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright a{color: ' + styles.copyright + ' !important;}'; }
                if (styles && styles.loading) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-loading svg {fill:' + styles.loading + ' !important;}'; }
                if (styles && styles.copyright_fix) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix {color:' + styles.copyright_fix + ' !important;}'; }
                if (styles && styles.copyright_fix_text) { embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a svg g {fill:' + styles.copyright_fix_text + ' !important;}'; embed_style += '[tgju-widget-id="' + widgetID + '"] .tgju-copyright-fix a{color: ' + styles.copyright_fix_text + ' !important;}'; }
                _HTML = '<style>' + embed_style + '</style><div class="tgju-widget tgju-widget-box" tgju-widget-id="' + widgetID + '"><div id="tgju-chart-' + widgetID + '">' + _loading + '</div><ul class="list">' + rows + '</ul> ' + copyright_fix + ' </div>' + copyright + '<script tgju-widget-js>' + embed_js + '</script>' + script_inc;
                break;
            default:
            // حالت پیشفرض;
        }

        var div = document.createElement("div");
        div.innerHTML = _HTML;
        item.replaceWith(div);
    }
})

function addScriptHighcharts(callback) {
    if (typeof Highcharts == "undefined") {
        var script = document.createElement('script');
        var prior = document.getElementsByTagName('script')[0];
        script.async = 1;

        script.onload = script.onreadystatechange = function (_, isAbort) {
            if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if (!isAbort && callback) setTimeout(callback, 0);
            }
        };

        script.src = 'https://static.tgju.org/views/default/js/highcharts-v12.js';
        prior.parentNode.insertBefore(script, prior);
    } else {
        setTimeout(callback, 0)
    }
}

function addScriptHighchartsData(callback) {
    if (typeof Highcharts.getJSON == "undefined") {
        var script = document.createElement('script');
        var prior = document.getElementsByTagName('script')[0];
        script.async = 1;

        script.onload = script.onreadystatechange = function (_, isAbort) {
            if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if (!isAbort && callback) setTimeout(callback, 0);
            }
        };

        script.src = 'https://static.tgju.org/views/default/js/highcharts-data.js?a1';
        prior.parentNode.insertBefore(script, prior);
    } else {
        setTimeout(callback, 0)
    }
}

function addScriptPersianDate(callback) {
    if (typeof persianDate == "undefined") {
        var script = document.createElement('script');
        var prior = document.getElementsByTagName('script')[0];
        script.async = 1;

        script.onload = script.onreadystatechange = function (_, isAbort) {
            if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if (!isAbort && callback) setTimeout(callback, 0);
            }
        };

        script.src = 'https://static.tgju.org/components/persiandate/dist/persiandate.min.js';
        prior.parentNode.insertBefore(script, prior);
    } else {
        setTimeout(callback, 0)
    }
}

function faToEn(str) {
    var persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    var arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    var converted = '';
    for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        var index;

        index = persianNumbers.indexOf(ch);
        if (index !== -1) {
            converted += index;
            continue;
        }

        index = arabicNumbers.indexOf(ch);
        if (index !== -1) {
            converted += index;
            continue;
        }

        converted += ch; // اگر عدد نبود، همون کاراکتر رو اضافه کن
    }

    return converted;
}

function updateChart(chart_id, item, title) {

    // var _loading = '<div class="tgju-loading"><svg version="1.1" id="loading-circle" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve"> <path d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"> <animateTransform attributeType="XML" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/> </path> </svg> </div>';
    // var chart_box = document.getElementById('tgju-chart-'+widgetID);

    // chart_box.innerHTML =_loading;

    addScriptHighcharts(function () {
        addScriptHighchartsData(function () {
            addScriptPersianDate(function () {
                Highcharts.getJSON('https://api.tgju.org/v1/widget/history/' + item, function (data) {
                    Highcharts.dateFormats = {
                        'a': function (ts) {
                            return new persianDate(ts).format('dddd')
                        },
                        'A': function (ts) {
                            return new persianDate(ts).format('dddd')
                        },
                        'd': function (ts) {
                            return new persianDate(ts).format('DD')
                        },
                        'e': function (ts) {
                            return new persianDate(ts).format('D')
                        },
                        'b': function (ts) {
                            return new persianDate(ts).format('MMMM')
                        },
                        'B': function (ts) {
                            return new persianDate(ts).format('MMMM')
                        },
                        'm': function (ts) {
                            return new persianDate(ts).format('MM')
                        },
                        'y': function (ts) {
                            return new persianDate(ts).format('YY')
                        },
                        'Y': function (ts) {
                            return new persianDate(ts).format('YYYY')
                        },
                        'W': function (ts) {
                            return new persianDate(ts).format('ww')
                        }
                    };
                    Highcharts.setOptions({
                        tooltip: {
                            useHTML: false,
                            style: {
                                fontFamily: 'iranyekan',
                            },
                            formatter: function () {
                                var num = this.y;
                                var parts = ('' + num).split('.');
                                var intPart = parts[0];
                                var decimalPart = parts.length > 1 ? parts[1] : null;

                                // فرمت سه رقم سه رقم برای بخش صحیح
                                var formattedInt = '';
                                var count = 0;
                                for (var i = intPart.length - 1; i >= 0; i--) {
                                    formattedInt = intPart.charAt(i) + formattedInt;
                                    count++;
                                    if (count % 3 === 0 && i !== 0) {
                                        formattedInt = ',' + formattedInt;
                                    }
                                }

                                // اضافه کردن اعشار در صورت وجود
                                var finalString = decimalPart ? formattedInt + '.' + decimalPart : formattedInt;

                                return '<b>' + finalString + '</b><br>'
                                    + faToEn(Highcharts.dateFormat('%Y/%m/%d', new Date(this.x)))
                                    + '<br>' + title;
                            }
                        },
                        credits: {
                            enabled: false,
                        },
                        lang: {
                            thousandsSep: ","
                        }
                    });
                    Highcharts.chart(chart_id, {
                        chart: {
                            zoomType: 'x',
                            renderTo: 'chart',
                            marginLeft: 3,
                            marginRight: 3,
                            defaultSeriesType: 'areaspline',
                            events: {
                                load: function (event) {
                                    event.target.reflow();
                                }
                            }
                        },
                        accessibility: {
                            enabled: false,
                        },
                        title: {
                            text: ' نمودار ' + title,
                        },
                        xAxis: {
                            type: 'datetime'
                        },
                        yAxis: {
                            title: {
                                text: 'بازه قیمت'
                            }
                        },
                        legend: {
                            enabled: false,
                            rtl: true
                        },
                        plotOptions: {
                            area: {
                                fillColor: {
                                    linearGradient: {
                                        x1: 0,
                                        y1: 0,
                                        x2: 0,
                                        y2: 1
                                    },
                                    stops: [
                                        [0, Highcharts.getOptions().colors[0]],
                                        [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                                    ]
                                },
                                marker: {
                                    radius: 2
                                },
                                lineWidth: 1,
                                states: {
                                    hover: {
                                        lineWidth: 1
                                    }
                                },
                                threshold: null,
                            }
                        },

                        series: [{
                            type: 'area',
                            data: data,
                            name: 'قیمت'
                        }]
                    });
                });
            })
        })
    })

};
