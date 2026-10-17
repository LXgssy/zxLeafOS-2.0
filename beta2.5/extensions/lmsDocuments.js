// Author: zxLeafOS
// 不支持改编，不开源
(function (Scratch) {
  "use strict";
  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const renderer = vm.renderer;
  const Cast = Scratch.Cast;

  var loadStatusMap = {};

    async function handleExportMessage(e) {
    const d = e.data;
    if (!d || d.__export !== true) return;
    try {
      if (d.action === "exportFile") {
        const { ext, content, name } = d;
        if (ext === "docx") {
          await exportDocxFromParent(content, name);
        } else if (ext === "xlsx") {
          await exportXlsxFromParent(content, name);
        } else if (ext === "pptx") {
          await exportPptxFromParent(content, name);
        }
      } else if (d.action === "getDataURL") {
        const { ext, content, name, requestId } = d;
        var blob;
        if (ext === "docx") {
          blob = await exportDocxBlob(content, name);
        } else if (ext === "xlsx") {
          blob = await exportXlsxBlob(content, name);
        } else if (ext === "pptx") {
          blob = await exportPptxBlob(content, name);
        }
        if (blob) {
          var reader = new FileReader();
          reader.onload = function () {
            e.source.postMessage({ __export: true, action: "dataURLResult", requestId: requestId, dataURL: reader.result }, "*");
          };
          reader.readAsDataURL(blob);
        }
      }
    } catch (err) {
      console.error("Export error:", err);
      if (d.action === "getDataURL") {
        e.source.postMessage({ __export: true, action: "dataURLResult", requestId: d.requestId, error: String(err.message || err) }, "*");
      }
    }
  }
  window.addEventListener("message", handleExportMessage, false);

  const exportState = { active: false, total: 0, done: 0, speed: 0, elapsed: 0, status: "idle", startTime: 0, errors: 0 };

  async function captureEl(el, cw, ch, useFallback) {
    var data = "<svg xmlns='http://www.w3.org/2000/svg' width='" + cw + "' height='" + ch + "'><foreignObject width='100%' height='100%'><div xmlns='http://www.w3.org/1999/xhtml' style='width:" + cw + "px;height:" + ch + "px;overflow:hidden;'>" + el.outerHTML + "</div></foreignObject></svg>";
    var blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    try {
      var img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise(function (res, rej) { img.onload = res; img.onerror = rej; img.src = url; });
      var canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      URL.revokeObjectURL(url);
      return canvas;
    } catch (e) {
      URL.revokeObjectURL(url);
      if (useFallback && typeof html2canvas !== "undefined") {
        var opts = { scale: 1, useCORS: true, allowTaint: false, backgroundColor: "#ffffff", logging: false, imageTimeout: 3000, removeContainer: false, width: cw, height: ch, windowWidth: cw, windowHeight: ch };
        try { return await Promise.race([html2canvas(el, opts), new Promise(function (_, rej) { setTimeout(function () { rej(new Error("h2c timeout")); }, 8000); })]); } catch (e2) {}
      }
      var c3 = document.createElement("canvas");
      c3.width = cw || 800; c3.height = ch || 600;
      var ctx3 = c3.getContext("2d");
      ctx3.fillStyle = "#ffffff"; ctx3.fillRect(0, 0, c3.width, c3.height);
      ctx3.fillStyle = "#333"; ctx3.font = "14px sans-serif";
      var txt = (el.textContent || "").substring(0, 500);
      var lines = txt.split("\n");
      for (var li = 0; li < lines.length && li < 30; li++) ctx3.fillText(lines[li], 10, 20 + li * 18);
      return c3;
    }
  }

  async function captureContent(contentHtml, width, onProgress) {
    loadAPI("html2canvas");
    var w = width || 800;
    var iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-99999px;top:0;width:" + w + "px;height:600px;border:0;background:#fff;";
    document.body.appendChild(iframe);
    var doc = iframe.contentDocument;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;}img{max-width:100%;}table{border-collapse:collapse;}td,th{border:1px solid #d1d5db;padding:6px 10px;}</style></head><body></body></html>');
    doc.close();
    var body = doc.body;
    body.innerHTML = contentHtml;
    await convertBlobImages(body);
    var imgs = body.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute("data-export-src") || imgs[i].getAttribute("src") || "";
      if (src.indexOf("data:") === 0) imgs[i].src = src;
    }
    await new Promise(function (r) { setTimeout(r, 50); });

    var slides = body.querySelectorAll(".slide");
    var pages = body.querySelectorAll(".doc-page, .page");
    var content = body.firstElementChild || body;
    var ch = content.offsetHeight || 1000;
    var pageH = 1000;
    var total = slides.length || pages.length || Math.max(1, Math.ceil(ch / pageH));
    exportState.total = total; exportState.done = 0; exportState.startTime = Date.now(); exportState.errors = 0; exportState.status = "running"; exportState.active = true;

    var canvases = [];
    var updateProgress = function (idx) {
      exportState.done = idx + 1;
      exportState.elapsed = (Date.now() - exportState.startTime) / 1000;
      exportState.speed = exportState.elapsed > 0 ? (exportState.done / exportState.elapsed).toFixed(2) : 0;
      if (onProgress) try { onProgress(idx + 1, total); } catch (e) {}
    };

    if (slides.length > 0) {
      for (var si = 0; si < slides.length; si++) {
        var slide = slides[si];
        slide.style.display = "block";
        var inner = slide.querySelector(".slide-inner");
        var sw = parseFloat(slide.dataset.w) || 960;
        var sh = parseFloat(slide.dataset.h) || 720;
        if (inner) { inner.style.transform = "none"; inner.style.left = "0"; inner.style.top = "0"; }
        slide.style.width = sw + "px";
        slide.style.height = sh + "px";
        try { canvases.push(await captureEl(slide, sw, sh, true)); } catch (e) { exportState.errors++; }
        updateProgress(si);
        await new Promise(function (r) { setTimeout(r, 10); });
      }
    } else if (pages.length > 0) {
      for (var pi = 0; pi < pages.length; pi++) {
        var pw = pages[pi].offsetWidth || w;
        var ph = pages[pi].offsetHeight || 1000;
        try { canvases.push(await captureEl(pages[pi], pw, ph, true)); } catch (e) { exportState.errors++; }
        updateProgress(pi);
        await new Promise(function (r) { setTimeout(r, 10); });
      }
    } else {
      var cw2 = content.offsetWidth || w;
      var numPages = Math.max(1, Math.ceil(ch / pageH));
      for (var pgi = 0; pgi < numPages; pgi++) {
        var tmpDiv = doc.createElement("div");
        tmpDiv.style.cssText = "width:" + cw2 + "px;height:" + pageH + "px;overflow:hidden;";
        var clone = content.cloneNode(true);
        tmpDiv.appendChild(clone);
        clone.style.cssText = "position:relative;top:" + (-pgi * pageH) + "px;width:" + cw2 + "px;";
        body.appendChild(tmpDiv);
        try { canvases.push(await captureEl(tmpDiv, cw2, pageH, true)); } catch (e) { exportState.errors++; }
        body.removeChild(tmpDiv);
        updateProgress(pgi);
        await new Promise(function (r) { setTimeout(r, 10); });
      }
    }
    document.body.removeChild(iframe);
    exportState.status = "done"; exportState.active = false; exportState.elapsed = (Date.now() - exportState.startTime) / 1000;
    return canvases;
  }

  async function exportDocxBlob(contentHtml, name) {
    var canvases = await captureContent(contentHtml, 800);
    if (canvases.length === 0) throw new Error("截图失败");
    const ok = await loadAPI("jszip");
    if (!ok || typeof JSZip === "undefined") throw new Error("JSZip 加载失败");
    var zip = new JSZip();
    var imgData = [];
    for (var ci = 0; ci < canvases.length; ci++) {
      var dataUrl = canvases[ci].toDataURL("image/png");
      var b64 = dataUrl.split(",")[1];
      imgData.push({ data: b64, ext: "png", w: canvases[ci].width, h: canvases[ci].height });
    }
    var pageW = 596, pageH = 842;
    var body = "";
    for (var pi = 0; pi < imgData.length; pi++) {
      var img = imgData[pi];
      var scale = Math.min(pageW / img.w, pageH / img.h);
      var dw = Math.round(img.w * scale);
      var dh = Math.round(img.h * scale);
      var cx = (img.w * 9525).toFixed(0);
      var cy = (img.h * 9525).toFixed(0);
      var ecw = (dw * 9525).toFixed(0);
      var ech = (dh * 9525).toFixed(0);
      body += '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + ecw + '" cy="' + ech + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="' + (pi + 1) + '" name="img' + (pi + 1) + '"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + (pi + 1) + '" name="img' + (pi + 1) + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId' + (pi + 10) + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + ecw + '" cy="' + ech + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    }
    zip.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><w:body>' + body + '</w:body></w:document>');
    for (var i = 0; i < imgData.length; i++) zip.file("word/media/image" + (i + 1) + "." + imgData[i].ext, imgData[i].data, { base64: true });
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>';
    for (var i = 0; i < imgData.length; i++) rels += '<Relationship Id="rId' + (i + 10) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image' + (i + 1) + '.' + imgData[i].ext + '"/>';
    rels += '</Relationships>';
    zip.file("_rels/.rels", rels);
    var drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    for (var i = 0; i < imgData.length; i++) drels += '<Relationship Id="rId' + (i + 10) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image' + (i + 1) + '.' + imgData[i].ext + '"/>';
    drels += '</Relationships>';
    zip.file("word/_rels/document.xml.rels", drels);
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
    zip.file("[Content_Types].xml", ct);
    return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  async function exportDocxFromParent(contentHtml, name) {
    var blob = await exportDocxBlob(contentHtml, name);
    triggerDownload(blob, name + ".docx");
  }

  async function exportXlsxBlob(contentHtml, name) {
    var canvases = await captureContent(contentHtml, 1000);
    if (canvases.length === 0) throw new Error("截图失败");
    const ok = await loadAPI("jszip");
    if (!ok || typeof JSZip === "undefined") throw new Error("JSZip 加载失败");
    var zip = new JSZip();
    var imgDataUrl = canvases[0].toDataURL("image/png");
    var imgB64 = imgDataUrl.split(",")[1];
    var imgW = canvases[0].width;
    var imgH = canvases[0].height;
    var sheetRows = '<row r="1"><c r="A1" t="inlineStr"><is><t xml:space="preserve"> </t></is></c></row>';
    zip.file("xl/worksheets/sheet1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"><sheetData>' + sheetRows + '</sheetData><drawing r:id="rId1"/></worksheet>');
    zip.file("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="drawings/drawing1.xml"/></Relationships>');
    zip.file("xl/drawings/drawing1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:twoCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>10</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>30</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="img1"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + (imgW * 9525) + '" cy="' + (imgH * 9525) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic></xdr:twoCellAnchor></xdr:wsDr>');
    zip.file("xl/drawings/_rels/drawing1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/></Relationships>');
    zip.file("xl/media/image1.png", imgB64, { base64: true });
    zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.drawing+xml"/></Types>');
    return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  async function exportXlsxFromParent(contentHtml, name) {
    var blob = await exportXlsxBlob(contentHtml, name);
    triggerDownload(blob, name + ".xlsx");
  }

  async function exportPptxBlob(contentHtml, name) {
    var canvases = await captureContent(contentHtml, 960);
    if (canvases.length === 0) throw new Error("截图失败");
    const ok = await loadAPI("jszip");
    if (!ok || typeof JSZip === "undefined") throw new Error("JSZip 加载失败");
    var zip = new JSZip();
    var imgData = [];
    for (var ci = 0; ci < canvases.length; ci++) {
      var dataUrl = canvases[ci].toDataURL("image/png");
      var b64 = dataUrl.split(",")[1];
      imgData.push({ data: b64, ext: "png", w: canvases[ci].width, h: canvases[ci].height });
    }
    var slideW = 9144000;
    var slideH = 6858000;
    var slideXmls = [];
    var slideRels = [];
    for (var si = 0; si < imgData.length; si++) {
      var imgW = imgData[si].w * 9525;
      var imgH = imgData[si].h * 9525;
      var sldBody = '<p:pic><p:nvPicPr><p:cNvPr id="2" name="img' + (si + 1) + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + imgW + '" cy="' + imgH + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
      var sldXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + slideW + '" cy="' + slideH + '"/><a:chOff x="0" y="0"/><a:chExt cx="' + slideW + '" cy="' + slideH + '"/></a:xfrm></p:grpSpPr>' + sldBody + '</p:spTree></p:cSld><p:clrMapOvr><a:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sld>';
      slideXmls.push(sldXml);
      slideRels.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image' + (si + 1) + '.png"/></Relationships>');
    }
    for (var si2 = 0; si2 < slideXmls.length; si2++) {
      zip.file("ppt/slides/slide" + (si2 + 1) + ".xml", slideXmls[si2]);
      zip.file("ppt/slides/_rels/slide" + (si2 + 1) + ".xml.rels", slideRels[si2]);
    }
    for (var mi = 0; mi < imgData.length; mi++) zip.file("ppt/media/image" + (mi + 1) + ".png", imgData[mi].data, { base64: true });
    var sldIds = "";
    for (var si3 = 0; si3 < slideXmls.length; si3++) sldIds += '<p:sldId id="' + (256 + si3) + '" r:id="rId' + (si3 + 2) + '"/>';
    zip.file("ppt/presentation.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="1" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>' + sldIds + '</p:sldIdLst><p:sldSz cx="' + slideW + '" cy="' + slideH + '" type="screen4x3"/></p:presentation>');
    var presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>';
    for (var si4 = 0; si4 < slideXmls.length; si4++) presRels += '<Relationship Id="rId' + (si4 + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (si4 + 1) + '.xml"/>';
    presRels += '</Relationships>';
    zip.file("ppt/_rels/presentation.xml.rels", presRels);
    zip.file("ppt/slideMasters/slideMaster1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgRef idx="1001"><a:srgbClr val="FFFFFF"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sldMaster>');
    zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>');
    zip.file("ppt/slideLayouts/slideLayout1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title" preserve="1"><p:cSld name="Title Slide"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>');
    zip.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
    zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>');
    var ct2 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>';
    for (var si5 = 0; si5 < slideXmls.length; si5++) ct2 += '<Override PartName="/ppt/slides/slide' + (si5 + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
    ct2 += '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/></Types>';
    zip.file("[Content_Types].xml", ct2);
    return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  }

  async function exportPptxFromParent(contentHtml, name) {
    var blob = await exportPptxBlob(contentHtml, name);
    triggerDownload(blob, name + ".pptx");
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  async function convertBlobImages(container) {
    var imgs = container.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute("data-export-src") || imgs[i].getAttribute("src") || "";
      if (src.indexOf("blob:") === 0) {
        try {
          var b = await fetch(src).then(function (r) { return r.blob(); });
          var du = await new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); });
          imgs[i].setAttribute("data-export-src", du);
        } catch (e) {}
      } else if (src.indexOf("data:") === 0) {
        imgs[i].setAttribute("data-export-src", src);
      }
    }
    var mediaEls = container.querySelectorAll("audio[src],video[src]");
    for (var j = 0; j < mediaEls.length; j++) {
      var msrc = mediaEls[j].getAttribute("src") || "";
      if (msrc.indexOf("blob:") === 0) {
        try {
          var mb = await fetch(msrc).then(function (r) { return r.blob(); });
          var mdu = await new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(mb); });
          mediaEls[j].setAttribute("data-export-src", mdu);
        } catch (e) {}
      }
    }
  }
  function colLetter(n) {
    var s = "";
    while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
    return s;
  }
  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  const CDNS = {
    jszip: {
      primary: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      backup: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
    },
    mammoth: {
      primary: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js",
      backup: "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
    },
    xlsx: {
      primary: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      backup: "https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js",
    },
    docx: {
      primary: "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.min.js",
      backup: "https://unpkg.com/docx@8.5.0/build/index.min.js",
    },
    html2canvas: {
      primary: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
      backup: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    },
    pptxgenjs: {
      primary: "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
      backup: "https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
    },
  };

  const apiStatus = {};
  for (const k of ["jszip", "mammoth", "xlsx", "docx", "html2canvas", "pptxgenjs"]) apiStatus[k] = "idle";

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.crossOrigin = "anonymous";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("load failed: " + url));
      document.head.appendChild(s);
    });
  }

  async function loadAPI(name) {
    if (apiStatus[name] === "loaded") return true;
    if (apiStatus[name] === "loading") {
      await new Promise((r) => setTimeout(r, 100));
      return apiStatus[name] === "loaded";
    }
    apiStatus[name] = "loading";
    const cfg = CDNS[name];
    for (const url of [cfg.primary, cfg.backup]) {
      try {
        await loadScript(url);
        apiStatus[name] = "loaded";
        return true;
      } catch (e) {}
    }
    apiStatus[name] = "failed";
    return false;
  }

  function dataURLToArrayBuffer(dataURL) {
    const commaIdx = dataURL.indexOf(",");
    const base64 = commaIdx >= 0 ? dataURL.slice(commaIdx + 1) : dataURL;
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function getDataURLMime(dataURL) {
    const m = dataURL.match(/^data:([^;,]+)/);
    return m ? m[1] : "";
  }

  function detectType(buffer, mime) {
    mime = (mime || "").toLowerCase();
    if (mime.includes("wordprocessingml") || mime.includes("msword")) return "docx";
    if (mime.includes("presentationml") || mime.includes("powerpoint")) return "pptx";
    if (mime.includes("spreadsheetml") || mime.includes("excel")) return "xlsx";
    const arr = new Uint8Array(buffer.slice(0, 8));
    if (arr[0] === 0x50 && arr[1] === 0x4b) return "zip";
    return "unknown";
  }

  async function detectZipType(arrayBuffer) {
    const ok = await loadAPI("jszip");
    if (!ok || typeof JSZip === "undefined") return "unknown";
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const ct = zip.file("[Content_Types].xml");
      if (!ct) return "unknown";
      const xml = await ct.async("string");
      if (/presentationml/i.test(xml)) return "pptx";
      if (/wordprocessingml/i.test(xml)) return "docx";
      if (/spreadsheetml/i.test(xml)) return "xlsx";
      return "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  function getStageSize() {
    try {
      if (renderer.getStageSize) {
        const s = renderer.getStageSize();
        if (s && s[0]) return [s[0], s[1]];
      }
    } catch (e) {}
    if (runtime.stageWidth) return [runtime.stageWidth, runtime.stageHeight];
    return [480, 360];
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function scaleDocxFonts(html) {
    return html.replace(/font-size:\s*([\d.]+)(px|pt)/gi, function (m, n, u) {
      var v = parseFloat(n) * 0.35;
      if (u === "pt") v = v * 1.33;
      return "font-size:" + v.toFixed(1) + "px";
    });
  }

  const documents = Object.create(null);

  function createDocument(name, type, bodyHtml, meta) {
    const [sw, sh] = getStageSize();
    const doc = {
      name,
      type,
      bodyHtml,
      html: "",
      mode: "preview",
      numPages: meta.numPages || 1,
      wordCount: meta.wordCount || 0,
      pageContents: meta.pageContents || [],
      visible: false,
      x: 0,
      y: 0,
      width: sw,
      height: sh,
      zoom: 1,
      rotation: 0,
      fontFamily: meta.fontFamily || "system-ui, -apple-system, sans-serif",
      originalBuffer: meta.originalBuffer || null,
      iframe: null,
      overlay: null,
      fileName: meta.fileName || name,
      suffix: meta.suffix || "",
      sizeBytes: meta.sizeBytes || 0,
      createdTime: meta.createdTime || Date.now(),
      modifiedTime: meta.modifiedTime || Date.now(),
      comment: meta.comment || "",
      nightMode: false,
    };
    doc.html = buildPreviewHtml(doc);
    documents[name] = doc;
    return doc;
  }

  function destroyDocument(name) {
    const doc = documents[name];
    if (!doc) return;
    if (doc.iframe) {
      try {
        if (doc.resizeHandle && doc.resizeHandle.parentNode) doc.resizeHandle.parentNode.removeChild(doc.resizeHandle);
        renderer.removeOverlay(doc.iframe);
      } catch (e) {}
      doc.iframe = null;
      doc.overlay = null;
      doc.resizeHandle = null;
    }
    Reflect.deleteProperty(documents, name);
  }

  function ensureViewer(doc) {
    if (doc.iframe) return;
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:absolute;left:0;top:0;width:100%;height:100%;border:none;" +
      "background:#ffffff;display:block;pointer-events:auto;z-index:1;";
    iframe.setAttribute("sandbox", "allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads");
    iframe.setAttribute("srcdoc", doc.html);
    const overlay = renderer.addOverlay(iframe, "scale-centered");
    doc.iframe = iframe;
    doc.overlay = overlay;
    iframe.style.pointerEvents = "auto";
    if (iframe.parentElement) iframe.parentElement.style.pointerEvents = "auto";
    const handle = document.createElement("div");
    handle.style.cssText =
      "position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;" +
      "background:#4a6fa5;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;" +
      "z-index:10;box-shadow:0 1px 3px rgba(0,0,0,.3);";
    handle.title = "拖动调整大小";
    handle.addEventListener("mousedown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX, startY = e.clientY;
      const startW = doc.width, startH = doc.height;
      const z = doc.zoom || 1;
      function mv(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        doc.width = Math.max(40, startW + dx / z);
        doc.height = Math.max(40, startH + dy / z);
        updateViewerAttributes(doc);
      }
      function up() {
        document.removeEventListener("mousemove", mv);
        document.removeEventListener("mouseup", up);
      }
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
    });
    if (iframe.parentElement) iframe.parentElement.appendChild(handle);
    doc.resizeHandle = handle;
    updateViewerAttributes(doc);
  }

  function updateViewerAttributes(doc) {
    if (!doc.iframe) return;
    const iframe = doc.iframe;
    const [sw, sh] = getStageSize();
    const baseW = doc.width > 0 ? doc.width : sw;
    const baseH = doc.height > 0 ? doc.height : sh;
    const z = doc.zoom || 1;
    const w = baseW * z;
    const h = baseH * z;
    iframe.style.display = doc.visible ? "" : "none";
    if (doc.resizeHandle) doc.resizeHandle.style.display = doc.visible ? "" : "none";
    iframe.style.pointerEvents = "auto";
    if (iframe.parentElement) iframe.parentElement.style.pointerEvents = "auto";
    iframe.style.width = w + "px";
    iframe.style.height = h + "px";
    const parts = [];
    parts.push("translate(" + (-w / 2 + doc.x) + "px, " + (-h / 2 - doc.y) + "px)");
    if (doc.rotation !== 0) parts.push("rotate(" + doc.rotation + "deg)");
    iframe.style.transform = parts.join(" ");
    iframe.style.transformOrigin = "center center";
    try {
      var win = iframe.contentWindow;
      if (win) {
        var pcontent = win.document.getElementById("pcontent");
        if (pcontent) {
          var scale = baseW / sw;
          pcontent.style.transform = "scale(" + scale + ")";
          pcontent.style.transformOrigin = "top left";
          pcontent.style.width = (sw / scale) + "px";
        }
        var pbar = win.document.getElementById("pbar");
        if (pbar) pbar.style.transform = "scale(" + scale + ")";
        if (pbar) pbar.style.transformOrigin = "top left";
      }
    } catch (e) {}
    if (doc.overlay) {
      doc.overlay.mode = "scale-centered";
      try {
        renderer._updateOverlays && renderer._updateOverlays();
      } catch (e) {}
    }
  }

  function refreshViewerContent(doc) {
    if (!doc.iframe) return;
    doc.iframe.setAttribute("srcdoc", doc.html);
  }

  function applyDisplay(doc) {
    ensureViewer(doc);
    updateViewerAttributes(doc);
  }

  runtime.on("PROJECT_STOP_ALL", () => {
    for (const name of Object.keys(documents)) {
      const doc = documents[name];
      doc.visible = false;
      if (doc.iframe) updateViewerAttributes(doc);
    }
  });

  const refreshAllViewers = () => {
    for (const name of Object.keys(documents)) {
      const doc = documents[name];
      if (doc.iframe) updateViewerAttributes(doc);
    }
  };
  try {
    runtime.on("STAGE_SIZE_CHANGED", refreshAllViewers);
  } catch (e) {}
  try {
    vm.on && vm.on("STAGE_SIZE_CHANGED", refreshAllViewers);
  } catch (e) {}
  window.addEventListener("resize", refreshAllViewers);

  function buildPreviewHtml(doc) {
    const body = doc.bodyHtml;
    var html = doc.type === "pptx" ? wrapPptxPreviewHtml(body) : wrapPreviewHtml(body, doc.type);
    if (doc.nightMode) html = html.replace(/<body\b/, '<body class="night"');
    return html;
  }

  function previewScript() {
    return (
      "var zoom=100;" +
      "function applyZoom(){var c=document.getElementById('pcontent');c.style.transform='scale('+(zoom/100)+')';c.style.transformOrigin='top center';var zs=document.getElementById('zoomVal');if(zs)zs.textContent=zoom+'%';}" +
      "function pvSetZoom(v){zoom=Math.max(10,Math.min(200,parseInt(v)||100));applyZoom();}" +
      "function pvZoomIn(){pvSetZoom(zoom+10);}" +
      "function pvZoomOut(){pvSetZoom(zoom-10);}" +
      "function pvFitW(){pvSetZoom(100);}" +
      "function pvNight(){var n=!document.body.classList.contains('night');document.body.classList.toggle('night',n);}" +
      "function pvSearch(){var q=prompt('搜索:');if(!q)return;document.querySelectorAll('.hl').forEach(function(e){e.classList.remove('hl');});var c=document.getElementById('pcontent');var html=c.innerHTML;c.innerHTML=html.split(q).join('<span class=\"hl\">'+q+'</span>');}" +
      "function pvGoPage(){var p=parseInt(document.getElementById('pageInput').value);if(p>0){var pages=document.querySelectorAll('.slide');if(pages.length>0){var t=pages[Math.min(p-1,pages.length-1)];if(t)t.scrollIntoView({behavior:'smooth'});}}}" +
      "function pvCopy(){var c=document.getElementById('pcontent');var sel=window.getSelection();var range=document.createRange();range.selectNodeContents(c);sel.removeAllRanges();sel.addRange(range);try{document.execCommand('copy');alert('已复制');}catch(e){alert('复制失败');}sel.removeAllRanges();}" +
      "function pvLoadLib(url){return new Promise(function(res,rej){if(document.querySelector('script[data-lib=\"'+url+'\"]')){res();return;}var s=document.createElement('script');s.src=url;s.setAttribute('data-lib',url);s.onload=function(){res();};s.onerror=function(){rej(new Error('load fail'));};document.head.appendChild(s);});}" +
      "function pvAskName(def){var n=prompt('导出文件名:',def);if(n===null)return null;n=n.trim()||def;if(/\\.[a-z0-9]+$/i.test(n))n=n.replace(/\\.[a-z0-9]+$/i,'');return n;}" +
      "function pvDownloadBlob(blob,filename){var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url);},1000);}" +
      "async function pvBlobToDataURL(blob){return new Promise(function(res){var r=new FileReader();r.onload=function(){res(r.result);};r.readAsDataURL(blob);});}" +
      "async function pvImgToDataURL(img){var s=img.getAttribute('src');if(!s)return '';if(s.indexOf('data:')===0)return s;if(s.indexOf('blob:')===0){try{var b=await fetch(s).then(function(r){return r.blob();});return await pvBlobToDataURL(b);}catch(e){return '';}}return s;}" +
      "async function pvDownload(){var ext=document.body.getAttribute('data-ext')||'html';var content=document.getElementById('pcontent');var defName={'docx':'document','xlsx':'spreadsheet','pptx':'presentation'}[ext]||'document';var name=pvAskName(defName);if(!name)return;var imgs=content.querySelectorAll('img');for(var i=0;i<imgs.length;i++){var du=await pvImgToDataURL(imgs[i]);if(du)imgs[i].setAttribute('data-export-src',du);}var html=content.innerHTML;parent.postMessage({__export:true,action:'exportFile',ext:ext,content:html,name:name},'*');}" +
      "function pvPrint(){var content=document.querySelector('.pv-container')||document.body;var pf=document.createElement('iframe');pf.style.cssText='position:fixed;left:-99999px;top:0;width:800px;height:600px;border:0;background:#fff;';document.body.appendChild(pf);var pdoc=pf.contentDocument;pdoc.open();pdoc.write('<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>@media print{html,body{margin:0;padding:0;}.slide{page-break-after:always;}}</style></head><body></body></html>');pdoc.close();pdoc.body.innerHTML=content.innerHTML;pf.contentWindow.focus();setTimeout(function(){pf.contentWindow.print();setTimeout(function(){document.body.removeChild(pf);},500);},300);}" +
      "var fsi=document.getElementById('fontSizeInput');if(fsi){fsi.addEventListener('change',function(){var v=parseInt(fsi.value);if(v>0)document.getElementById('pcontent').style.fontSize=v+'px';});fsi.addEventListener('keydown',function(e){if(e.key==='Enter'){var v=parseInt(fsi.value);if(v>0)document.getElementById('pcontent').style.fontSize=v+'px';fsi.blur();}});}" +
      "var zr=document.getElementById('zoomRange');if(zr){var zt;zr.addEventListener('input',function(){clearTimeout(zt);zt=setTimeout(function(){pvSetZoom(zr.value);},100);});}" +
      "window.addEventListener('message',function(e){" +
      "if(e.data&&e.data.type==='GO_TO_PAGE'){var p=e.data.page;var pages=document.querySelectorAll('.sheet-block,.doc-body');if(pages.length>0){var t=pages[Math.min(p-1,pages.length-1)];if(t)t.scrollIntoView({behavior:'smooth'});}}" +
      "else if(e.data&&e.data.type==='SET_FONT_SIZE'){var c=document.getElementById('pcontent');if(c)c.style.fontSize=e.data.value+'px';}" +
      "});" +
      "document.querySelectorAll('.audio-btn').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();var u=b.dataset.url;if(!u)return;var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;';var box=document.createElement('div');box.style.cssText='width:360px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.2);';var h=document.createElement('div');h.style.cssText='padding:12px 14px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;';h.innerHTML='<span>音频播放</span>';var cb=document.createElement('button');cb.textContent='✕';cb.style.cssText='border:none;background:none;cursor:pointer;font-size:14px;color:#9ca3af;';cb.onclick=function(){document.body.removeChild(ov);};h.appendChild(cb);var aud=document.createElement('audio');aud.src=u;aud.style.display='none';var ctrl=document.createElement('div');ctrl.style.cssText='padding:14px;';var playBtn=document.createElement('button');playBtn.textContent='▶';playBtn.style.cssText='min-width:32px;height:32px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;color:#374151;flex-shrink:0;';var bar=document.createElement('div');bar.style.cssText='flex:1;height:8px;background:#e5e7eb;border-radius:4px;cursor:pointer;position:relative;min-width:60px;';var fill=document.createElement('div');fill.style.cssText='position:absolute;left:0;top:0;bottom:0;width:0;background:#4a6fa5;border-radius:4px;pointer-events:none;';bar.appendChild(fill);var cur=document.createElement('span');cur.style.cssText='color:#6b7280;min-width:36px;text-align:center;font-size:12px;font-variant-numeric:tabular-nums;flex-shrink:0;';cur.textContent='0:00';var dur=document.createElement('span');dur.style.cssText='color:#6b7280;min-width:36px;font-size:12px;font-variant-numeric:tabular-nums;flex-shrink:0;';dur.textContent='0:00';var speedBtn=document.createElement('button');var speeds=[0.25,0.5,0.75,1,1.25,1.5,1.75,2,5,10];var si=3;speedBtn.textContent=speeds[si]+'x';speedBtn.style.cssText='min-width:42px;height:32px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;color:#4a6fa5;flex-shrink:0;';function fmt(t){if(!isFinite(t))t=0;var m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+(s<10?'0':'')+s;}speedBtn.onclick=function(){si=(si+1)%speeds.length;speedBtn.textContent=speeds[si]+'x';aud.playbackRate=speeds[si];};playBtn.onclick=function(){if(aud.paused)aud.play();else aud.pause();};aud.addEventListener('play',function(){playBtn.textContent='❚❚';});aud.addEventListener('pause',function(){playBtn.textContent='▶';});aud.addEventListener('ended',function(){playBtn.textContent='▶';});aud.addEventListener('loadedmetadata',function(){dur.textContent=fmt(aud.duration);});aud.addEventListener('timeupdate',function(){var r=aud.duration>0?aud.currentTime/aud.duration:0;fill.style.width=(r*100)+'%';cur.textContent=fmt(aud.currentTime);});bar.addEventListener('click',function(e){if(aud.duration>0){var r=e.offsetX/bar.clientWidth;aud.currentTime=r*aud.duration;}});aud.playbackRate=speeds[si];var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;';row.appendChild(playBtn);row.appendChild(bar);row.appendChild(cur);var sep=document.createElement('span');sep.style.color='#9ca3af';sep.textContent='/';sep.style.flexShrink='0';row.appendChild(sep);row.appendChild(dur);row.appendChild(speedBtn);ctrl.appendChild(row);box.appendChild(h);box.appendChild(aud);box.appendChild(ctrl);ov.appendChild(box);ov.addEventListener('click',function(ev){if(ev.target===ov)document.body.removeChild(ov);});document.body.appendChild(ov);});});"
    );
  }

  function wrapPreviewHtml(body, type) {
    const adaptive =
      type === "docx"
        ? "@media(max-width:480px){.doc-body{font-size:0.85em!important;}}" +
          "@media(min-width:481px) and (max-width:768px){.doc-body{font-size:0.92em!important;}}" +
          "@media(min-width:1200px){.doc-body{font-size:1.05em!important;}}"
        : "";
    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<style>" +
      "*{box-sizing:border-box;}" +
      "html,body{margin:0;padding:0;color:#1f2937;background:#ffffff;}" +
      "body{overflow:auto;user-select:text;-webkit-user-select:text;transition:background .3s ease,color .3s ease;}" +
      "body *{transition:background-color .3s ease,color .3s ease,border-color .3s ease;}" +
      "body.night{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night #pcontent{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night #pbar{background:#1a1a2e!important;border-color:#333!important;}" +
      "body.night .preview-bar{background:#1a1a2e!important;border-color:#333!important;}" +
      "body.night .preview-bar button{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .preview-bar input{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night h1,body.night h2,body.night h3{color:#fff!important;}" +
      "body.night p,body.night span,body.night div,body.night li,body.night td,body.night th{color:#e0e0e0!important;}" +
      "body.night a{color:#8ab4f8!important;}" +
      "body.night table,body.night td,body.night th{border-color:#444!important;background:transparent!important;}" +
      "body.night .hl{background:#5d4e00!important;color:#fff!important;}" +
      "body.night .slide-notes{background:#16162a!important;color:#9ca3af!important;border-top-color:#444!important;}" +
      "body.night .pptx-viewport{background:#1a1a2e!important;border-color:#444!important;}" +
      "body.night .pptx-progress{background:#333!important;}" +
      "body.night .pptx-progress-bar{background:#5a7fc4!important;}" +
      "body.night .doc-body{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .doc-header{color:#e0e0e0!important;}" +
      "body.night .sheet-block{background:#1a1a2e!important;border-color:#444!important;}" +
      "body.night .sheet-name{color:#8ab4f8!important;border-bottom-color:#5a7fc4!important;}" +
      "body.night .media-player{background:#2a2a3e!important;border-color:#444!important;}" +
      "body.night .mp-play,body.night .mp-speed{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .mp-bar{background:#333!important;}" +
      "body.night .mp-fill{background:#5a7fc4!important;}" +
      "body.night .mp-cur,body.night .mp-dur{color:#9ca3af!important;}" +
      "body.night video{background:#000!important;}" +
      "body.night .audio-btn{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night input[type=range]{background:#333!important;}" +
      "body.night .preview-bar button:hover{background:#3a3a4e!important;border-color:#555!important;}" +
      "body.night .preview-content{background:#0f0f1e!important;}" +
      "body.night th{background:#2a2a3e!important;}" +
      "body.night ::-webkit-scrollbar{background:#1a1a2e!important;}" +
      "body.night ::-webkit-scrollbar-thumb{background:#444!important;border-radius:3px;}" +
      "body.night ::-webkit-scrollbar-track{background:#1a1a2e!important;}" +
      "h1,h2,h3{color:#111827;margin:1em 0 .5em;}" +
      "p{margin:.5em 0;}" +
      "img{max-width:100%;height:auto;}" +
      "table{border-collapse:collapse;}" +
      "a{color:#2563eb;}" +
      ".hl{background:#fff59d;color:#000;}" +
      ".preview-bar{position:fixed;top:0;left:0;right:0;z-index:999;display:flex;align-items:center;gap:4px;padding:5px 8px;background:rgba(255,255,255,0.95);border-bottom:1px solid #e5e7eb;font-size:12px;flex-wrap:wrap;}" +
      ".preview-bar button{padding:3px 8px;border:1px solid #d1d5db;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#374151;}" +
      ".preview-bar button:hover{background:#eef2ff;border-color:#a5b4fc;}" +
      ".preview-bar input{padding:2px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;}" +
      ".preview-bar input[type=range]{width:80px;padding:0;}" +
      ".preview-content{margin-top:42px;}" +
      adaptive +
      "</style></head>" +
      '<body contenteditable="false" data-ext="' + type + '">' +
      '<div class="preview-bar" id="pbar">' +
      '<input type="number" id="fontSizeInput" min="8" max="72" value="14" title="字号(px)" style="width:44px;">' +
      '<button onclick="pvZoomOut()">-</button>' +
      '<input type="range" id="zoomRange" min="10" max="200" value="100" title="缩放">' +
      '<span id="zoomVal" style="min-width:36px;text-align:center;">100%</span>' +
      '<button onclick="pvZoomIn()">+</button>' +
      '<button onclick="pvFitW()">适应</button>' +
      '<button onclick="pvNight()">夜间</button>' +
      '<button onclick="pvSearch()">搜索</button>' +
      '<input type="number" id="pageInput" placeholder="页" min="1" style="width:40px;" title="页码跳转">' +
      '<button onclick="pvGoPage()">跳转</button>' +
      '<button onclick="pvCopy()">复制</button>' +
      '<button onclick="pvDownload()">下载</button>' +
      '<button onclick="pvPrint()">打印</button>' +
      "</div>" +
      '<div class="preview-content" id="pcontent">' +
      body +
      "</div>" +
      "<script>" +
      previewScript() +
      "</script>" +
      "</body></html>"
    );
  }

  function wrapPptxPreviewHtml(body) {
    body = body.replace(/<div class="slide-inner" contenteditable="true"/g, '<div class="slide-inner"');
    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<style>" +
      "*{box-sizing:border-box;margin:0;padding:0;}" +
      "html,body{width:100%;height:100%;overflow:hidden;}" +
      "body{user-select:text;-webkit-user-select:text;transition:background .3s ease,color .3s ease;}" +
      "body *{transition:background-color .3s ease,color .3s ease,border-color .3s ease;}" +
      ".nav-arrow:hover{background:#f3f4f6;border-color:#9ca3af;}" +
      ".nav-arrow:active{background:#e5e7eb;}" +
      ".nav-arrow:disabled{opacity:.35;cursor:not-allowed;}" +
      ".nav-btn:hover{background:#f3f4f6;border-color:#9ca3af;}" +
      ".nav-btn:active{background:#e5e7eb;}" +
      ".nav-btn:disabled{opacity:.4;cursor:not-allowed;}" +
      ".slide-canvas::-webkit-scrollbar{width:6px;}" +
      ".slide-canvas::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px;}" +
      ".slide-canvas::-webkit-scrollbar-track{background:transparent;}" +
      "body.night{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .pptx-root{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .pptx-header{background:#1a1a2e!important;color:#e0e0e0!important;border-bottom-color:#333!important;}" +
      "body.night .pptx-footer{background:#1a1a2e!important;color:#e0e0e0!important;border-top-color:#333!important;}" +
      "body.night .pptx-title{color:#e0e0e0!important;}" +
      "body.night .pptx-counter,body.night .slide-indicator,body.night .pptx-zoom{color:#9ca3af!important;}" +
      "body.night .pptx-header button,body.night .pptx-footer button,body.night .nav-arrow,body.night .nav-btn{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .nav-arrow:hover,body.night .nav-btn:hover{background:#3a3a4e!important;border-color:#555!important;}" +
      "body.night .pptx-stage{background:#0f0f1e!important;}" +
      "body.night .pptx-viewport{background:#1a1a2e!important;border-color:#444!important;}" +
      "body.night .slide{background:#1a1a2e!important;color:#e0e0e0!important;}" +
      "body.night .slide-inner{background:#1a1a2e!important;}" +
      "body.night .slide-canvas{background:#1a1a2e!important;color:#9ca3af!important;}" +
      "body.night .slide-notes{background:#16162a!important;color:#9ca3af!important;border-top-color:#444!important;}" +
      "body.night .pptx-progress{background:#333!important;}" +
      "body.night .pptx-progress-bar{background:#5a7fc4!important;}" +
      "body.night p,body.night span,body.night div,body.night li,body.night td,body.night th{color:#e0e0e0!important;}" +
      "body.night h1,body.night h2,body.night h3{color:#fff!important;}" +
      "body.night table,body.night td,body.night th{border-color:#444!important;background:transparent!important;}" +
      "body.night .media-player{background:#2a2a3e!important;border-color:#444!important;}" +
      "body.night .mp-play,body.night .mp-speed{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .mp-bar{background:#333!important;}" +
      "body.night .mp-fill{background:#5a7fc4!important;}" +
      "body.night .mp-cur,body.night .mp-dur{color:#9ca3af!important;}" +
      "body.night video{background:#000!important;}" +
      "body.night input[type=range]{background:#333!important;}" +
      "body.night th{background:#2a2a3e!important;}" +
      "body.night ::-webkit-scrollbar{background:#1a1a2e!important;}" +
      "body.night ::-webkit-scrollbar-thumb{background:#444!important;border-radius:3px;}" +
      "body.night ::-webkit-scrollbar-track{background:#1a1a2e!important;}" +
      "body.night .slide-canvas::-webkit-scrollbar-thumb{background:#444!important;}" +
      "</style></head>" +
      '<body contenteditable="false">' +
      body +
      "<script>" +
      mediaPlayerScript() +
      ";" +
      pptxNavScript() +
      ";" +
      "function pvPptxNight(){var n=!document.body.classList.contains('night');document.body.classList.toggle('night',n);}" +
      "var nightBtn=document.getElementById('notesBtn');" +
      "if(nightBtn){" +
      "var nb=document.createElement('button');nb.textContent='夜间';nb.style.cssText='padding:3px 10px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#374151;margin-left:6px;';nb.onclick=function(){pvPptxNight();};nightBtn.parentNode.insertBefore(nb,nightBtn.nextSibling);" +
      "}" +
      "</script></body></html>"
    );
  }

  function buildEditorHtml(doc) {
    const body = doc.bodyHtml;
    var html = doc.type === "pptx" ? wrapPptxEditorHtml(body, doc.fontFamily) : wrapEditorHtml(body, doc.fontFamily, doc.type);
    if (doc.nightMode) html = html.replace(/<body\b/, '<body class="night"');
    return html;
  }

  function editorToolbarHtml(isPptx) {
    var g = function (html) { return '<span class="tb-group">' + html + "</span>"; };
    var last = g(
      tbBtn("↶", "撤销", "undo") +
      tbBtn("↷", "重做", "redo") +
      tbBtn("查找", "查找替换", "findReplace") +
      tbBtn("符号", "插入符号", "insertSymbol") +
      tbBtn("夜间", "夜间模式", "toggleNight")
    );
    if (!isPptx) last += g(tbBtn("导出", "导出文档", "exportDoc") + tbBtn("打印", "打印", "printDoc"));
    else last += g(tbBtn("新增页", "添加新幻灯片", "addSlide") + tbBtn("导出", "导出PPTX", "exportDoc") + tbBtn("打印", "打印所有页", "printDoc"));
    return (
      '<div class="editor-toolbar" contenteditable="false" style="display:flex;align-items:flex-start;gap:2px;padding:5px 6px 8px;background:#f7f8fa;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:100;user-select:none;flex-wrap:wrap;height:72px;overflow-y:auto;min-height:36px;resize:vertical;">' +
      g(
        '<input type="number" data-cmd="fontSizeInput" min="8" max="96" value="14" style="width:44px;padding:3px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;background:#fff;" title="字号(px)">' +
        tbBtn("A↑", "增大", "sizeUp") +
        tbBtn("A↓", "减小", "sizeDown")
      ) +
      g(
        tbBtn("B", "加粗", "bold", "font-weight:700;") +
        tbBtn("I", "斜体", "italic", "font-style:italic;") +
        tbBtn("U", "下划线", "underline", "text-decoration:underline;") +
        tbBtn("S", "删除线", "strikeThrough", "text-decoration:line-through;") +
        tbBtn("A₁", "下标", "subscript") +
        tbBtn("A¹", "上标", "superscript")
      ) +
      g(
        '<label title="高亮色" style="display:flex;align-items:center;justify-content:center;width:26px;height:24px;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;background:#fff;">' +
        '<span style="text-decoration:underline;text-decoration-color:#ffeb3b;font-size:13px;">A</span>' +
        '<input type="color" value="#ffeb3b" data-cmd="hiliteColor" style="display:none;">' +
        "</label>" +
        '<label title="字体颜色" style="display:flex;align-items:center;justify-content:center;width:26px;height:24px;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;background:#fff;">' +
        '<span style="color:#e53935;font-size:13px;">A</span>' +
        '<input type="color" value="#000000" data-cmd="foreColor" style="display:none;">' +
        "</label>"
      ) +
      g(
        tbBtn("左", "左对齐", "justifyLeft") +
        tbBtn("中", "居中", "justifyCenter") +
        tbBtn("右", "右对齐", "justifyRight") +
        tbBtn("两", "两端", "justifyFull") +
        '<select data-cmd="lineHeight" style="padding:3px 5px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;background:#fff;">' +
        '<option value="">行高</option><option value="1">1</option><option value="1.15">1.15</option>' +
        '<option value="1.5">1.5</option><option value="2">2</option><option value="2.5">2.5</option>' +
        "</select>"
      ) +
      g(
        tbBtn("•", "无序列表", "insertUnorderedList") +
        tbBtn("1.", "有序列表", "insertOrderedList") +
        tbBtn("⇤", "减少缩进", "outdent") +
        tbBtn("⇥", "增加缩进", "indent")
      ) +
      g(
        tbBtn("图片", "上传图片", "uploadImageBtn") +
        '<input type="file" id="imgFileInput" data-cmd="uploadImage" accept="image/*" style="display:none;">' +
        tbBtn("音频", "插入音频", "uploadAudioBtn") +
        '<input type="file" id="audioFileInput" data-cmd="uploadAudio" accept="audio/*" style="display:none;">' +
        tbBtn("表格", "插入表格", "insertTable") +
        tbBtn("链接", "插入链接", "createLink") +
        tbBtn("文本框", "文本框", "insertTextbox") +
        tbBtn("形状", "形状", "insertShape") +
        tbBtn("—", "分隔线", "insertHR")
      ) +
      last +
      "</div>"
    );
  }

  function tbBtn(text, title, cmd, extra) {
    return '<button type="button" data-cmd="' + cmd + '" title="' + title + '" style="min-width:28px;height:26px;padding:0 6px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#374151;' + (extra || "") + '">' + text + "</button>";
  }

  function editorStyle() {
    return (
      ".editor-content{flex:1;overflow:auto;padding:16px;outline:none;min-height:0;}" +
      ".editor-content.pptx-content{padding:0;overflow:hidden;}" +
      ".editor-content img{max-width:100%;cursor:pointer;}" +
      ".editor-toolbar{resize:vertical;overflow-y:auto;min-height:36px;max-height:300px;border-bottom:2px solid #d1d5db;}" +
      ".editor-toolbar::-webkit-resizer{background:linear-gradient(135deg,transparent 50%,#4a6fa5 50%);width:14px;height:14px;}" +
      ".editor-toolbar::-webkit-scrollbar{width:6px;}" +
      ".editor-toolbar::-webkit-scrollbar-thumb{background:#c5cad3;border-radius:3px;}" +
      ".editor-toolbar button:hover{background:#eef2ff;border-color:#a5b4fc;}" +
      ".editor-toolbar button:active{background:#e0e7ff;}" +
      ".editor-toolbar .tb-group{display:flex;align-items:center;gap:3px;padding:0 4px;border-right:1px solid #e5e7eb;}" +
      ".editor-toolbar .tb-group:last-child{border-right:none;}" +
      ".img-selected{outline:2px solid #4a6fa5;}" +
      ".img-handle{position:absolute;width:9px;height:9px;background:#fff;border:1px solid #4a6fa5;z-index:50;}" +
      ".img-rotate{position:absolute;width:18px;height:18px;border-radius:50%;background:#4a6fa5;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:grab;z-index:50;}" +
      ".img-delete{position:absolute;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:50;top:-9px;right:-9px;}" +
      ".shape-box{display:inline-block;position:relative;}" +
      "@media print{.editor-toolbar,.nav-arrow,.nav-btn,.zoom-bar{display:none!important;}html,body{overflow:visible!important;height:auto!important;}.editor-content{overflow:visible!important;}.slide{display:block!important;page-break-after:always;break-after:page;}.slide:last-child{page-break-after:auto;break-after:auto;}}"
    );
  }

  function wrapEditorHtml(body, fontFamily, type) {
    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<style>" +
      "*{box-sizing:border-box;}" +
      "html,body{margin:0;padding:0;height:100%;font-family:" +
      fontFamily +
      ";color:#1f2937;background:#ffffff;transition:background .3s ease,color .3s ease;}" +
      "body *{transition:background-color .3s ease,color .3s ease,border-color .3s ease;}" +
      "body{display:flex;flex-direction:column;overflow:hidden;}" +
      "h1,h2,h3{color:#111827;margin:1em 0 .5em;}" +
      "p{margin:.5em 0;}" +
      "table{border-collapse:collapse;}" +
      "a{color:#2563eb;}" +
      "body.night{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .editor-content{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .editor-toolbar{background:#1a1a2e!important;border-bottom-color:#333!important;}" +
      "body.night .editor-toolbar button,body.night .editor-toolbar input,body.night .editor-toolbar select,body.night .editor-toolbar label{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night h1,body.night h2,body.night h3{color:#fff!important;}" +
      "body.night p,body.night span,body.night div,body.night li,body.night td,body.night th{color:#e0e0e0!important;}" +
      "body.night a{color:#8ab4f8!important;}" +
      "body.night table,body.night td,body.night th{border-color:#444!important;background:transparent!important;}" +
      "body.night .doc-body{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .doc-header{color:#e0e0e0!important;}" +
      "body.night .sheet-block{background:#1a1a2e!important;border-color:#444!important;}" +
      "body.night .sheet-name{color:#8ab4f8!important;border-bottom-color:#5a7fc4!important;}" +
      "body.night .media-player{background:#2a2a3e!important;border-color:#444!important;}" +
      "body.night .mp-play,body.night .mp-speed{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .mp-bar{background:#333!important;}" +
      "body.night .mp-fill{background:#5a7fc4!important;}" +
      "body.night .mp-cur,body.night .mp-dur{color:#9ca3af!important;}" +
      "body.night video{background:#000!important;}" +
      "body.night .audio-btn{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night input[type=range]{background:#333!important;}" +
      "body.night .hl{background:#5d4e00!important;color:#fff!important;}" +
      "body.night .img-selected{outline-color:#5a7fc4!important;}" +
      "body.night .img-handle{background:#2a2a3e!important;border-color:#5a7fc4!important;}" +
      "body.night .img-rotate{background:#5a7fc4!important;}" +
      "body.night .img-delete{background:#ef4444!important;color:#fff!important;}" +
      "body.night .editor-toolbar button:hover{background:#3a3a4e!important;border-color:#555!important;}" +
      "body.night .editor-toolbar button:active{background:#4a4a5e!important;}" +
      "body.night .editor-toolbar .tb-group{border-right-color:#444!important;}" +
      "body.night .editor-toolbar::-webkit-scrollbar-thumb{background:#555!important;}" +
      "body.night .editor-content::-webkit-scrollbar{width:8px;background:#1a1a2e!important;}" +
      "body.night .editor-content::-webkit-scrollbar-thumb{background:#444;border-radius:4px;}" +
      "body.night .editor-content::-webkit-scrollbar-track{background:#1a1a2e!important;}" +
      "body.night .shape-el{outline-color:#5a7fc4!important;}" +
      "body.night th{background:#2a2a3e!important;}" +
      "body.night ::-webkit-scrollbar{background:#1a1a2e!important;}" +
      "body.night ::-webkit-scrollbar-thumb{background:#444!important;border-radius:3px;}" +
      "body.night ::-webkit-scrollbar-track{background:#1a1a2e!important;}" +
      editorStyle() +
      "</style></head><body data-ext=\"" + type + "\">" +
      editorToolbarHtml(false) +
      '<div class="editor-content" contenteditable="true">' +
      body +
      "</div>" +
      "<script>" +
      editorScript() +
      "</script></body></html>"
    );
  }

  function wrapPptxEditorHtml(body, fontFamily) {
    body = body.replace(/<div class="slide-inner"/g, '<div class="slide-inner" contenteditable="true"');
    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<style>" +
      "*{box-sizing:border-box;margin:0;padding:0;}" +
      "html,body{width:100%;height:100%;font-family:" +
      fontFamily +
      ";transition:background .3s ease,color .3s ease;}" +
      "body *{transition:background-color .3s ease,color .3s ease,border-color .3s ease;}" +
      "body{display:flex;flex-direction:column;overflow:hidden;background:#fff;color:#1f2937;}" +
      ".slide-inner{cursor:text!important;user-select:text!important;-webkit-user-select:text!important;outline:none!important;}" +
      ".slide-inner *{cursor:text!important;user-select:text!important;-webkit-user-select:text!important;}" +
      ".slide-inner img,.slide-inner .media-player,.slide-inner .audio-btn{cursor:default!important;user-select:none!important;-webkit-user-select:none!important;}" +
      ".nav-arrow:hover{background:#f3f4f6;border-color:#9ca3af;}" +
      ".nav-arrow:active{background:#e5e7eb;}" +
      ".nav-arrow:disabled{opacity:.35;cursor:not-allowed;}" +
      ".nav-btn:hover{background:#f3f4f6;border-color:#9ca3af;}" +
      ".nav-btn:active{background:#e5e7eb;}" +
      ".nav-btn:disabled{opacity:.4;cursor:not-allowed;}" +
      ".pptx-root{flex:1;overflow:auto;}" +
      ".pptx-header,.pptx-footer,.pptx-progress,.nav-arrow,.nav-btn{pointer-events:auto;}" +
      "body.night{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .editor-content,body.night .pptx-content{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .editor-toolbar{background:#1a1a2e!important;border-bottom-color:#333!important;}" +
      "body.night .editor-toolbar button,body.night .editor-toolbar input,body.night .editor-toolbar select,body.night .editor-toolbar label{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .pptx-header,body.night .pptx-footer{background:#1a1a2e!important;color:#e0e0e0!important;}" +
      "body.night .pptx-header button,body.night .pptx-footer button,body.night .nav-arrow,body.night .nav-btn{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night p,body.night span,body.night div,body.night li,body.night td,body.night th{color:#e0e0e0!important;}" +
      "body.night h1,body.night h2,body.night h3{color:#fff!important;}" +
      "body.night table,body.night td,body.night th{border-color:#444!important;background:transparent!important;}" +
      "body.night .slide{background:#1a1a2e!important;color:#e0e0e0!important;}" +
      "body.night .slide-inner{background:#1a1a2e!important;}" +
      "body.night .slide-canvas{background:#1a1a2e!important;color:#9ca3af!important;}" +
      "body.night .slide-notes{background:#16162a!important;color:#9ca3af!important;border-top-color:#444!important;}" +
      "body.night .pptx-viewport{background:#1a1a2e!important;border-color:#444!important;}" +
      "body.night .pptx-progress{background:#333!important;}" +
      "body.night .pptx-progress-bar{background:#5a7fc4!important;}" +
      "body.night .pptx-stage{background:#0f0f1e!important;}" +
      "body.night .pptx-root{background:#0f0f1e!important;color:#e0e0e0!important;}" +
      "body.night .media-player{background:#2a2a3e!important;border-color:#444!important;}" +
      "body.night .mp-play,body.night .mp-speed{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night .mp-bar{background:#333!important;}" +
      "body.night .mp-fill{background:#5a7fc4!important;}" +
      "body.night .mp-cur,body.night .mp-dur{color:#9ca3af!important;}" +
      "body.night video{background:#000!important;}" +
      "body.night .audio-btn{background:#2a2a3e!important;color:#e0e0e0!important;border-color:#444!important;}" +
      "body.night input[type=range]{background:#333!important;}" +
      "body.night .hl{background:#5d4e00!important;color:#fff!important;}" +
      "body.night .img-selected{outline-color:#5a7fc4!important;}" +
      "body.night .img-handle{background:#2a2a3e!important;border-color:#5a7fc4!important;}" +
      "body.night .img-rotate{background:#5a7fc4!important;}" +
      "body.night .img-delete{background:#ef4444!important;color:#fff!important;}" +
      "body.night .editor-toolbar button:hover{background:#3a3a4e!important;border-color:#555!important;}" +
      "body.night .editor-toolbar button:active{background:#4a4a5e!important;}" +
      "body.night .editor-toolbar .tb-group{border-right-color:#444!important;}" +
      "body.night .editor-toolbar::-webkit-scrollbar-thumb{background:#555!important;}" +
      "body.night .editor-content::-webkit-scrollbar{width:8px;background:#1a1a2e!important;}" +
      "body.night .editor-content::-webkit-scrollbar-thumb{background:#444;border-radius:4px;}" +
      "body.night .editor-content::-webkit-scrollbar-track{background:#1a1a2e!important;}" +
      "body.night .shape-el{outline-color:#5a7fc4!important;}" +
      "body.night .nav-arrow:hover,body.night .nav-btn:hover{background:#3a3a4e!important;border-color:#555!important;}" +
      "body.night th{background:#2a2a3e!important;}" +
      "body.night ::-webkit-scrollbar{background:#1a1a2e!important;}" +
      "body.night ::-webkit-scrollbar-thumb{background:#444!important;border-radius:3px;}" +
      "body.night ::-webkit-scrollbar-track{background:#1a1a2e!important;}" +
      "body.night .slide-canvas::-webkit-scrollbar-thumb{background:#444!important;}" +
      editorStyle() +
      "</style></head><body data-ext=\"pptx\">" +
      editorToolbarHtml(true) +
      '<div class="editor-content pptx-content" contenteditable="true">' +
      body +
      "</div>" +
      "<script>" +
      editorScript() +
      ";" +
      mediaPlayerScript() +
      ";" +
      pptxNavScript() +
      "</script></body></html>"
    );
  }

  function editorScript() {
    return (
      "(function(){" +
      "try{" +
      "var content=document.querySelector('.editor-content');" +
      "var toolbar=document.querySelector('.editor-toolbar');" +
      "if(!content||!toolbar)return;" +
      "var selImg=null,overlay=null;" +
      "function focusContent(){try{var isPptx=document.body.dataset.ext==='pptx';if(isPptx){var slides=document.querySelectorAll('.slide');for(var i=0;i<slides.length;i++){if(slides[i].style.display!=='none'&&slides[i].style.display!==''){var si=slides[i].querySelector('.slide-inner');if(si){si.focus();return;}}}}content.focus();}else{content.focus();}}catch(e){}}" +
      "function exec(c,v){try{document.execCommand(c,false,v);}catch(e){}focusContent();}" +
      "function insertHTML(h){focusContent();try{document.execCommand('insertHTML',false,h);}catch(e){var s=window.getSelection();if(s.rangeCount){var r=s.getRangeAt(0);r.deleteContents();var t=document.createElement('div');t.innerHTML=h;var frag=document.createDocumentFragment();while(t.firstChild)frag.appendChild(t.firstChild);r.insertNode(frag);}}}" +
      "function applyStyle(prop,value){var s=window.getSelection();if(!s||!s.rangeCount)return;var r=s.getRangeAt(0);var sp=document.createElement('span');sp.style[prop]=value;try{sp.appendChild(r.extractContents());r.insertNode(sp);r.selectNodeContents(sp);s.removeAllRanges();s.addRange(r);}catch(e){}}" +
      "function selEl(){var s=window.getSelection();if(!s||!s.rangeCount)return null;var n=s.anchorNode;return n&&n.nodeType===3?n.parentElement:n;}" +
      "function changeSize(d){var el=selEl();if(!el)return;var fs=parseInt(getComputedStyle(el).fontSize)||16;applyStyle('fontSize',Math.max(6,fs+d)+'px');}" +
      "function setLineHeight(v){var el=selEl();if(el)el.style.lineHeight=v;}" +
      "function setFontSizePx(px){if(px>0)applyStyle('fontSize',px+'px');}" +
      "function insertImage(url){if(url){focusContent();try{document.execCommand('insertImage',false,url);}catch(e){var r=getSelection().getRangeAt(0);var img=document.createElement('img');img.src=url;r.insertNode(img);}initImages();}}" +
      "function uploadImage(file){if(!file)return;var reader=new FileReader();reader.onload=function(e){insertImage(e.target.result);};reader.readAsDataURL(file);}" +
      "function uploadAudio(file){if(!file)return;var reader=new FileReader();reader.onload=function(e){insertAudioBtn(e.target.result);};reader.readAsDataURL(file);}" +
      "function insertAudioBtn(url){if(!url)return;focusContent();var btn=document.createElement('button');btn.type='button';btn.contentEditable='false';btn.className='audio-btn';btn.dataset.url=url;btn.style.cssText='display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:1px solid #d1d5db;border-radius:20px;background:#fff;cursor:pointer;font-size:13px;color:#374151;margin:4px;user-select:none;-webkit-user-select:none;';btn.innerHTML='<span style=\"font-size:16px;\">🔊</span>音频';btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();showAudioPopup(btn.dataset.url);});insertHTML(btn.outerHTML);initAudioBtns();}" +
      "function showAudioPopup(url){var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;';var box=document.createElement('div');box.style.cssText='width:360px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.2);';var ph=document.createElement('div');ph.style.cssText='padding:12px 14px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;';ph.innerHTML='<span>音频播放</span>';var closeBtn=document.createElement('button');closeBtn.textContent='✕';closeBtn.style.cssText='border:none;background:none;cursor:pointer;font-size:14px;color:#9ca3af;';closeBtn.onclick=function(){document.body.removeChild(ov);};ph.appendChild(closeBtn);var aud=document.createElement('audio');aud.src=url;aud.style.display='none';var ctrl=document.createElement('div');ctrl.style.cssText='padding:14px;';var playBtn=document.createElement('button');playBtn.textContent='▶';playBtn.style.cssText='min-width:32px;height:32px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;color:#374151;flex-shrink:0;';var bar=document.createElement('div');bar.style.cssText='flex:1;height:8px;background:#e5e7eb;border-radius:4px;cursor:pointer;position:relative;min-width:60px;';var fill=document.createElement('div');fill.style.cssText='position:absolute;left:0;top:0;bottom:0;width:0;background:#4a6fa5;border-radius:4px;pointer-events:none;';bar.appendChild(fill);var cur=document.createElement('span');cur.style.cssText='color:#6b7280;min-width:36px;text-align:center;font-size:12px;font-variant-numeric:tabular-nums;flex-shrink:0;';cur.textContent='0:00';var dur=document.createElement('span');dur.style.cssText='color:#6b7280;min-width:36px;font-size:12px;font-variant-numeric:tabular-nums;flex-shrink:0;';dur.textContent='0:00';var speedBtn=document.createElement('button');var speeds=[0.25,0.5,0.75,1,1.25,1.5,1.75,2,5,10];var si=3;speedBtn.textContent=speeds[si]+'x';speedBtn.style.cssText='min-width:42px;height:32px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;color:#4a6fa5;flex-shrink:0;';function fmt(t){if(!isFinite(t))t=0;var m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+(s<10?'0':'')+s;}speedBtn.onclick=function(){si=(si+1)%speeds.length;speedBtn.textContent=speeds[si]+'x';aud.playbackRate=speeds[si];};playBtn.onclick=function(){if(aud.paused)aud.play();else aud.pause();};aud.addEventListener('play',function(){playBtn.textContent='❚❚';});aud.addEventListener('pause',function(){playBtn.textContent='▶';});aud.addEventListener('ended',function(){playBtn.textContent='▶';});aud.addEventListener('loadedmetadata',function(){dur.textContent=fmt(aud.duration);});aud.addEventListener('timeupdate',function(){var r=aud.duration>0?aud.currentTime/aud.duration:0;fill.style.width=(r*100)+'%';cur.textContent=fmt(aud.currentTime);});bar.addEventListener('click',function(e){if(aud.duration>0){var r=e.offsetX/bar.clientWidth;aud.currentTime=r*aud.duration;}});aud.playbackRate=speeds[si];var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;';row.appendChild(playBtn);row.appendChild(bar);row.appendChild(cur);var sep=document.createElement('span');sep.style.color='#9ca3af';sep.textContent='/';sep.style.flexShrink='0';row.appendChild(sep);row.appendChild(dur);row.appendChild(speedBtn);ctrl.appendChild(row);box.appendChild(ph);box.appendChild(aud);box.appendChild(ctrl);ov.appendChild(box);ov.addEventListener('click',function(e){if(e.target===ov)document.body.removeChild(ov);});document.body.appendChild(ov);}" +
      "function initAudioBtns(){content.querySelectorAll('.audio-btn').forEach(function(b){if(b.dataset.audinit)return;b.dataset.audinit='1';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();showAudioPopup(b.dataset.url);});});}" +
      "function insertTable(){var r=parseInt(prompt('行数:',3))||3;var c=parseInt(prompt('列数:',3))||3;if(r<1||c<1)return;var h='<table style=\"border-collapse:collapse;margin:8px 0;\">';for(var i=0;i<r;i++){h+='<tr>';for(var j=0;j<c;j++)h+='<td style=\"border:1px solid #d1d5db;padding:6px 10px;\">&nbsp;</td>';h+='</tr>';}h+='</table>';insertHTML(h);}" +
      "function createLink(){var url=prompt('链接URL:');if(!url)return;focusContent();try{document.execCommand('createLink',false,url);}catch(e){var s=window.getSelection();if(s.rangeCount){var r=s.getRangeAt(0);var a=document.createElement('a');a.href=url;a.appendChild(r.extractContents());r.insertNode(a);}}}" +
      "function insertTextbox(){insertHTML('<div style=\"display:inline-block;border:1px solid #9ca3af;padding:8px 12px;margin:4px;min-width:100px;min-height:40px;background:#fff;\">文本框</div>');}" +
      "function insertShape(){var shapes=['rect','circle','triangle','diamond','star','heart','arrow','line','cross','ellipse'];var names=['矩形','圆形','三角','菱形','星形','心形','箭头','直线','十字','椭圆'];var s=prompt('选择形状:'+names.join('/')+'.输入英文','rect');if(!s||shapes.indexOf(s)<0)return;insertShapeEl(s);}" +
      "function insertHR(){insertHTML('<hr style=\"border:none;border-top:2px solid #d1d5db;margin:12px 0;\">');}" +
      "function shapeHTML(s,color){var c=color||'#4a6fa5';var css='display:inline-block;width:80px;height:80px;vertical-align:middle;';if(s==='rect')return'<div class=\"shape-el\" data-shape=\"rect\" style=\"'+css+'background:'+c+';\"></div>';if(s==='circle')return'<div class=\"shape-el\" data-shape=\"circle\" style=\"'+css+'background:'+c+';border-radius:50%;\"></div>';if(s==='ellipse')return'<div class=\"shape-el\" data-shape=\"ellipse\" style=\"'+css+'background:'+c+';border-radius:50%;width:100px;height:60px;\"></div>';if(s==='triangle')return'<div class=\"shape-el\" data-shape=\"triangle\" style=\"'+css+'border-left:40px solid transparent;border-right:40px solid transparent;border-bottom:70px solid '+c+';background:transparent;width:0;height:0;\"></div>';if(s==='diamond')return'<div class=\"shape-el\" data-shape=\"diamond\" style=\"'+css+'background:'+c+';transform:rotate(45deg);width:60px;height:60px;\"></div>';if(s==='star')return'<div class=\"shape-el\" data-shape=\"star\" style=\"'+css+'color:'+c+';font-size:72px;line-height:80px;text-align:center;\">★</div>';if(s==='heart')return'<div class=\"shape-el\" data-shape=\"heart\" style=\"'+css+'color:'+c+';font-size:72px;line-height:80px;text-align:center;\">♥</div>';if(s==='arrow')return'<div class=\"shape-el\" data-shape=\"arrow\" style=\"'+css+'color:'+c+';font-size:64px;line-height:80px;text-align:center;\">→</div>';if(s==='line')return'<div class=\"shape-el\" data-shape=\"line\" style=\"display:inline-block;width:100px;height:4px;background:'+c+';vertical-align:middle;\"></div>';if(s==='cross')return'<div class=\"shape-el\" data-shape=\"cross\" style=\"'+css+'color:'+c+';font-size:72px;line-height:80px;text-align:center;\">✚</div>';return'';}" +
      "function insertShapeEl(s){var html=shapeHTML(s,'#4a6fa5');if(html)insertHTML(html);initShapes();}" +
      "function findReplace(){var f=prompt('查找:');if(f===null||f==='')return;var mode=prompt('模式: 查找=1 替换=2','1');if(mode==='2'){var r=prompt('替换为:');if(r===null)return;content.innerHTML=content.innerHTML.split(f).join(r);return;}var found=window.find(f,false,false,true,false,true,true);if(!found){alert('未找到: '+f);}else{var s=window.getSelection();if(s.rangeCount){var el=s.anchorNode;while(el&&el.nodeType!==1)el=el.parentNode;if(el)el.scrollIntoView({behavior:'smooth',block:'center'});}}}" +
      "function toggleNight(){var n=!document.body.classList.contains('night');document.body.classList.toggle('night',n);}" +
      "function insertSymbol(){var syms=['α','β','γ','δ','ε','π','Σ','Ω','∞','≈','≠','≤','≥','±','×','÷','√','∫','∑','→'];var s=prompt('符号('+syms.join(' ')+'):','π');if(s)insertHTML(s);}" +
      "function blobToDataURL(blob){return new Promise(function(res){var r=new FileReader();r.onload=function(){res(r.result);};r.readAsDataURL(blob);});}" +
      "async function imgToDataURL(img){var s=img.getAttribute('src');if(!s)return '';if(s.indexOf('data:')===0)return s;if(s.indexOf('blob:')===0){try{var b=await fetch(s).then(function(r){return r.blob();});return await blobToDataURL(b);}catch(e){return '';}}return s;}" +
      "function getExt(){return document.body.getAttribute('data-ext')||'html';}" +
      "function askName(def){var n=prompt('导出文件名:',def);if(n===null)return null;n=n.trim()||def;if(/\\.[a-z0-9]+$/i.test(n))n=n.replace(/\\.[a-z0-9]+$/i,'');return n;}" +
      "async function imgToDataURLAsync(img){var s=img.getAttribute('src');if(!s)return '';if(s.indexOf('data:')===0)return s;if(s.indexOf('blob:')===0){try{var b=await fetch(s).then(function(r){return r.blob();});return await blobToDataURL(b);}catch(e){return '';}}return s;}" +
      "async function exportDoc(){var ext=getExt();var defName={'docx':'document','xlsx':'spreadsheet','pptx':'presentation'}[ext]||'document';var name=askName(defName);if(!name)return;var imgs=content.querySelectorAll('img');for(var i=0;i<imgs.length;i++){var du=await imgToDataURLAsync(imgs[i]);if(du){imgs[i].setAttribute('data-export-src',du);}}var html=content.innerHTML;parent.postMessage({__export:true,action:'exportFile',ext:ext,content:html,name:name},'*');}" +
      "function printDoc(){var isPptx=document.body.dataset.ext==='pptx';var content=document.querySelector('.editor-content')||document.body;var pf=document.createElement('iframe');pf.style.cssText='position:fixed;left:-99999px;top:0;width:800px;height:600px;border:0;background:#fff;';document.body.appendChild(pf);var pdoc=pf.contentDocument;pdoc.open();pdoc.write('<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>@media print{html,body{margin:0;padding:0;}.slide{page-break-after:always;}}</style></head><body></body></html>');pdoc.close();pdoc.body.innerHTML=content.innerHTML;var imgs=pdoc.body.querySelectorAll('img');for(var i=0;i<imgs.length;i++){var du=imgs[i].getAttribute('data-export-src')||imgs[i].getAttribute('src');if(du)imgs[i].src=du;}pf.contentWindow.focus();setTimeout(function(){pf.contentWindow.print();setTimeout(function(){document.body.removeChild(pf);},500);},300);}" +
      "toolbar.addEventListener('click',function(e){" +
      "var el=e.target.closest('[data-cmd]');" +
      "if(!el)return;" +
      "var tag=el.tagName.toLowerCase();" +
      "if(tag==='select'||tag==='input')return;" +
      "var c=el.dataset.cmd;" +
      "switch(c){" +
      "case'sizeUp':changeSize(2);break;" +
      "case'sizeDown':changeSize(-2);break;" +
      "case'uploadImageBtn':document.getElementById('imgFileInput').click();break;" +
      "case'uploadAudioBtn':document.getElementById('audioFileInput').click();break;" +
      "case'insertTable':insertTable();break;" +
      "case'createLink':createLink();break;" +
      "case'insertTextbox':insertTextbox();break;" +
      "case'insertShape':insertShape();break;" +
      "case'insertHR':insertHR();break;" +
      "case'findReplace':findReplace();break;" +
      "case'toggleNight':toggleNight();break;" +
      "case'insertSymbol':insertSymbol();break;" +
      "case'addSlide':if(window._pptxAddSlide)window._pptxAddSlide();break;" +
      "case'exportDoc':exportDoc();break;" +
      "case'printDoc':printDoc();break;" +
      "default:exec(c);" +
      "}" +
      "e.preventDefault();" +
      "});" +
      "var savedSel=null;" +
      "function saveSel(){var s=window.getSelection();if(s&&s.rangeCount>0){savedSel=s.getRangeAt(0).cloneRange();}}" +
      "function restoreSel(){if(savedSel){var s=window.getSelection();s.removeAllRanges();s.addRange(savedSel);}}" +
      "toolbar.addEventListener('mousedown',function(e){var el=e.target.closest('[data-cmd]');if(el&&el.tagName==='BUTTON'){saveSel();}});" +
      "toolbar.addEventListener('change',function(e){" +
      "var el=e.target;" +
      "if(!el.dataset||!el.dataset.cmd)return;" +
      "var c=el.dataset.cmd,v=el.value;" +
      "if(el.type==='file'){if(el.files&&el.files[0]){if(c==='uploadAudio')uploadAudio(el.files[0]);else uploadImage(el.files[0]);}el.value='';return;}" +
      "if(!v)return;" +
      "restoreSel();" +
      "if(c==='lineHeight')setLineHeight(v);" +
      "else if(c==='fontSizeInput')setFontSizePx(parseInt(v));" +
      "else exec(c,v);" +
      "saveSel();" +
      "});" +
      "toolbar.addEventListener('input',function(e){" +
      "var el=e.target;" +
      "if(el.type==='color'&&el.dataset&&el.dataset.cmd){restoreSel();exec(el.dataset.cmd,el.value);saveSel();}" +
      "});" +
      "function clearHandles(){if(overlay){try{overlay.remove();}catch(e){}overlay=null;}if(selImg){selImg.classList.remove('img-selected');selImg=null;}}" +
      "function selectImage(img){clearHandles();selImg=img;img.classList.add('img-selected');var rect=img.getBoundingClientRect();var cRect=content.getBoundingClientRect();var ox=rect.left-cRect.left+content.scrollLeft;var oy=rect.top-cRect.top+content.scrollTop;overlay=document.createElement('div');overlay.style.cssText='position:absolute;left:'+ox+'px;top:'+oy+'px;width:'+rect.width+'px;height:'+rect.height+'px;pointer-events:none;z-index:200;';var cs='position:absolute;width:9px;height:9px;background:#fff;border:1px solid #4a6fa5;pointer-events:auto;';var pos=[['nw','-4px','-4px','nwse-resize'],['n',(rect.width/2-4)+'px','-4px','ns-resize'],['ne',(rect.width-5)+'px','-4px','nesw-resize'],['e',(rect.width-5)+'px',(rect.height/2-4)+'px','ew-resize'],['se',(rect.width-5)+'px',(rect.height-5)+'px','nwse-resize'],['s',(rect.width/2-4)+'px',(rect.height-5)+'px','ns-resize'],['sw','-4px',(rect.height-5)+'px','nesw-resize'],['w','-4px',(rect.height/2-4)+'px','ew-resize']];for(var i=0;i<pos.length;i++){var h=document.createElement('div');h.style.cssText='left:'+pos[i][1]+';top:'+pos[i][2]+';cursor:'+pos[i][3]+';'+cs;(function(hd,p){hd.addEventListener('mousedown',function(e){e.preventDefault();e.stopPropagation();var sx=e.clientX,sy=e.clientY;var sw=selImg.offsetWidth,sh=selImg.offsetHeight;function mv(ev){var dx=ev.clientX-sx,dy=ev.clientY-sy;var nw=sw,nh=sh;if(p.indexOf('e')>=0)nw=Math.max(20,sw+dx);if(p.indexOf('w')>=0)nw=Math.max(20,sw-dx);if(p.indexOf('s')>=0)nh=Math.max(20,sh+dy);if(p.indexOf('n')>=0)nh=Math.max(20,sh-dy);selImg.style.width=nw+'px';selImg.style.height=nh+'px';selectImage(selImg);}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});})(h,pos[i][0]);overlay.appendChild(h);}var rot=document.createElement('div');rot.style.cssText='left:'+(rect.width/2-9)+'px;top:-30px;'+cs+'width:18px;height:18px;border-radius:50%;background:#4a6fa5;color:#fff;display:flex;align-items:center;justify-content:center;cursor:grab;font-size:11px;';rot.textContent='↻';rot.addEventListener('mousedown',function(e){e.preventDefault();e.stopPropagation();var r=selImg.getBoundingClientRect();var cx=r.left+r.width/2,cy=r.top+r.height/2;function mv(ev){var ang=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI+90;selImg.style.transform='rotate('+ang+'deg)';}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});overlay.appendChild(rot);var del=document.createElement('div');del.style.cssText='right:-9px;top:-9px;'+cs+'width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;';del.textContent='×';del.addEventListener('mousedown',function(e){e.stopPropagation();});del.addEventListener('click',function(e){e.stopPropagation();img.remove();clearHandles();});overlay.appendChild(del);content.appendChild(overlay);}" +
      "content.addEventListener('click',function(e){var img=e.target.closest('img');var sh=e.target.closest('.shape-el');if(sh){selectShape(sh);return;}if(img){e.preventDefault();selectImage(img);}else{clearHandles();clearShape();}});" +
      "function initImages(){content.querySelectorAll('img').forEach(function(img){if(img.dataset.init)return;img.dataset.init='1';img.contentEditable='false';img.style.webkitUserSelect='none';img.style.userSelect='none';img.addEventListener('click',function(e){e.preventDefault();selectImage(img);});});}" +
      "var selShape=null,shapeOverlay=null;" +
      "function clearShape(){if(shapeOverlay){shapeOverlay.remove();shapeOverlay=null;}if(selShape){selShape.style.outline='';selShape=null;}}" +
      "function selectShape(sh){clearShape();clearHandles();selShape=sh;sh.style.outline='2px dashed #4a6fa5';var rect=sh.getBoundingClientRect();var cRect=content.getBoundingClientRect();var ox=rect.left-cRect.left+content.scrollLeft;var oy=rect.top-cRect.top+content.scrollTop;shapeOverlay=document.createElement('div');shapeOverlay.style.cssText='position:absolute;left:'+ox+'px;top:'+oy+'px;width:'+rect.width+'px;height:'+rect.height+'px;pointer-events:none;z-index:200;';var cs='position:absolute;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:#fff;pointer-events:auto;';var colorBtn=document.createElement('div');colorBtn.style.cssText='left:-11px;top:-11px;'+cs+'background:#4a6fa5;';colorBtn.textContent='🎨';colorBtn.title='颜色';colorBtn.addEventListener('mousedown',function(e){e.stopPropagation();});colorBtn.addEventListener('click',function(e){e.stopPropagation();var col=prompt('颜色(如 #ff0000 或 red):',sh.style.background||sh.style.color);if(col){var s=sh.dataset.shape;if(s==='star'||s==='heart'||s==='arrow'||s==='cross')sh.style.color=col;else sh.style.background=col;selectShape(sh);}});shapeOverlay.appendChild(colorBtn);var delBtn=document.createElement('div');delBtn.style.cssText='right:-11px;top:-11px;'+cs+'background:#ef4444;';delBtn.textContent='×';delBtn.title='删除';delBtn.addEventListener('mousedown',function(e){e.stopPropagation();});delBtn.addEventListener('click',function(e){e.stopPropagation();sh.remove();clearShape();});shapeOverlay.appendChild(delBtn);var resizeBtn=document.createElement('div');resizeBtn.style.cssText='right:-11px;bottom:-11px;'+cs+'background:#10b981;';resizeBtn.textContent='↘';resizeBtn.title='缩放';resizeBtn.addEventListener('mousedown',function(e){e.preventDefault();e.stopPropagation();var sx=e.clientX,sy=e.clientY;var sw=sh.offsetWidth,sh2=sh.offsetHeight;function mv(ev){var dx=ev.clientX-sx,dy=ev.clientY-sy;var nw=Math.max(20,sw+dx),nh=Math.max(20,sh2+dy);sh.style.width=nw+'px';sh.style.height=nh+'px';selectShape(sh);}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});shapeOverlay.appendChild(resizeBtn);content.appendChild(shapeOverlay);}" +
      "function initShapes(){content.querySelectorAll('.shape-el').forEach(function(sh){if(sh.dataset.init2)return;sh.dataset.init2='1';sh.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();selectShape(sh);});sh.addEventListener('mousedown',function(e){if(e.target!==sh)return;if(selShape!==sh)return;e.preventDefault();var sx=e.clientX,sy=e.clientY;var ox=sh.offsetLeft,oy=sh.offsetTop;function mv(ev){sh.style.position='relative';sh.style.left=(ox+ev.clientX-sx)+'px';sh.style.top=(oy+ev.clientY-sy)+'px';selectShape(sh);}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);});});}" +
      "initImages();initShapes();initAudioBtns();" +
      "content.addEventListener('scroll',function(){if(selImg)selectImage(selImg);if(selShape)selectShape(selShape);});" +
      "window.addEventListener('resize',function(){if(selImg)selectImage(selImg);if(selShape)selectShape(selShape);});" +
      "}catch(err){console.error('Editor init error:',err);}" +
      "})();"
    );
  }

  function pptxNavScript() {
    return (
      "(function(){" +
      "var idx=0;" +
      "var ind=document.getElementById('indicator');" +
      "var counter=document.getElementById('counter');" +
      "var progressBar=document.getElementById('progressBar');" +
      "var prevBtn=document.getElementById('prevBtn');" +
      "var nextBtn=document.getElementById('nextBtn');" +
      "var prevBtn2=document.getElementById('prevBtn2');" +
      "var nextBtn2=document.getElementById('nextBtn2');" +
      "var firstBtn=document.querySelector('[data-action=first]');" +
      "var lastBtn=document.querySelector('[data-action=last]');" +
      "var userZoom=1;" +
      "var zoomInp=document.getElementById('pptxZoom');" +
      "var zoomVal=document.getElementById('pptxZoomVal');" +
      "var notesBtn=document.getElementById('notesBtn');" +
      "var notesVisible=false;" +
      "function getSlides(){return document.querySelectorAll('.slide');}" +
      "function setNotes(v){notesVisible=v;getSlides().forEach(function(s){var n=s.querySelector('.slide-notes');if(n){n.style.display=v?'block':'none';if(v&&n.scrollHeight>n.clientHeight)n.style.overflowY='auto';}});if(notesBtn)notesBtn.style.background=v?'#eef2ff':'#fff';}" +
      "if(notesBtn)notesBtn.addEventListener('click',function(){setNotes(!notesVisible);});" +
      "function fitSlide(slide){" +
      "var inner=slide.querySelector('.slide-inner');" +
      "if(!inner)return;" +
      "var sw=parseFloat(slide.dataset.w)||960;" +
      "var sh=parseFloat(slide.dataset.h)||720;" +
      "var vw=slide.clientWidth;" +
      "var vh=slide.clientHeight;" +
      "var fit=Math.min(vw/sw,vh/sh);" +
      "var scale=fit*userZoom;" +
      "inner.style.transform='scale('+scale+')';" +
      "inner.style.left=((vw-sw*scale)/2)+'px';" +
      "inner.style.top=((vh-sh*scale)/2)+'px';" +
      "}" +
      "function fitAll(){getSlides().forEach(function(s){if(s.style.display!=='none')fitSlide(s);});}" +
      "if(zoomInp){zoomInp.addEventListener('input',function(){userZoom=parseInt(zoomInp.value)/100;if(zoomVal)zoomVal.textContent=zoomInp.value+'%';fitAll();});}" +
      "function show(i){" +
      "var slides=getSlides();var total=slides.length;" +
      "if(total===0)return;" +
      "if(i<0)i=0;if(i>=total)i=total-1;" +
      "slides[idx].style.display='none';" +
      "idx=i;" +
      "slides[idx].style.display='block';" +
      "fitSlide(slides[idx]);" +
      "var label=(idx+1)+' / '+total;" +
      "if(ind)ind.textContent=label;" +
      "if(counter)counter.textContent=label;" +
      "if(progressBar)progressBar.style.width=((idx+1)/total*100)+'%';" +
      "var atFirst=(idx===0),atLast=(idx===total-1);" +
      "if(prevBtn)prevBtn.disabled=atFirst;" +
      "if(nextBtn)nextBtn.disabled=atLast;" +
      "if(prevBtn2)prevBtn2.disabled=atFirst;" +
      "if(nextBtn2)nextBtn2.disabled=atLast;" +
      "setTimeout(function(){var cs=slides[idx].querySelectorAll('.media-player:not([data-mpinited])');cs.forEach(function(p){if(window._initMP)window._initMP(p);});},50);" +
      "}" +
      "function addSlide(){" +
      "var viewport=document.querySelector('.pptx-viewport');" +
      "if(!viewport)return;" +
      "var slides=getSlides();var newIdx=slides.length;" +
      "var existing=slides[0];var sw=existing?parseFloat(existing.dataset.w)||960:960;var sh=existing?parseFloat(existing.dataset.h)||720:720;" +
      "var sld=document.createElement('div');" +
      "sld.className='slide';sld.id='slide-'+(newIdx+1);sld.dataset.w=sw;sld.dataset.h=sh;" +
      "sld.style.cssText='display:none;width:100%;height:100%;position:relative;overflow:hidden;background:#ffffff;';" +
      "var inner=document.createElement('div');" +
      "inner.className='slide-inner';" +
      "inner.setAttribute('contenteditable','true');" +
      "inner.style.cssText='position:absolute;left:0;top:0;width:'+sw+'px;height:'+sh+'px;transform-origin:top left;cursor:text;outline:none;';" +
      "inner.innerHTML='<div style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9ca3af;font-size:14px;cursor:text;\">点击此处开始编辑</div>';" +
      "sld.appendChild(inner);" +
      "viewport.appendChild(sld);" +
      "if(notesVisible){var ns=sld.querySelector('.slide-notes');if(ns)ns.style.display='block';}" +
      "show(newIdx);" +
      "setTimeout(function(){inner.focus();},100);" +
      "}" +
      "window._pptxShow=show;window._pptxAddSlide=addSlide;window._pptxFitAll=fitAll;" +
      "if(prevBtn)prevBtn.onclick=function(){show(idx-1);};" +
      "if(nextBtn)nextBtn.onclick=function(){show(idx+1);};" +
      "if(prevBtn2)prevBtn2.onclick=function(){show(idx-1);};" +
      "if(nextBtn2)nextBtn2.onclick=function(){show(idx+1);};" +
      "if(firstBtn)firstBtn.onclick=function(){show(0);};" +
      "if(lastBtn)lastBtn.onclick=function(){show(getSlides().length-1);};" +
      "document.addEventListener('keydown',function(e){" +
      "if(e.key==='ArrowRight')show(idx+1);" +
      "else if(e.key==='ArrowLeft')show(idx-1);" +
      "else if(e.key==='Home')show(0);" +
      "else if(e.key==='End')show(getSlides().length-1);" +
      "});" +
      "window.addEventListener('resize',fitAll);" +
      "show(0);" +
      "setTimeout(fitAll,100);" +
      "window.addEventListener('message',function(e){" +
      "if(e.data&&e.data.type==='GO_TO_SLIDE'){show(e.data.slideNumber-1);}" +
      "});" +
      "})();"
    );
  }

  async function renderDOCX(arrayBuffer, fontFamily) {
    const ok = await loadAPI("mammoth");
    if (!ok || typeof mammoth === "undefined") throw new Error("mammoth 加载失败");
    var fontMap = {};
    try {
      const ok2 = await loadAPI("jszip");
      if (ok2 && typeof JSZip !== "undefined") {
        const z = await JSZip.loadAsync(arrayBuffer);
        const f = z.file("word/fontTable.xml");
        if (f) {
          const s = await f.async("string");
          const re = /<w:font[^>]*w:name="([^"]+)"[^>]*>([\s\S]*?)<\/w:font>/g;
          let m;
          while ((m = re.exec(s)) !== null) {
            const name = m[1];
            const inner = m[2];
            const csMatch = inner.match(/w:cs="([^"]+)"/) || inner.match(/w:ascii="([^"]+)"/);
            if (csMatch && csMatch[1]) fontMap[name.toLowerCase()] = csMatch[1];
          }
        }
      }
    } catch (e) {}
    const result = await mammoth.convertToHtml({
      arrayBuffer,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
        "p[style-name='List Paragraph'] => p.list:fresh",
        "r[style-name='Hyperlink'] => a:fresh",
      ],
      transformDocument: function (element) {
        if (element.type === "run" && element.font && fontMap[element.font.toLowerCase()]) {
          element.font = fontMap[element.font.toLowerCase()];
        }
        if (element.type === "run" && element.highlight) {
          element.children = [{ type: "text", value: element.children.map(c => c.value || "").join("") }];
          element.style = "background-color: " + (
            element.highlight === "yellow" ? "#ffeb3b" :
            element.highlight === "green" ? "#a5d6a7" :
            element.highlight === "red" ? "#ef9a9a" :
            element.highlight === "blue" ? "#90caf9" :
            element.highlight === "cyan" ? "#80deea" :
            element.highlight === "magenta" ? "#f48fb1" :
            "#ffeb3b"
          ) + "; padding: 1px 2px;";
          delete element.highlight;
        }
        return element;
      },
    });
    let html = result.value;
    html = html.replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;margin:8px 0;">');
    html = html.replace(/<td>/g, '<td style="border:1px solid #d1d5db;padding:6px 10px;">');
    html = html.replace(/<th>/g, '<th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;font-weight:600;">');
    const textContent = result.value.replace(/<[^>]*>/g, " ");
    const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;
    const scaled = scaleDocxFonts(html);
    var fontChain = "'宋体,SimSun,serif','微软雅黑,Microsoft YaHei,sans-serif','黑体,SimHei,sans-serif','楷体,KaiTi,serif',system-ui,-apple-system,'Segoe UI',sans-serif";
    const body = '<div class="doc-body" style="padding:16px;line-height:1.5;font-family:' + fontChain + ';">' + scaled + "</div>";
    return { bodyHtml: body, numPages: 1, wordCount, pageContents: [textContent] };
  }

  async function renderPPTX(arrayBuffer, fontFamily) {
    const ok = await loadAPI("jszip");
    if (!ok || typeof JSZip === "undefined") throw new Error("JSZip 加载失败");
    const zip = await JSZip.loadAsync(arrayBuffer);
    let slideW = 9144000,
      slideH = 6858000;
    try {
      const pres = await zip.file("ppt/presentation.xml").async("string");
      const sz = pres.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
      if (sz) {
        slideW = parseInt(sz[1], 10);
        slideH = parseInt(sz[2], 10);
      }
    } catch (e) {}
    const slideFiles = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)[0], 10);
        const nb = parseInt(b.match(/\d+/)[0], 10);
        return na - nb;
      });
    const media = {};
    for (const f of Object.keys(zip.files)) {
      if (/^ppt\/media\//.test(f)) {
        try {
          const blob = await zip.file(f).async("blob");
          media[f] = URL.createObjectURL(blob);
        } catch (e) {}
      }
    }
    const numSlides = slideFiles.length;
    const pageContents = [];
    let totalWordCount = 0;
    let slidesHtml = "";
    for (let i = 0; i < numSlides; i++) {
      try {
        const xml = await zip.file(slideFiles[i]).async("string");
        const relsFile = slideFiles[i].replace("slides/slide", "slides/_rels/slide") + ".rels";
        const relsXml = zip.file(relsFile) ? await zip.file(relsFile).async("string") : "";
        const relMap = {};
        for (const m of relsXml.matchAll(/<Relationship\s+([^>]*?)\/?>/g)) {
          const attrs = m[1];
          const idM = attrs.match(/\bId="([^"]+)"/);
          const tgtM = attrs.match(/\bTarget="([^"]+)"/);
          const typeM = attrs.match(/\bType="([^"]+)"/);
          if (idM && tgtM) {
            relMap[idM[1]] = { target: tgtM[1], type: typeM ? typeM[1] : "" };
          }
        }
        const slideData = extractSlideContent(xml, media, relMap, slideW, slideH);
        let notesText = "";
        for (const rid in relMap) {
          if (/notesSlide/i.test(relMap[rid].type)) {
            let npath = relMap[rid].target;
            if (npath.startsWith("../")) npath = "ppt/" + npath.slice(3);
            else if (!npath.startsWith("ppt/")) npath = "ppt/notesSlides/" + npath.split("/").pop();
            const nf = zip.file(npath);
            if (nf) {
              try {
                const nxml = await nf.async("string");
                const texts = [...nxml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]);
                notesText = texts.join("\n").trim();
              } catch (e) {}
            }
            break;
          }
        }
        slideData.notes = notesText;
        pageContents.push(slideData.plainText);
        totalWordCount += slideData.plainText.split(/\s+/).filter((w) => w.length > 0).length;
        slidesHtml += buildSlideHtml(slideData, i, numSlides);
      } catch (e) {
        console.warn("PPTX 第 " + (i + 1) + " 页解析失败:", e);
        slidesHtml += buildEmptySlideHtml(i + 1);
      }
    }
    const body = buildPptxUI(slidesHtml, numSlides);
    return { bodyHtml: body, numPages: numSlides, wordCount: totalWordCount, pageContents };
  }

  function resolveMediaUrl(target, media) {
    if (!target) return null;
    let path = target;
    if (path.startsWith("../")) path = "ppt/" + path.slice(3);
    else if (path.startsWith("/")) path = path.slice(1);
    else if (!path.startsWith("ppt/")) path = "ppt/media/" + path.split("/").pop();
    const candidates = [
      path,
      "ppt/media/" + path.split("/").pop(),
      path.replace(/^ppt\//, "ppt/"),
    ];
    for (const c of candidates) {
      if (media[c]) return media[c];
    }
    return null;
  }

  const PPTX_FONT_MAP = {
    "宋体": "SimSun, serif", "SimSun": "SimSun, serif", "宋体": "SimSun, serif",
    "黑体": "SimHei, sans-serif", "SimHei": "SimHei, sans-serif",
    "微软雅黑": "Microsoft YaHei, sans-serif", "Microsoft YaHei": "Microsoft YaHei, sans-serif",
    "楷体": "KaiTi, serif", "KaiTi": "KaiTi, serif", "STKaiti": "KaiTi, serif",
    "仿宋": "FangSong, serif", "FangSong": "FangSong, serif", "STFangsong": "FangSong, serif",
    "Arial": "Arial, sans-serif", "Helvetica": "Arial, sans-serif",
    "Times New Roman": "'Times New Roman', serif", "Times": "'Times New Roman', serif",
    "Calibri": "Calibri, sans-serif", "Cambria": "Cambria, serif",
    "Calibri Light": "Calibri, sans-serif",
    "Courier New": "'Courier New', monospace",
    "Georgia": "Georgia, serif",
    "Verdana": "Verdana, sans-serif", "Tahoma": "Tahoma, sans-serif",
    "Trebuchet MS": "'Trebuchet MS', sans-serif",
    "DengXian": "DengXian, sans-serif", "等线": "DengXian, sans-serif",
    "等线 Light": "DengXian, sans-serif",
  };
  function mapPptxFont(name) {
    if (!name) return "";
    if (PPTX_FONT_MAP[name]) return PPTX_FONT_MAP[name];
    const lower = name.toLowerCase();
    for (const k in PPTX_FONT_MAP) {
      if (k.toLowerCase() === lower) return PPTX_FONT_MAP[k];
    }
    return name + ", sans-serif";
  }

  function extractSlideContent(xml, media, relMap, slideW, slideH) {
    const emuToPx = 96 / 914400;
    const shapes = [];
    const spBlocks = [...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map((m) => m[0]);
    for (const block of spBlocks) {
      const xfrmM = block.match(/<a:xfrm\b[\s\S]*?<\/a:xfrm>/);
      let x = 0, y = 0, cx = 0, cy = 0;
      if (xfrmM) {
        const offM = xfrmM[0].match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
        const extM = xfrmM[0].match(/<a:ext\s+cx="(-?\d+)"\s+cy="(-?\d+)"/);
        if (offM) { x = parseInt(offM[1]) * emuToPx; y = parseInt(offM[2]) * emuToPx; }
        if (extM) { cx = parseInt(extM[1]) * emuToPx; cy = parseInt(extM[2]) * emuToPx; }
      }
      const txBody = block.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
      if (txBody) {
        const paragraphs = [];
        const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g;
        let pm;
        while ((pm = pRegex.exec(txBody[1])) !== null) {
          const pInner = pm[1];
          const pPrM = pInner.match(/<a:pPr\b([^>]*)>/);
          let align = "left";
          if (pPrM) {
            const alM = pPrM[1].match(/\balgn="([^"]+)"/);
            if (alM) align = alM[1];
          }
          let defSz = 0, defFont = "";
          const defRprM = pInner.match(/<a:defRPr\b[^>]*\bsz="(\d+)"/);
          if (defRprM) defSz = parseInt(defRprM[1]);
          const defFontM = pInner.match(/<a:defRPr\b[^>]*>([\s\S]*?)<\/a:defRPr>/);
          if (defFontM) {
            const latinM = defFontM[1].match(/<a:latin\s+typeface="([^"]+)"/);
            if (latinM) defFont = latinM[1];
          }
          const runs = [];
          const rRegex = /<a:r\b[^>]*>([\s\S]*?)<\/a:r>/g;
          let rm;
          while ((rm = rRegex.exec(pInner)) !== null) {
            const rInner = rm[1];
            const tMatch = rInner.match(/<a:t>([\s\S]*?)<\/a:t>/);
            if (!tMatch) continue;
            const text = tMatch[1];
            const rprMatch = rInner.match(/<a:rPr\b([^>]*)>/);
            let sz = defSz, bold = false, color = "", italic = false, font = defFont;
            if (rprMatch) {
              const attrs = rprMatch[1];
              const szM = attrs.match(/\bsz="(\d+)"/);
              if (szM) sz = parseInt(szM[1]);
              bold = /\bb="1"/.test(attrs);
              italic = /\bi="1"/.test(attrs);
              const solidM = rInner.match(/<a:solidFill>\s*<a:srgbClr\s+val="([0-9a-fA-F]{6})"/);
              if (solidM) color = solidM[1];
              const rprBlockMatch = rInner.match(/<a:rPr\b[^>]*>([\s\S]*?)<\/a:rPr>/);
              if (rprBlockMatch) {
                const latinM = rprBlockMatch[1].match(/<a:latin\s+typeface="([^"]+)"/);
                if (latinM) font = latinM[1];
              }
            }
            runs.push({ text, sz, bold, color, italic, font });
          }
          const hasBullet = /<a:buChar/.test(pInner) || /<a:buAutoNum/.test(pInner);
          paragraphs.push({ runs, align, hasBullet });
        }
        shapes.push({ type: "text", x, y, cx, cy, paragraphs });
      }
    }
    const picBlocks = [...xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)].map((m) => m[0]);
    for (const block of picBlocks) {
      const xfrmM = block.match(/<a:xfrm\b[\s\S]*?<\/a:xfrm>/);
      let x = 0, y = 0, cx = 0, cy = 0;
      if (xfrmM) {
        const offM = xfrmM[0].match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/);
        const extM = xfrmM[0].match(/<a:ext\s+cx="(-?\d+)"\s+cy="(-?\d+)"/);
        if (offM) { x = parseInt(offM[1]) * emuToPx; y = parseInt(offM[2]) * emuToPx; }
        if (extM) { cx = parseInt(extM[1]) * emuToPx; cy = parseInt(extM[2]) * emuToPx; }
      }
      const audioM = block.match(/<a:audioFile\b[^>]*?r:(?:link|embed)="([^"]+)"/);
      const videoM = block.match(/<a:videoFile\b[^>]*?r:(?:link|embed)="([^"]+)"/);
      let mediaKind = null, mediaRid = null;
      if (audioM) { mediaKind = "audio"; mediaRid = audioM[1]; }
      else if (videoM) { mediaKind = "video"; mediaRid = videoM[1]; }
      if (mediaKind) {
        const rel = relMap[mediaRid];
        if (rel) {
          const url = resolveMediaUrl(rel.target, media);
          if (url) shapes.push({ type: mediaKind, x, y, cx, cy, url });
        }
        continue;
      }
      const embed = block.match(/r:embed="([^"]+)"/);
      if (!embed) continue;
      const rel = relMap[embed[1]];
      if (!rel) continue;
      const url = resolveMediaUrl(rel.target, media);
      if (!url) continue;
      shapes.push({ type: "image", x, y, cx, cy, url });
    }
    const allMedia = [...xml.matchAll(/<(a:audioFile|a:videoFile)\b[^>]*?r:(?:link|embed)="([^"]+)"/g)];
    for (const mm of allMedia) {
      const kind = mm[1] === "a:audioFile" ? "audio" : "video";
      const rid = mm[2];
      const rel = relMap[rid];
      if (!rel) continue;
      const url = resolveMediaUrl(rel.target, media);
      if (!url) continue;
      const exists = shapes.some((s) => s.type === kind && s.url === url);
      if (!exists) shapes.push({ type: kind, x: 50, y: 50, cx: 280, cy: 180, url });
    }
    shapes.sort((a, b) => a.y - b.y);
    let plainText = "";
    for (const s of shapes) {
      if (s.type === "text") for (const p of s.paragraphs) for (const r of p.runs) plainText += r.text + "\n";
    }
    plainText = plainText.trim();
    return { shapes, plainText, slideW: slideW * emuToPx, slideH: slideH * emuToPx };
  }

  function mediaPlayerScript() {
    return (
      "(function(){" +
      "var SPEEDS=[0.25,0.5,0.75,1,1.25,1.5,1.75,2,5,10];" +
      "function fmt(t){if(!isFinite(t))t=0;var m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+(s<10?'0':'')+s;}" +
      "function initPlayer(p){" +
      "var tag=p.classList.contains('video-player')?'video':'audio';" +
      "var el=p.querySelector(tag);if(!el)return;" +
      "p.addEventListener('mousedown',function(e){e.stopPropagation();});" +
      "p.addEventListener('click',function(e){e.stopPropagation();});" +
      "var playBtn=p.querySelector('.mp-play');" +
      "var bar=p.querySelector('.mp-bar');var fill=p.querySelector('.mp-fill');" +
      "var cur=p.querySelector('.mp-cur');var dur=p.querySelector('.mp-dur');" +
      "var speedBtn=p.querySelector('.mp-speed');" +
      "var si=3;el.playbackRate=SPEEDS[si];" +
      "function syncRate(){if(speedBtn)speedBtn.textContent=SPEEDS[si]+'x';el.playbackRate=SPEEDS[si];}" +
      "if(speedBtn)speedBtn.addEventListener('click',function(){si=(si+1)%SPEEDS.length;syncRate();});" +
      "if(playBtn)playBtn.addEventListener('click',function(){if(el.paused)el.play();else el.pause();});" +
      "el.addEventListener('play',function(){if(playBtn)playBtn.textContent='❚❚';});" +
      "el.addEventListener('pause',function(){if(playBtn)playBtn.textContent='▶';});" +
      "el.addEventListener('loadedmetadata',function(){if(dur)dur.textContent=fmt(el.duration);});" +
      "el.addEventListener('timeupdate',function(){var r=el.duration>0?el.currentTime/el.duration:0;if(fill)fill.style.width=(r*100)+'%';if(cur)cur.textContent=fmt(el.currentTime);});" +
      "el.addEventListener('ended',function(){if(playBtn)playBtn.textContent='▶';});" +
      "if(bar){bar.addEventListener('click',function(e){if(el.duration>0){var r=e.offsetX/bar.clientWidth;el.currentTime=r*el.duration;}});}" +
      "if(tag==='video'){el.addEventListener('click',function(e){e.preventDefault();if(el.paused)el.play();else el.pause();});}" +
      "syncRate();p.dataset.mpinited='1';" +
      "}" +
      "function initAll(){document.querySelectorAll('.media-player:not([data-mpinited])').forEach(initPlayer);}" +
      "window._initMP=initPlayer;" +
      "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initAll);}else{initAll();}" +
      "setTimeout(initAll,200);" +
      "if(window.MutationObserver){var mo=new MutationObserver(function(){initAll();});mo.observe(document.body,{childList:true,subtree:true});}" +
      "})();"
    );
  }

  function mediaPlayerHtml(url, kind, w, h) {
    const isVideo = kind === "video";
    const dw = isVideo ? Math.max(w || 320, 200) : Math.max(w || 300, 200);
    const dh = isVideo ? Math.max(h || 180, 120) : 80;
    const tag = isVideo
      ? '<video class="mp-src" contenteditable="false" src="' + url + '" style="width:100%;height:' + (dh - 40) + 'px;object-fit:contain;background:#000;display:block;cursor:pointer;" preload="metadata"></video>'
      : '<audio class="mp-src" contenteditable="false" src="' + url + '" style="display:none;" preload="metadata"></audio>';
    return (
      '<div class="media-player ' + (isVideo ? "video-player" : "audio-player") + '" contenteditable="false" style="position:relative;width:' + dw.toFixed(0) + 'px;height:' + dh.toFixed(0) + 'px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);font-size:12px;z-index:15;pointer-events:auto;user-select:none;-webkit-user-select:none;cursor:default;">' +
      tag +
      '<div style="display:flex;align-items:center;gap:5px;padding:7px 8px;background:#f7f8fa;height:' + (isVideo ? 40 : 80) + 'px;box-sizing:border-box;pointer-events:auto;">' +
      '<button class="mp-play" contenteditable="false" style="min-width:30px;height:30px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;color:#374151;flex-shrink:0;pointer-events:auto;">▶</button>' +
      '<div class="mp-bar" contenteditable="false" style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;cursor:pointer;position:relative;min-width:60px;pointer-events:auto;">' +
      '<div class="mp-fill" style="position:absolute;left:0;top:0;bottom:0;width:0;background:#4a6fa5;border-radius:4px;pointer-events:none;"></div>' +
      "</div>" +
      '<span class="mp-cur" style="color:#6b7280;min-width:36px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;">0:00</span>' +
      '<span style="color:#9ca3af;flex-shrink:0;">/</span>' +
      '<span class="mp-dur" style="color:#6b7280;min-width:36px;font-variant-numeric:tabular-nums;flex-shrink:0;">0:00</span>' +
      '<button class="mp-speed" contenteditable="false" style="min-width:42px;height:30px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:11px;color:#4a6fa5;flex-shrink:0;pointer-events:auto;">1x</button>' +
      "</div></div>"
    );
  }

  function buildSlideHtml(slideData, index, total) {
    const { shapes, slideW, slideH } = slideData;
    const slideId = index + 1;
    const isFirst = index === 0;
    let inner = "";
    for (const s of shapes) {
      if (s.type === "image") {
        const w = s.cx || 200;
        const h = s.cy || 150;
        inner += '<img contenteditable="false" src="' + s.url + '" style="position:absolute;left:' + s.x.toFixed(1) + 'px;top:' + s.y.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;object-fit:contain;z-index:1;user-select:none;-webkit-user-select:none;" alt="">';
      } else if (s.type === "audio" || s.type === "video") {
        const w = s.cx || 280;
        const h = s.cy || (s.type === "video" ? 180 : 80);
        inner += '<div contenteditable="false" style="position:absolute;left:' + s.x.toFixed(1) + 'px;top:' + s.y.toFixed(1) + 'px;z-index:10;">' + mediaPlayerHtml(s.url, s.type, w, h) + "</div>";
      } else if (s.type === "text") {
        const w = s.cx || 300;
        const h = s.cy || 50;
        let paraHtml = "";
        for (const p of s.paragraphs) {
          if (p.runs.length === 0 && !p.hasBullet) continue;
          const alignMap = { l: "left", r: "right", ctr: "center", just: "justify", dist: "justify" };
          const textAlign = alignMap[p.align] || "left";
          paraHtml += '<div style="text-align:' + textAlign + ';margin:0;line-height:1.3;word-break:break-word;white-space:pre-wrap;">';
          if (p.hasBullet) paraHtml += '<span style="margin-right:6px;">•</span>';
          for (const r of p.runs) {
            const fontSize = r.sz ? (r.sz / 100) : 14;
            const mappedFont = r.font ? mapPptxFont(r.font) : "";
            const style = "font-size:" + fontSize.toFixed(1) + "px;" +
              (mappedFont ? "font-family:" + mappedFont + ";" : "") +
              (r.bold ? "font-weight:700;" : "") +
              (r.italic ? "font-style:italic;" : "") +
              (r.color ? "color:#" + r.color + ";" : "color:#1f2937;");
            paraHtml += '<span style="' + style + '">' + escapeHtml(r.text) + "</span>";
          }
          paraHtml += "</div>";
        }
        if (paraHtml) {
          inner += '<div style="position:absolute;left:' + s.x.toFixed(1) + 'px;top:' + s.y.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;min-height:' + h.toFixed(1) + 'px;overflow:hidden;z-index:2;">' + paraHtml + "</div>";
        }
      }
    }
    if (!inner) inner = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9ca3af;font-size:14px;">此幻灯片无内容</div>';
    const notesHtml = slideData.notes
      ? '<div class="slide-notes" style="display:none;position:absolute;left:0;right:0;bottom:0;max-height:40%;overflow:auto;background:#f9fafb;border-top:2px solid #d1d5db;padding:6px 10px;font-size:8px;color:#6b7280;line-height:1.3;white-space:pre-wrap;z-index:20;word-break:break-word;">' + escapeHtml(slideData.notes) + "</div>"
      : "";
    return (
      '<div class="slide" id="slide-' + slideId + '" data-w="' + slideW.toFixed(0) + '" data-h="' + slideH.toFixed(0) + '" style="display:' + (isFirst ? "block" : "none") + ';width:100%;height:100%;position:relative;overflow:hidden;background:#ffffff;">' +
      '<div class="slide-inner" style="position:absolute;left:0;top:0;width:' + slideW.toFixed(1) + 'px;height:' + slideH.toFixed(1) + 'px;transform-origin:top left;">' +
      inner +
      "</div>" +
      notesHtml +
      "</div>"
    );
  }

  function buildEmptySlideHtml(slideNum) {
    return (
      '<div class="slide" id="slide-' + slideNum + '" style="display:none;flex-direction:column;width:100%;height:100%;">' +
      '  <div class="slide-canvas" style="flex:1;display:flex;align-items:center;justify-content:center;padding:32px;background:#ffffff;color:#9ca3af;font-size:14px;">' +
      "    第 " + slideNum + " 页解析失败" +
      "  </div>" +
      "</div>"
    );
  }

  function buildPptxUI(slidesHtml, numSlides) {
    return (
      '<div class="pptx-root" contenteditable="false" style="display:flex;flex-direction:column;width:100%;height:100%;background:#f5f6f8;">' +
      '  <div class="pptx-header" contenteditable="false" style="display:flex;align-items:center;justify-content:space-between;padding:10px 18px;background:#ffffff;border-bottom:1px solid #e5e7eb;flex-shrink:0;">' +
      '    <span class="pptx-title" style="font-size:13px;font-weight:500;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50%;">演示文稿</span>' +
      '    <span style="display:flex;align-items:center;gap:10px;">' +
      '      <button id="notesBtn" contenteditable="false" style="padding:3px 10px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#374151;">备注</button>' +
      '      <span class="pptx-zoom" contenteditable="false" style="display:flex;align-items:center;gap:3px;font-size:12px;color:#6b7280;">缩放:<input type="range" id="pptxZoom" min="25" max="200" value="100" style="width:60px;"><span id="pptxZoomVal">100%</span></span>' +
      '      <span class="pptx-counter" id="counter" contenteditable="false" style="font-size:12px;color:#6b7280;white-space:nowrap;">1 / ' + numSlides + "</span>" +
      "    </span>" +
      "  </div>" +
      '  <div class="pptx-stage" contenteditable="false" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;padding:18px 28px;box-sizing:border-box;min-height:0;">' +
      '    <button class="nav-arrow nav-prev" id="prevBtn" contenteditable="false" aria-label="上一页" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#ffffff;border:1px solid #d1d5db;border-radius:6px;color:#374151;font-size:18px;line-height:1;cursor:pointer;z-index:10;transition:all .15s;padding:0;box-shadow:0 1px 3px rgba(0,0,0,0.08);">‹</button>' +
      '    <div class="pptx-viewport" style="width:100%;height:100%;max-width:900px;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;position:relative;">' +
      slidesHtml +
      "    </div>" +
      '    <button class="nav-arrow nav-next" id="nextBtn" contenteditable="false" aria-label="下一页" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#ffffff;border:1px solid #d1d5db;border-radius:6px;color:#374151;font-size:18px;line-height:1;cursor:pointer;z-index:10;transition:all .15s;padding:0;box-shadow:0 1px 3px rgba(0,0,0,0.08);">›</button>' +
      "  </div>" +
      '  <div class="pptx-progress" contenteditable="false" style="flex-shrink:0;height:3px;background:#e5e7eb;position:relative;">' +
      '    <div class="pptx-progress-bar" id="progressBar" style="position:absolute;left:0;top:0;bottom:0;background:#4a6fa5;width:' + (numSlides > 0 ? 100 / numSlides : 0) + "%;transition:width .2s ease;\"></div>" +
      "  </div>" +
      '  <div class="pptx-footer" contenteditable="false" style="display:flex;align-items:center;justify-content:center;gap:14px;padding:10px 18px;background:#ffffff;border-top:1px solid #e5e7eb;flex-shrink:0;">' +
      '    <button class="nav-btn" data-action="first" contenteditable="false" style="padding:5px 12px;background:#ffffff;border:1px solid #d1d5db;border-radius:6px;color:#6b7280;font-size:12px;cursor:pointer;transition:all .15s;">首页</button>' +
      '    <button class="nav-btn" id="prevBtn2" contenteditable="false" style="padding:5px 12px;background:#ffffff;border:1px solid #d1d5db;border-radius:6px;color:#374151;font-size:12px;cursor:pointer;transition:all .15s;">上一页</button>' +
      '    <span class="slide-indicator" id="indicator" contenteditable="false" style="font-size:12px;color:#6b7280;min-width:56px;text-align:center;">1 / ' + numSlides + "</span>" +
      '    <button class="nav-btn" id="nextBtn2" contenteditable="false" style="padding:5px 12px;background:#ffffff;border:1px solid #d1d5db;border-radius:6px;color:#374151;font-size:12px;cursor:pointer;transition:all .15s;">下一页</button>' +
      '    <button class="nav-btn" data-action="last" contenteditable="false" style="padding:5px 12px;background:#ffffff;border:1px solid #d1d5db;border-radius:6px;color:#6b7280;font-size:12px;cursor:pointer;transition:all .15s;">末页</button>' +
      "  </div>" +
      "</div>"
    );
  }

  async function renderXLSX(arrayBuffer, fontFamily) {
    const ok = await loadAPI("jszip");
    if (!ok || typeof JSZip === "undefined") throw new Error("JSZip 加载失败");
    const zip = await JSZip.loadAsync(arrayBuffer);
    const sheetFiles = Object.keys(zip.files).filter(function(f){return /^xl\/worksheets\/sheet\d+\.xml$/.test(f);}).sort();
    const wbFile = zip.file("xl/workbook.xml");
    const ssFile = zip.file("xl/sharedStrings.xml");
    var sheetNames = [];
    if (wbFile) {
      var wbXml = await wbFile.async("string");
      var snRe = /<sheet[^>]*name="([^"]+)"/g;
      var m;
      while ((m = snRe.exec(wbXml)) !== null) sheetNames.push(m[1]);
    }
    var sharedStrs = [];
    if (ssFile) {
      var ssXml = await ssFile.async("string");
      var siRe = /<si>([\s\S]*?)<\/si>/g;
      var m2;
      while ((m2 = siRe.exec(ssXml)) !== null) {
        var t = m2[1].match(/<t[^>]*>([\s\S]*?)<\/t>/);
        if (t) sharedStrs.push(t[1]);
      }
    }
    const maxSheets = Math.min(sheetFiles.length, 10);
    const pageContents = [];
    let totalWordCount = 0;
    let body = '<div class="doc-body" style="padding:16px;">';
    for (let i = 0; i < maxSheets; i++) {
      const xml = await zip.file(sheetFiles[i]).async("string");
      const sn = sheetNames[i] || ("Sheet" + (i + 1));
      const rows = xml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
      body += '<div class="sheet-block" style="margin-bottom:24px;">';
      body += '<div class="sheet-name" style="font-size:15px;font-weight:600;color:#1f2937;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #3b82f6;display:inline-block;">' + escapeHtml(sn) + "</div>";
      body += '<div style="overflow:auto;border:1px solid #e5e7eb;border-radius:6px;">';
      body += '<table style="border-collapse:collapse;width:100%;font-size:13px;">';
      let sheetText = "";
      for (let r = 0; r < rows.length; r++) {
        body += "<tr>";
        var cells = rows[r].match(/<c[^>]*>[^<]*(?:<v>[^<]*<\/v>)?[^<]*<\/c>|<c[^>]*\/>/g) || [];
        for (let c = 0; c < cells.length; c++) {
          var cellXml = cells[c];
          var typeM = cellXml.match(/t="([^"]+)"/);
          var vM = cellXml.match(/<v>([^<]*)<\/v>/);
          var isM = cellXml.match(/t="inlineStr"/);
          var isM2 = cellXml.match(/<is><t[^>]*>([\s\S]*?)<\/t><\/is>/);
          var val = "";
          if (isM && isM2) val = isM2[1];
          else if (typeM && typeM[1] === "s" && vM) val = sharedStrs[parseInt(vM[1])] || "";
          else if (vM) val = vM[1];
          var tag = r === 0 ? "th" : "td";
          var bg = r === 0 ? "background:#f9fafb;font-weight:600;" : "";
          body += "<" + tag + ' style="border:1px solid #e5e7eb;padding:6px 10px;text-align:left;' + bg + '">' + escapeHtml(val || "") + "</" + tag + ">";
          sheetText += val + " ";
        }
        body += "</tr>";
      }
      body += "</table></div></div>";
      pageContents.push(sheetText);
      totalWordCount += sheetText.split(/\s+/).filter((w) => w.length > 0).length;
    }
    body += "</div>";
    if (sheetFiles.length > maxSheets) {
      body += '<div style="padding:12px;text-align:center;color:#9ca3af;font-size:13px;">仅显示前 ' + maxSheets + " 个工作表</div>";
    }
    return { bodyHtml: body, numPages: sheetFiles.length, wordCount: totalWordCount, pageContents };
  }

  function getEditorContent(doc) {
    if (!doc.iframe || !doc.iframe.contentWindow) return doc.bodyHtml;
    try {
      const el = doc.iframe.contentWindow.document.querySelector(".editor-content");
      if (el) return el.innerHTML;
    } catch (e) {}
    return doc.bodyHtml;
  }

  class Documents {
    getInfo() {
      const STR = Scratch.ArgumentType.STRING, NUM = Scratch.ArgumentType.NUMBER;
      const CMD = Scratch.BlockType.COMMAND, REP = Scratch.BlockType.REPORTER, BOOL = Scratch.BlockType.BOOLEAN;
      const nameArg = { type: STR, defaultValue: "my doc" };
      return {
        id: "lmsDocuments", color1: "#4a6fa5", color2: "#3a5a8f", name: "zx的文档编辑器",
        blocks: [
          { opcode: "getAPIStatus", blockType: REP, text: "API [API] 的加载状态", arguments: { API: { type: STR, menu: "apis" } } },
          { opcode: "isAPILoaded", blockType: BOOL, text: "API [API] 加载成功？", arguments: { API: { type: STR, menu: "apis" } } },
          "---",
          { opcode: "loadDocument", blockType: CMD, text: "从 dataURL [URL] 加载文档并命名为 [NAME]", arguments: { URL: { type: STR, defaultValue: "" }, NAME: nameArg } },
          { opcode: "uploadDocument", blockType: CMD, text: "从本地上传文件并命名为 [NAME]", arguments: { NAME: nameArg } },
          { opcode: "createNewDocument", blockType: CMD, text: "新建名字为 [NAME] 的 [TYPE] 文档", arguments: { NAME: nameArg, TYPE: { type: STR, menu: "docTypes" } } },
          { opcode: "deleteDocument", blockType: CMD, text: "删除名字为 [NAME] 的文档", arguments: { NAME: nameArg } },
          { opcode: "showDocument", blockType: CMD, text: "显示名字为 [NAME] 的文档", arguments: { NAME: nameArg } },
          { opcode: "hideDocument", blockType: CMD, text: "隐藏名字为 [NAME] 的文档", arguments: { NAME: nameArg } },
          "---",
          { opcode: "showAll", blockType: CMD, text: "显示所有文档" },
          { opcode: "hideAll", blockType: CMD, text: "隐藏所有文档" },
          { opcode: "deleteAll", blockType: CMD, text: "删除所有文档" },
          { opcode: "getAllNames", blockType: REP, text: "所有文档名字" },
          "---",
          { opcode: "getDocAttribute", blockType: REP, text: "名字为 [NAME] 的 [ATTR]", arguments: { NAME: nameArg, ATTR: { type: STR, menu: "attributes" } } },
          { opcode: "getCurrentPage", blockType: REP, text: "名字为 [NAME] 文档当前页码", arguments: { NAME: nameArg } },
          { opcode: "getDocStat", blockType: REP, text: "名字为 [NAME] 文档的 [STAT]", arguments: { NAME: nameArg, STAT: { type: STR, menu: "statMenu" } } },
          { opcode: "getPageScreenshot", blockType: REP, text: "名字为 [NAME] 文档第 [PAGE] 页截图", arguments: { NAME: nameArg, PAGE: { type: NUM, defaultValue: 1 } } },
          { opcode: "getLoadStatus", blockType: REP, text: "名字为 [NAME] 文档的加载 [LINFO]", arguments: { NAME: nameArg, LINFO: { type: STR, menu: "loadStatusMenu" } } },
          { opcode: "setComment", blockType: CMD, text: "设置名字为 [NAME] 文档的注释为 [VALUE]", arguments: { NAME: nameArg, VALUE: { type: STR, defaultValue: "" } } },
          "---",
          { opcode: "setTransform", blockType: CMD, text: "将名字为 [NAME] 文档的 [PROP] 设为 [VALUE]", arguments: { NAME: nameArg, PROP: { type: STR, menu: "props" }, VALUE: { type: NUM, defaultValue: 0 } } },
          { opcode: "changeTransform", blockType: CMD, text: "将名字为 [NAME] 文档的 [PROP] 增加 [VALUE]", arguments: { NAME: nameArg, PROP: { type: STR, menu: "props" }, VALUE: { type: NUM, defaultValue: 10 } } },
          { opcode: "getTransform", blockType: REP, text: "名字为 [NAME] 文档的 [PROP]", arguments: { NAME: nameArg, PROP: { type: STR, menu: "props" } } },
          "---",
          { opcode: "setPage", blockType: CMD, text: "设置名字为 [NAME] 文档的页码为 [PAGE]", arguments: { NAME: nameArg, PAGE: { type: NUM, defaultValue: 1 } } },
          { opcode: "getPage", blockType: REP, text: "名字为 [NAME] 文档的当前页码", arguments: { NAME: nameArg } },
          { opcode: "getPageCount", blockType: REP, text: "名字为 [NAME] 文档的总页数", arguments: { NAME: nameArg } },
          "---",
          { opcode: "setPageSize", blockType: CMD, text: "设置名字为 [NAME] 文档的页面大小为 [VALUE] (0-100)", arguments: { NAME: nameArg, VALUE: { type: NUM, defaultValue: 100 } } },
          { opcode: "changePageSize", blockType: CMD, text: "将名字为 [NAME] 文档的页面大小增加 [VALUE] (0-100)", arguments: { NAME: nameArg, VALUE: { type: NUM, defaultValue: 10 } } },
          { opcode: "getPageSize", blockType: REP, text: "名字为 [NAME] 文档的页面大小", arguments: { NAME: nameArg } },
          "---",
          { opcode: "editDocument", blockType: CMD, text: "编辑名字为 [NAME] 的文档", arguments: { NAME: nameArg } },
          { opcode: "previewDocument", blockType: CMD, text: "预览名字为 [NAME] 的文档", arguments: { NAME: nameArg } },
          { opcode: "getDocumentHtml", blockType: REP, text: "名字为 [NAME] 文档的HTML内容", arguments: { NAME: nameArg } },
          "---",
          { opcode: "setNightMode", blockType: CMD, text: "设置名字为 [NAME] 文档的夜间模式为 [MODE]", arguments: { NAME: nameArg, MODE: { type: STR, menu: "nightModeMenu" } } },
          { opcode: "setAllNightMode", blockType: CMD, text: "设置所有文档夜间模式为 [MODE]", arguments: { MODE: { type: STR, menu: "nightModeMenu" } } },
          { opcode: "isNightMode", blockType: BOOL, text: "名字为 [NAME] 文档是否为夜间模式", arguments: { NAME: nameArg } },
          "---",
          { opcode: "exportDocumentDataURL", blockType: REP, text: "导出名字为 [NAME] 的文档为 [TYPE] 格式的 DATAURL", arguments: { NAME: nameArg, TYPE: { type: STR, menu: "exportTypes" } } },
          "---",
          { opcode: "getExportProgress", blockType: REP, text: "导出 [INFO]", arguments: { INFO: { type: STR, menu: "exportInfoMenu", defaultValue: "done" } } },
          { opcode: "isExporting", blockType: BOOL, text: "正在导出吗？" },
        ],
        menus: {
          apis: { acceptReporters: true, items: ["jszip", "mammoth", "xlsx"] },
          docTypes: { acceptReporters: true, items: [
            { text: "DOCX", value: "docx" },
            { text: "PPTX", value: "pptx" }, { text: "XLSX", value: "xlsx" },
          ] },
          attributes: { acceptReporters: true, items: [
            { text: "文件名字", value: "fileName" }, { text: "后缀", value: "suffix" },
            { text: "MB大小", value: "sizeMB" }, { text: "修改时间", value: "modifiedTime" },
            { text: "创建时间", value: "createdTime" }, { text: "注释", value: "comment" },
            { text: "总页数", value: "numPages" }, { text: "字数", value: "wordCount" },
          ] },
          statMenu: { acceptReporters: true, items: [
            { text: "段落数", value: "paragraphs" }, { text: "单词数", value: "words" },
            { text: "字符数(不含空格)", value: "chars" }, { text: "字符数(含空格)", value: "charsWithSpaces" },
          ] },
          props: { acceptReporters: true, items: [
            { text: "X", value: "x" }, { text: "Y", value: "y" },
            { text: "宽", value: "width" }, { text: "高", value: "height" },
            { text: "旋转角度", value: "rotation" }, { text: "缩放", value: "zoom" },
          ] },
          exportTypes: { acceptReporters: true, items: [
            { text: "DOCX", value: "docx" },
            { text: "PPTX", value: "pptx" }, { text: "XLSX", value: "xlsx" },
          ] },
          exportInfoMenu: { acceptReporters: true, items: [
            { text: "已完成页数", value: "done" }, { text: "总页数", value: "total" },
            { text: "速度(页/秒)", value: "speed" }, { text: "耗时(秒)", value: "elapsed" },
            { text: "状态", value: "status" }, { text: "错误数", value: "errors" },
            { text: "进度百分比", value: "percent" },
          ] },
          nightModeMenu: { acceptReporters: true, items: [
            { text: "开启", value: "on" }, { text: "关闭", value: "off" }, { text: "切换", value: "toggle" },
          ] },
          loadStatusMenu: { acceptReporters: true, items: [
            { text: "状态", value: "status" }, { text: "进度百分比", value: "progress" },
            { text: "错误信息", value: "error" }, { text: "页数", value: "numPages" },
            { text: "字数", value: "wordCount" },
          ] },
        },
      };
    }

    getAPIStatus(args) {
      return apiStatus[Cast.toString(args.API)] === "loaded";
    }
    isAPILoaded(args) {
      return apiStatus[Cast.toString(args.API)] === "loaded";
    }

    async loadDocument(args) {
      const name = Cast.toString(args.NAME);
      const url = Cast.toString(args.URL);
      if (!url) return;
      destroyDocument(name);
      let arrayBuffer;
      try {
        arrayBuffer = dataURLToArrayBuffer(url);
      } catch (e) {
        console.error("dataURL 解析失败:", e);
        return;
      }
      const mime = getDataURLMime(url);
      let type = detectType(arrayBuffer, mime);
      if (type === "zip") type = await detectZipType(arrayBuffer);
      if (!type || type === "unknown") {
        console.warn("无法识别的文档类型");
        return;
      }
      const suffixMap = { docx: ".docx", pptx: ".pptx", xlsx: ".xlsx" };
      const sizeBytes = Math.round((url.length * 3) / 4);
      const now = Date.now();
      const fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
      let result;
      try {
        if (type === "pptx") {
          result = await renderPPTX(arrayBuffer, fontFamily);
        } else if (type === "xlsx") {
          result = await renderXLSX(arrayBuffer, fontFamily);
        } else if (type === "docx") {
          result = await renderDOCX(arrayBuffer, fontFamily);
        }
      } catch (e) {
        console.error("文档渲染失败:", name, e);
        loadStatusMap[name] = { status: "error", progress: 0, error: e.message, numPages: 0, wordCount: 0 };
        return;
      }
      if (!result || !result.bodyHtml) {
        console.warn("文档无有效内容:", name);
        return;
      }
      createDocument(name, type, result.bodyHtml, {
        fileName: name + suffixMap[type],
        suffix: suffixMap[type],
        sizeBytes,
        createdTime: now,
        modifiedTime: now,
        comment: "",
        originalBuffer: arrayBuffer,
        numPages: result.numPages,
        wordCount: result.wordCount,
        pageContents: result.pageContents,
        fontFamily,
      });
      const ud = documents[name];
      if (ud) {
        ud.mode = "edit";
        ud.html = buildEditorHtml(ud);
        ud.visible = true;
        applyDisplay(ud);
      }
    }

    createNewDocument(args) {
      const name = Cast.toString(args.NAME);
      const type = Cast.toString(args.TYPE);
      if (!name || !type) return;
      destroyDocument(name);
      const now = Date.now();
      const fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
      let bodyHtml = "", numPages = 1;
      if (type === "docx") {
        bodyHtml = '<div class="doc-body" style="padding:24px;line-height:1.7;"><p>&nbsp;</p></div>';
      } else if (type === "pptx") {
        bodyHtml = buildPptxUI(
          '<div class="slide" id="slide-1" style="display:flex;flex-direction:column;width:100%;height:100%;">' +
          '<div class="slide-canvas" style="flex:1;display:flex;justify-content:center;align-items:center;background:#ffffff;padding:32px;">' +
          '<div style="color:#9ca3af;font-size:14px;">空白幻灯片</div></div></div>',
          1,
          fontFamily
        );
      } else if (type === "xlsx") {
        bodyHtml = '<div class="doc-body" style="padding:16px;"><table style="border-collapse:collapse;width:100%;"><tr><td style="border:1px solid #e5e7eb;padding:6px 10px;">&nbsp;</td></tr></table></div>';
      } else {
        return;
      }
      const suffixMap = { docx: ".docx", pptx: ".pptx", xlsx: ".xlsx" };
      createDocument(name, type, bodyHtml, {
        fileName: name + suffixMap[type],
        suffix: suffixMap[type],
        sizeBytes: 0,
        createdTime: now,
        modifiedTime: now,
        comment: "",
        originalBuffer: new ArrayBuffer(0),
        numPages,
        wordCount: 0,
        pageContents: [""],
        fontFamily,
      });
      const nd = documents[name];
      if (nd) {
        nd.mode = "edit";
        nd.html = buildEditorHtml(nd);
      }
    }

    uploadDocument(args) {
      const name = Cast.toString(args.NAME);
      if (!name) return;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".docx,.pptx,.xlsx";
      input.style.display = "none";
      document.body.appendChild(input);
      const filePromise = new Promise(function (resolve) {
        input.onchange = function () {
          const file = input.files && input.files[0];
          document.body.removeChild(input);
          resolve(file || null);
        };
      });
      input.click();
      return (async function () {
        const file = await filePromise;
        if (!file) return;
        const arrayBuffer = await new Promise(function (res) {
          const reader = new FileReader();
          reader.onload = function () { res(reader.result); };
          reader.readAsArrayBuffer(file);
        });
        const suffix = file.name.split(".").pop().toLowerCase();
        const typeMap = { docx: "docx", pptx: "pptx", xlsx: "xlsx" };
        let type = typeMap[suffix] || "unknown";
        if (type === "unknown") type = detectType(arrayBuffer, file.type || "");
        if (type === "zip") type = "pptx";
        if (type === "unknown") {
          console.warn("无法识别的文档类型");
          return;
        }
        destroyDocument(name);
        const now = Date.now();
        const fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
        let result;
        try {
          if (type === "pptx") {
            result = await renderPPTX(arrayBuffer, fontFamily);
          } else if (type === "docx") {
            result = await renderDOCX(arrayBuffer, fontFamily);
          } else if (type === "xlsx") {
            result = await renderXLSX(arrayBuffer, fontFamily);
          }
        } catch (e) {
          console.error("文档渲染失败:", name, e);
          loadStatusMap[name] = { status: "error", progress: 0, error: e.message, numPages: 0, wordCount: 0 };
          try {
            if (type === "docx") result = await renderDOCX(arrayBuffer, fontFamily);
            else if (type === "xlsx") result = await renderXLSX(arrayBuffer, fontFamily);
          } catch (e2) {
            console.error("主线程渲染也失败:", name, e2);
            return;
          }
        }
        if (!result || !result.bodyHtml) return;
        const suffixMap = { docx: ".docx", pptx: ".pptx", xlsx: ".xlsx" };
        createDocument(name, type, result.bodyHtml, {
          fileName: name + suffixMap[type],
          suffix: suffixMap[type],
          sizeBytes: file.size,
          createdTime: now,
          modifiedTime: now,
          comment: "",
          originalBuffer: arrayBuffer,
          numPages: result.numPages,
          wordCount: result.wordCount,
          pageContents: result.pageContents,
          fontFamily,
        });
        const ud = documents[name];
        if (ud) {
          ud.mode = "edit";
          ud.html = buildEditorHtml(ud);
          ud.visible = true;
          applyDisplay(ud);
        }
      })();
    }

    deleteDocument(args) {
      destroyDocument(Cast.toString(args.NAME));
    }

    showDocument(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      doc.visible = true;
      applyDisplay(doc);
    }

    hideDocument(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      doc.visible = false;
      if (doc.iframe) updateViewerAttributes(doc);
    }

    showAll() {
      for (const n of Object.keys(documents)) this.showDocument({ NAME: n });
    }
    hideAll() {
      for (const n of Object.keys(documents)) this.hideDocument({ NAME: n });
    }
    deleteAll() {
      for (const n of Object.keys(documents)) destroyDocument(n);
    }
    getAllNames() {
      return JSON.stringify(Object.keys(documents));
    }

    getDocAttribute(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return "";
      switch (args.ATTR) {
        case "fileName": return doc.fileName;
        case "suffix": return doc.suffix;
        case "sizeMB": return (doc.sizeBytes / 1024 / 1024).toFixed(3);
        case "modifiedTime": return new Date(doc.modifiedTime).toLocaleString();
        case "createdTime": return new Date(doc.createdTime).toLocaleString();
        case "comment": return doc.comment;
        case "numPages": return doc.numPages;
        case "wordCount": return doc.wordCount;
        default: return "";
      }
    }

    getCurrentPage(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc || !doc.iframe) return 1;
      try {
        const w = doc.iframe.contentWindow;
        if (!w) return 1;
        const sel = w.document.querySelector('.pv-page-active, .sheet-block.active, .slide.active');
        if (sel) {
          const all = w.document.querySelectorAll('.sheet-block, .slide');
          for (let i = 0; i < all.length; i++) if (all[i] === sel) return i + 1;
        }
        const el = w.document.querySelector('.editor-content') || w.document.body;
        const pages = el.querySelectorAll('.sheet-block, .slide');
        if (pages.length === 0) return 1;
        let cur = 1;
        for (let i = 0; i < pages.length; i++) {
          const r = pages[i].getBoundingClientRect();
          if (r.top > 0) { cur = i + 1; break; }
          if (i === pages.length - 1) cur = i + 1;
        }
        return cur;
      } catch (e) { return 1; }
    }

    getDocStat(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return 0;
      const text = doc.pageContents ? doc.pageContents.join(" ") : "";
      const stat = args.STAT;
      if (stat === "words") return doc.wordCount || 0;
      if (stat === "paragraphs") {
        if (doc.iframe) {
          try {
            const w = doc.iframe.contentWindow;
            if (w) return w.document.querySelectorAll("p, div.slide > div, tr").length || text.split(/\n/).length;
          } catch (e) {}
        }
        return text.split(/\n/).length;
      }
      if (stat === "chars") return text.replace(/\s/g, "").length;
      if (stat === "charsWithSpaces") return text.length;
      return 0;
    }

    getLoadStatus(args) {
      const name = Cast.toString(args.NAME);
      const info = Cast.toString(args.LINFO);
      const s = loadStatusMap[name] || { status: "idle", progress: 0, error: "", numPages: 0, wordCount: 0 };
      if (info === "status") return s.status;
      if (info === "progress") return s.progress;
      if (info === "error") return s.error || "";
      if (info === "numPages") return s.numPages;
      if (info === "wordCount") return s.wordCount;
      return "";
    }

    async getPageScreenshot(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc || !doc.iframe) return "";
      const page = Cast.toNumber(args.PAGE);
      try {
        const w = doc.iframe.contentWindow;
        if (!w) return "";
        const pages = w.document.querySelectorAll('.sheet-block, .slide');
        if (page < 1 || page > pages.length) return "";
        const el = pages[page - 1];
        el.style.display = 'block';
        await new Promise(r => setTimeout(r, 100));
        await loadAPI("html2canvas");
        if (typeof html2canvas === "undefined") return "";
        const canvas = await Promise.race([
          html2canvas(el, { scale: 1, useCORS: true, backgroundColor: "#ffffff", logging: false, imageTimeout: 3000 }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000))
        ]);
        try { return canvas.toDataURL("image/png"); } catch (e) { return ""; }
      } catch (e) { return ""; }
    }

    setComment(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      doc.comment = Cast.toString(args.VALUE);
      doc.modifiedTime = Date.now();
    }

    setTransform(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      const v = Cast.toNumber(args.VALUE), p = args.PROP;
      if (p === "width") doc.width = Math.max(1, v);
      else if (p === "height") doc.height = Math.max(1, v);
      else if (p === "zoom") doc.zoom = Math.max(0.01, v);
      else doc[p] = v;
      applyDisplay(doc);
    }

    changeTransform(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      const v = Cast.toNumber(args.VALUE), p = args.PROP;
      if (p === "width") doc.width = Math.max(1, doc.width + v);
      else if (p === "height") doc.height = Math.max(1, doc.height + v);
      else if (p === "zoom") doc.zoom = Math.max(0.01, doc.zoom + v);
      else doc[p] += v;
      applyDisplay(doc);
    }

    getTransform(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return 0;
      const p = args.PROP;
      if (p === "zoom") return doc.zoom || 1;
      return doc[p] || 0;
    }

    setPage(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      const page = Math.max(1, Math.min(doc.numPages, Cast.toNumber(args.PAGE)));
      doc.modifiedTime = Date.now();
      if (doc.iframe) {
        try {
          if (doc.type === "pptx") {
            doc.iframe.contentWindow.postMessage({ type: "GO_TO_SLIDE", slideNumber: page }, "*");
          } else {
            doc.iframe.contentWindow.postMessage({ type: "GO_TO_PAGE", page }, "*");
          }
        } catch (e) {}
      }
    }
    getPage(args) { return documents[Cast.toString(args.NAME)] ? 1 : 0; }
    getPageCount(args) { const d = documents[Cast.toString(args.NAME)]; return d ? d.numPages : 0; }

    setPageSize(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      let v = Cast.toNumber(args.VALUE);
      v = Math.max(0, Math.min(100, v));
      const [sw, sh] = getStageSize();
      doc.width = sw * v / 100;
      doc.height = sh * v / 100;
      doc.modifiedTime = Date.now();
      applyDisplay(doc);
    }

    getPageSize(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return 0;
      const [sw] = getStageSize();
      if (!sw || !doc.width) return 0;
      return Math.round(doc.width / sw * 100);
    }

    changePageSize(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      let v = Cast.toNumber(args.VALUE);
      const [sw, sh] = getStageSize();
      const cur = (doc.width && sw) ? doc.width / sw * 100 : 100;
      v = Math.max(0, Math.min(100, cur + v));
      doc.width = sw * v / 100;
      doc.height = sh * v / 100;
      doc.modifiedTime = Date.now();
      applyDisplay(doc);
    }

    setNightMode(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc || !doc.iframe) return;
      const mode = Cast.toString(args.MODE);
      const iframe = doc.iframe;
      const body = iframe.contentDocument && iframe.contentDocument.body;
      if (!body) return;
      const isNight = body.classList.contains("night");
      if (mode === "on" && !isNight) { body.classList.add("night"); doc.nightMode = true; }
      else if (mode === "off" && isNight) { body.classList.remove("night"); doc.nightMode = false; }
      else if (mode === "toggle") { body.classList.toggle("night"); doc.nightMode = body.classList.contains("night"); }
    }

    setAllNightMode(args) {
      const mode = Cast.toString(args.MODE);
      for (const name in documents) {
        const doc = documents[name];
        if (!doc.iframe) continue;
        const body = doc.iframe.contentDocument && doc.iframe.contentDocument.body;
        if (!body) continue;
        const isNight = body.classList.contains("night");
        if (mode === "on" && !isNight) { body.classList.add("night"); doc.nightMode = true; }
        else if (mode === "off" && isNight) { body.classList.remove("night"); doc.nightMode = false; }
        else if (mode === "toggle") { body.classList.toggle("night"); doc.nightMode = body.classList.contains("night"); }
      }
    }

    isNightMode(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc || !doc.iframe) return false;
      const body = doc.iframe.contentDocument && doc.iframe.contentDocument.body;
      return body ? body.classList.contains("night") : false;
    }

    editDocument(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      if (doc.mode !== "edit" && doc.iframe) {
        doc.bodyHtml = getEditorContent(doc);
        try { doc.nightMode = doc.iframe.contentDocument.body.classList.contains("night"); } catch (e) {}
      }
      doc.mode = "edit";
      doc.html = buildEditorHtml(doc);
      if (doc.iframe) {
        refreshViewerContent(doc);
      } else {
        applyDisplay(doc);
      }
    }

    previewDocument(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return;
      if (doc.mode === "edit" && doc.iframe) {
        doc.bodyHtml = getEditorContent(doc);
        try { doc.nightMode = doc.iframe.contentDocument.body.classList.contains("night"); } catch (e) {}
      }
      doc.mode = "preview";
      doc.html = buildPreviewHtml(doc);
      if (doc.iframe) {
        refreshViewerContent(doc);
      } else {
        applyDisplay(doc);
      }
    }

    getDocumentHtml(args) {
      const doc = documents[Cast.toString(args.NAME)];
      if (!doc) return "";
      return getEditorContent(doc);
    }

    exportDocumentDataURL(args) {
      const name = Cast.toString(args.NAME);
      const type = Cast.toString(args.TYPE);
      const doc = documents[name];
      if (!doc) return "";
      const content = getEditorContent(doc);
      return (async function () {
        try {
          var blob;
          if (type === "docx") blob = await exportDocxBlob(content, name);
          else if (type === "xlsx") blob = await exportXlsxBlob(content, name);
          else if (type === "pptx") blob = await exportPptxBlob(content, name);
          if (!blob) { exportState.status = "error"; return ""; }
          exportState.status = "done";
          return await new Promise(function (res) {
            var r = new FileReader();
            r.onload = function () { res(r.result); };
            r.onerror = function () { res(""); };
            r.readAsDataURL(blob);
          });
        } catch (e) {
          exportState.status = "error";
          return "";
        }
      })();
    }

    getExportProgress(args) {
      const info = Cast.toString(args.INFO);
      if (info === "done") return exportState.done;
      if (info === "total") return exportState.total;
      if (info === "speed") return parseFloat(exportState.speed) || 0;
      if (info === "elapsed") return parseFloat(exportState.elapsed.toFixed(2)) || 0;
      if (info === "status") return exportState.status;
      if (info === "errors") return exportState.errors;
      if (info === "percent") return exportState.total > 0 ? Math.round(exportState.done / exportState.total * 100) : 0;
      return "";
    }

    isExporting() { return exportState.active; }
  }

  Scratch.extensions.register(new Documents());
})(Scratch);
