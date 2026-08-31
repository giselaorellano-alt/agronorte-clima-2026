(function () {
  'use strict';

  var DATA = null;
  var state = {
    dimType: 'General',
    dimValue: null
  };

  var fmtInt = function (n) { return (n === null || n === undefined) ? '—' : n.toLocaleString('es-AR'); };
  var fmtPct = function (n) { return (n === null || n === undefined) ? '—' : n.toFixed(1).replace('.', ',') + '%'; };

  function band(fav) {
    if (fav === null || fav === undefined) return { cls: 'na', label: 'Sin datos' };
    if (fav >= 75) return { cls: 'good', label: 'Favorable' };
    if (fav >= 60) return { cls: 'watch', label: 'A mejorar' };
    return { cls: 'risk', label: 'Crítico' };
  }

  function fillClass(cls) {
    if (cls === 'watch') return 'watch';
    if (cls === 'risk') return 'risk';
    return '';
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function renderKpis() {
    var g = DATA.general;
    var p = g.participacion || {};
    var b = band(g.favorabilidad_total);
    var row = document.getElementById('kpiRow');
    row.innerHTML = '';
    row.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Favorabilidad general' }),
      el('div', { class: 'kpi-value', text: fmtPct(g.favorabilidad_total) }),
      el('div', { class: 'kpi-sub' }, [el('span', { class: 'badge ' + b.cls, text: b.label })])
    ]));
    row.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Participación' }),
      el('div', { class: 'kpi-value', text: fmtPct(p.tasa) }),
      el('div', { class: 'kpi-sub', text: fmtInt(p.respondieron) + ' de ' + fmtInt(p.asignados) + ' invitados' })
    ]));
    row.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Respuestas analizadas' }),
      el('div', { class: 'kpi-value', text: fmtInt(g.n_users) }),
      el('div', { class: 'kpi-sub', text: 'personas que finalizaron la encuesta' })
    ]));
    row.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Dimensiones de clima' }),
      el('div', { class: 'kpi-value', text: String(DATA.topics.length) }),
      el('div', { class: 'kpi-sub', text: DATA.questions.length + ' preguntas relevadas' })
    ]));
  }

  function dimList() {
    var order = ['General', 'Departamento', 'Jefe Directo', 'DIVISION', 'GENERO', 'SUCURSAL', 'ROPA', 'Antigüedad'];
    return order.filter(function (d) { return d === 'General' || (DATA.dimensions[d] && DATA.dimensions[d].length); });
  }

  function dimLabel(d) {
    if (d === 'General') return 'General';
    return DATA.dimLabels[d] || d;
  }

  function renderChips() {
    var box = document.getElementById('dimChips');
    box.innerHTML = '';
    dimList().forEach(function (d) {
      var chip = el('button', { class: 'chip', type: 'button', role: 'tab', 'aria-selected': String(d === state.dimType) }, [document.createTextNode(dimLabel(d))]);
      chip.addEventListener('click', function () {
        state.dimType = d;
        state.dimValue = null;
        onFilterChange();
      });
      box.appendChild(chip);
    });
  }

  function renderValuePicker() {
    var row = document.getElementById('valueRow');
    var select = document.getElementById('valueSelect');
    var search = document.getElementById('valueSearch');
    var label = document.getElementById('valueLabel');

    if (state.dimType === 'General') {
      row.hidden = true;
      return;
    }
    row.hidden = false;
    label.textContent = dimLabel(state.dimType) + ':';
    var items = (DATA.dimensions[state.dimType] || []).slice();

    function populate(filterText) {
      select.innerHTML = '';
      var placeholder = el('option', { value: '' }, [document.createTextNode('— Seleccionar (' + items.length + ') —')]);
      select.appendChild(placeholder);
      items
        .filter(function (it) { return !filterText || it.value.toLowerCase().indexOf(filterText.toLowerCase()) !== -1; })
        .forEach(function (it) {
          var opt = el('option', { value: it.value }, [document.createTextNode(it.value + '  ·  ' + fmtPct(it.favorabilidad_total))]);
          select.appendChild(opt);
        });
      select.value = state.dimValue || '';
    }
    populate('');
    search.oninput = function () { populate(search.value); };
    select.onchange = function () {
      state.dimValue = select.value || null;
      onFilterChange();
    };
  }

  function currentEntry() {
    if (state.dimType === 'General') return { value: 'Todos', byTopic: DATA.general.byTopic, favorabilidad_total: DATA.general.favorabilidad_total, n_users: DATA.general.n_users, participacion: DATA.general.participacion };
    if (!state.dimValue) return null;
    var list = DATA.dimensions[state.dimType] || [];
    for (var i = 0; i < list.length; i++) if (list[i].value === state.dimValue) return list[i];
    return null;
  }

  function renderSelectionPanel() {
    var panel = document.getElementById('selectionPanel');
    var title = document.getElementById('selectionTitle');
    var badgeEl = document.getElementById('selectionBadge');
    var kpis = document.getElementById('selectionKpis');

    if (state.dimType === 'General') { panel.hidden = true; return; }
    var entry = currentEntry();
    if (!entry) { panel.hidden = true; return; }
    panel.hidden = false;
    title.textContent = dimLabel(state.dimType) + ': ' + entry.value;
    var b = band(entry.favorabilidad_total);
    badgeEl.className = 'badge ' + b.cls;
    badgeEl.textContent = b.label;

    kpis.innerHTML = '';
    var p = entry.participacion || {};
    kpis.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Favorabilidad' }),
      el('div', { class: 'kpi-value', text: fmtPct(entry.favorabilidad_total) })
    ]));
    kpis.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Participación' }),
      el('div', { class: 'kpi-value', text: fmtPct(p.tasa) }),
      el('div', { class: 'kpi-sub', text: fmtInt(p.respondieron) + ' de ' + fmtInt(p.asignados) })
    ]));
    kpis.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'vs. General' }),
      el('div', { class: 'kpi-value', text: (entry.favorabilidad_total - DATA.general.favorabilidad_total >= 0 ? '+' : '') + (entry.favorabilidad_total !== null ? (entry.favorabilidad_total - DATA.general.favorabilidad_total).toFixed(1).replace('.', ',') + ' pp' : '—') })
    ]));

    var dlBtn = document.getElementById('btnDownloadPdf');
    dlBtn.onclick = function () { downloadPdfFor(state.dimType, entry); };
  }

  function sanitizeFileName(s) {
    return String(s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function downloadPdfFor(dimType, entry) {
    var btn = document.getElementById('btnDownloadPdf');
    var libsReady = window.html2canvas && window.jspdf && window.jspdf.jsPDF;
    if (!libsReady) {
      alert('No se pudieron cargar las librerías de PDF (revisá tu conexión). Probá recargar la página.');
      return;
    }
    btn.disabled = true;
    var originalLabel = btn.textContent;
    btn.textContent = 'Generando...';

    var b = band(entry.favorabilidad_total);
    var p = entry.participacion || {};
    var vsGeneral = entry.favorabilidad_total !== null
      ? (entry.favorabilidad_total - DATA.general.favorabilidad_total >= 0 ? '+' : '') + (entry.favorabilidad_total - DATA.general.favorabilidad_total).toFixed(1).replace('.', ',') + ' pp vs. general'
      : '';

    var root = el('div', { class: 'pdf-export-root' });
    root.appendChild(el('div', { class: 'pe-header' }, [
      el('div', { class: 'pe-mark' }),
      el('div', {}, [
        el('div', { class: 'pe-title', text: 'Encuesta de Clima · FY26' }),
        el('div', { class: 'pe-subtitle', text: DATA.meta.instanceName + ' · ' + DATA.meta.surveyName })
      ])
    ]));
    root.appendChild(el('h1', { text: dimLabel(dimType) + ': ' + entry.value }));
    root.appendChild(el('span', { class: 'badge ' + b.cls, text: b.label }));
    var kpiRow = el('div', { class: 'pe-kpis' });
    kpiRow.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Favorabilidad' }),
      el('div', { class: 'kpi-value', text: fmtPct(entry.favorabilidad_total) })
    ]));
    kpiRow.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'Participación' }),
      el('div', { class: 'kpi-value', text: fmtPct(p.tasa) }),
      el('div', { class: 'kpi-sub', text: fmtInt(p.respondieron) + ' de ' + fmtInt(p.asignados) })
    ]));
    kpiRow.appendChild(el('div', { class: 'kpi-card' }, [
      el('div', { class: 'kpi-label', text: 'vs. General' }),
      el('div', { class: 'kpi-value', text: vsGeneral || '—' })
    ]));
    root.appendChild(kpiRow);
    root.appendChild(el('h2', { text: 'Favorabilidad por dimensión', style: 'margin-bottom:12px;' }));
    var barsBox = el('div', { class: 'bars' });
    barsBox.appendChild(buildBarRows(entry, true));
    root.appendChild(barsBox);
    root.appendChild(el('div', { class: 'pe-foot' }, [
      document.createTextNode('Los cortes segmentados se muestran solo para grupos con ' + (DATA.meta.anonimato_minimo || 3) + ' o más respuestas. Favorabilidad = % de respuestas "de acuerdo" / "totalmente de acuerdo" sobre el total. Generado el ' + DATA.meta.generatedAt + ' · Humand CX.')
    ]));

    document.body.appendChild(root);

    window.html2canvas(root, { scale: 2, backgroundColor: '#ffffff' }).then(function (canvas) {
      document.body.removeChild(root);
      var imgData = canvas.toDataURL('image/png');
      var jsPDF = window.jspdf.jsPDF;
      var pageWidth = 595.28; // A4 pt
      var imgWidth = pageWidth - 48;
      var imgHeight = canvas.height * (imgWidth / canvas.width);
      var pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      var y = 24;
      var remaining = imgHeight;
      var srcY = 0;
      var pageHeight = 841.89 - 48;
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 24, y, imgWidth, imgHeight);
      } else {
        // paginate: slice canvas into page-sized chunks
        var pxPerPt = canvas.width / imgWidth;
        var pageHeightPx = pageHeight * pxPerPt;
        var pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        var first = true;
        while (remaining > 0) {
          var sliceHeightPx = Math.min(pageHeightPx, canvas.height - srcY);
          pageCanvas.height = sliceHeightPx;
          var ctx = pageCanvas.getContext('2d');
          ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
          if (!first) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 24, 24, imgWidth, sliceHeightPx / pxPerPt);
          srcY += sliceHeightPx;
          remaining -= sliceHeightPx / pxPerPt;
          first = false;
        }
      }
      var fname = 'Reporte_Clima_' + sanitizeFileName(dimType) + '_' + sanitizeFileName(entry.value) + '.pdf';
      pdf.save(fname);
      btn.disabled = false;
      btn.textContent = originalLabel;
    }).catch(function (err) {
      document.body.contains(root) && document.body.removeChild(root);
      btn.disabled = false;
      btn.textContent = originalLabel;
      alert('No se pudo generar el PDF: ' + err);
    });
  }

  function buildBarRows(entry, showMarker) {
    var frag = document.createDocumentFragment();
    var topics = DATA.topics.slice().sort(function (a, b2) {
      var fa = (entry.byTopic[a] || {}).favorabilidad;
      var fb = (entry.byTopic[b2] || {}).favorabilidad;
      if (fa === null || fa === undefined) return 1;
      if (fb === null || fb === undefined) return -1;
      return fb - fa;
    });
    topics.forEach(function (t) {
      var cell = entry.byTopic[t];
      var fav = cell ? cell.favorabilidad : null;
      var b = band(fav);
      var generalFav = (DATA.general.byTopic[t] || {}).favorabilidad;
      var row = el('div', { class: 'bar-row' });
      row.appendChild(el('div', { class: 'bar-label', text: t }));
      var track = el('div', { class: 'bar-track' });
      track.appendChild(el('div', { class: 'bar-fill ' + fillClass(b.cls), style: 'width:' + (fav || 0) + '%' }));
      if (showMarker && generalFav !== null && generalFav !== undefined) {
        track.appendChild(el('div', { class: 'bar-marker', style: 'left:' + generalFav + '%', title: 'General: ' + fmtPct(generalFav) }));
      }
      row.appendChild(track);
      row.appendChild(el('div', { class: 'bar-value', text: fmtPct(fav) }));
      frag.appendChild(row);
    });
    return frag;
  }

  function renderTopicBars() {
    var box = document.getElementById('topicBars');
    var hint = document.getElementById('topicHint');
    box.innerHTML = '';
    var entry = currentEntry();
    hint.textContent = state.dimType === 'General' ? 'General' : (entry ? dimLabel(state.dimType) + ': ' + entry.value : 'Seleccioná un valor arriba');
    if (!entry) {
      box.appendChild(el('div', { class: 'empty-note', text: 'Elegí un valor de ' + dimLabel(state.dimType) + ' para ver el detalle por dimensión.' }));
      return;
    }
    box.appendChild(buildBarRows(entry, state.dimType !== 'General'));
  }

  function renderRankTable() {
    var title = document.getElementById('rankingTitle');
    var tbody = document.getElementById('rankTableBody');
    tbody.innerHTML = '';

    if (state.dimType === 'General') {
      title.textContent = 'Ranking · Departamento';
      renderRankRows(DATA.dimensions['Departamento'] || [], tbody);
      return;
    }
    title.textContent = 'Ranking · ' + dimLabel(state.dimType);
    renderRankRows(DATA.dimensions[state.dimType] || [], tbody);
  }

  function renderRankRows(list, tbody) {
    var sorted = list.slice().sort(function (a, b) {
      if (a.favorabilidad_total === null) return 1;
      if (b.favorabilidad_total === null) return -1;
      return b.favorabilidad_total - a.favorabilidad_total;
    });
    sorted.forEach(function (it) {
      var b = band(it.favorabilidad_total);
      var p = it.participacion || {};
      var tr = el('tr');
      tr.appendChild(el('td', { text: it.value }));
      tr.appendChild(el('td', { text: fmtPct(p.tasa) + ' (' + fmtInt(p.respondieron) + '/' + fmtInt(p.asignados) + ')' }));
      var favTd = el('td');
      var favCell = el('div', { class: 'cell-fav' });
      var mtrack = el('div', { class: 'mini-track' });
      mtrack.appendChild(el('div', { class: 'mini-fill ' + fillClass(b.cls), style: 'width:' + (it.favorabilidad_total || 0) + '%' }));
      favCell.appendChild(mtrack);
      favCell.appendChild(el('span', { text: fmtPct(it.favorabilidad_total) }));
      favTd.appendChild(favCell);
      tr.appendChild(favTd);
      tr.addEventListener('click', function () {
        state.dimValue = it.value;
        onFilterChange();
        document.getElementById('selectionPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      tbody.appendChild(tr);
    });
  }

  function renderQuestions(filterText) {
    var tbody = document.getElementById('questionsTableBody');
    tbody.innerHTML = '';
    var ft = (filterText || '').toLowerCase();
    DATA.questions
      .filter(function (q) { return !ft || q.pregunta.toLowerCase().indexOf(ft) !== -1 || q.topic.toLowerCase().indexOf(ft) !== -1; })
      .forEach(function (q) {
        var b = band(q.favorabilidad);
        var tr = el('tr');
        tr.appendChild(el('td', { class: 'qtopic', text: q.topic }));
        tr.appendChild(el('td', { class: 'qtext', text: q.pregunta }));
        var favTd = el('td');
        var cell = el('div', { class: 'cell-fav' });
        var mtrack = el('div', { class: 'mini-track' });
        mtrack.appendChild(el('div', { class: 'mini-fill ' + fillClass(b.cls), style: 'width:' + q.favorabilidad + '%' }));
        cell.appendChild(mtrack);
        cell.appendChild(el('span', { text: fmtPct(q.favorabilidad) }));
        favTd.appendChild(cell);
        tr.appendChild(favTd);
        tbody.appendChild(tr);
      });
  }

  function onFilterChange() {
    renderChips();
    renderValuePicker();
    renderSelectionPanel();
    renderTopicBars();
    renderRankTable();
  }

  function init(data) {
    DATA = data;
    document.getElementById('instanceName').textContent = data.meta.instanceName;
    document.getElementById('generatedAt').textContent = data.meta.generatedAt;
    document.getElementById('topbarMeta').textContent = data.meta.surveyName + ' · Lanzada ' + data.meta.launchDate;
    document.getElementById('btnClearFilter').addEventListener('click', function () {
      state.dimType = 'General'; state.dimValue = null; onFilterChange();
    });
    document.getElementById('questionSearch').addEventListener('input', function (e) {
      renderQuestions(e.target.value);
    });
    renderKpis();
    onFilterChange();
    renderQuestions('');
  }

  fetch('data.json')
    .then(function (r) { return r.json(); })
    .then(init)
    .catch(function (err) {
      document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif;color:#942020">No se pudo cargar data.json: ' + err + '</div>';
    });
})();
