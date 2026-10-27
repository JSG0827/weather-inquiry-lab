(function(){
  'use strict';
  const C=WeatherCore,D=WeatherData,A=WeatherAnalysis,$=id=>document.getElementById(id),e=C.escapeHTML;
  const colors=['#167a91','#b55e28'];
  const groups=[
    {id:'temperature',label:'기온',icon:'◉',unit:'℃'},
    {id:'humidity',label:'습도',icon:'◌',unit:'%'},
    {id:'windSpeed',label:'바람',icon:'↗',unit:'m/s · 풍향'},
    {id:'cloud',label:'구름량',icon:'☁',unit:'%'},
    {id:'precipitation',label:'강수량',icon:'▥',unit:'mm / 직전 1h'},
    {id:'visibility',label:'시정',icon:'◎',unit:'km'}
  ];
  const fields=[
    ['temperature','지상 기온','℃'],['surfaceTemperature','지표면 온도','℃'],['upperTemperature','상공 1 km 기온','℃'],
    ['humidity','상대 습도','%'],['dewpoint','이슬점','℃'],['windDirection','풍향',''],
    ['windSpeed','풍속','m/s'],['cloud','구름량','%'],['precipitation','직전 1시간 강수량','mm'],['visibility','시정','km']
  ];
  let current,frame=0,group='temperature',field='temperature',timer;
  const num=x=>String(Math.round(x*10)/10);
  const meta=()=>fields.find(x=>x[0]===field);
  const siteName=j=>(j+1)+' · '+current.stationNames[j];
  function shortTime(i){return current.times[i].split(' · ')[0];}
  function wind(r){return C.direction(r.windDirection)+'풍';}
  function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
  function start(id){
    current=D.cases.find(c=>c.id===id);
    if(!current){toast('학습지의 유형을 선택하세요.');return;}
    frame=current.afterIndex;group='temperature';field='temperature';
    $('entry').hidden=true;$('lab').hidden=false;
    $('session-info').textContent='세트 '+id+' · 교육용 재구성 자료';
    $('case-title').textContent=current.title;$('period').textContent=current.period+' · 두 지점 · '+current.times.length+'개 시각';
    $('case-context').textContent=current.context;$('outcome').textContent=current.outcome;
    $('extra-context').textContent=current.scene==='coast'?'남쪽에서 들어오는 공기: 18 ℃ · 습도 82%':current.stationNames.map((s,j)=>(j+1)+'번 지점 해발 '+current.elevations[j]+' m').join(' / ');
    $('site-legend').innerHTML=current.stationNames.map((s,j)=>'<span class="s'+(j+1)+'"><i class="dot"></i>'+e(siteName(j))+'</span>').join('');
    $('chart-legend').innerHTML=current.stationNames.map((s,j)=>'<span class="s'+(j+1)+'"><i class="legend-line"></i>'+e(siteName(j))+'</span>').join('');
    renderAnalysis();view('analysis');render();window.scrollTo({top:0,behavior:'instant'});
  }
  function view(mode){
    ['analysis','graph','model','table'].forEach(name=>{
      $(name+'-view').hidden=name!==mode;
      $(name+'-tab').setAttribute('aria-selected',String(name===mode));
      $(name+'-tab').tabIndex=name===mode?0:-1;
    });
  }
  function renderAnalysis(){
    const p=A.packet(current.id);
    $('field-records').innerHTML=current.times.map((time,i)=>'<article class="field-record"><h3>'+e(time)+'</h3><div class="table-wrap"><table><thead><tr><th>지점</th><th>습도 %</th><th>바람 m/s</th><th>구름량 %</th><th>강수 mm</th><th>시정 km</th></tr></thead><tbody>'+current.frames[i].map((r,j)=>'<tr><td class="s'+(j+1)+'">'+e(siteName(j))+'</td><td>'+r.humidity+'</td><td>'+wind(r)+' '+r.windSpeed+'</td><td>'+r.cloud+'</td><td>'+r.precipitation+'</td><td>'+r.visibility+'</td></tr>').join('')+'</tbody></table></div></article>').join('');
    $('analysis-model-target').textContent=p.modelTime+' · '+(current.focusStation+1)+'번 지점 '+p.modelStation;
    $('profile-table').innerHTML='<table><thead><tr><th>지면 위 높이 (m)</th><th>주변 기온 (℃)</th></tr></thead><tbody>'+p.profile.map(r=>'<tr><td>'+r.height+'</td><td>'+r.temperature+'</td></tr>').join('')+'</tbody></table>';
    $('profile-note').textContent=p.profileNote;
    $('analysis-parcel').innerHTML='<div><span>1 km까지 올린 공기</span><strong>'+p.parcel.lifted+'<small> ℃</small></strong><em>모형 계산값</em></div><span class="parcel-vs">비교</span><div><span>같은 높이의 주변 공기</span><strong>'+p.parcel.ambient+'<small> ℃</small></strong><em>제공된 상공 기온</em></div>';
  }
  function render(){
    $('metric-tabs').innerHTML=groups.map(m=>'<button data-metric="'+m.id+'" aria-pressed="'+(group===m.id)+'"><span class="metric-icon" aria-hidden="true">'+m.icon+'</span><span><b>'+m.label+'</b><small>'+m.unit+'</small></span></button>').join('');
    $('temperature-fields').hidden=group!=='temperature';
    document.querySelectorAll('[data-field]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.field===field)));
    $('chart-title').textContent=meta()[1];$('unit-label').textContent='단위 '+meta()[2];
    $('chart-note').textContent=field==='precipitation'?'막대는 해당 시각 직전 1시간의 강수량입니다.':field==='cloud'?'구름량: 하늘에서 구름이 차지하는 비율입니다. 0%는 맑음, 100%는 하늘 전체가 구름입니다. 지표 안개는 제외하며, 전후 비율의 차이는 %p로 표시합니다.':field==='windSpeed'?'풍향은 바람이 불어오는 쪽입니다. 점 사이의 선은 관측값을 연결한 것입니다.':field==='upperTemperature'?'각 지점 지면에서 1 km 위의 기온입니다. 점 사이의 선은 관측값을 연결한 것입니다.':field==='humidity'?'습도 차이 단위 %p: 75%에서 36%로 바뀌면 39%p 감소. 선은 관측값을 연결한 것입니다.':'점 사이의 선은 관측값을 연결한 것입니다. 관측한 시각 사이를 직선으로 연결했으며, 그 사이의 실제 변화를 모두 나타내지는 않습니다.';
    if(field==='visibility')$('chart-note').textContent='시정: 물체를 구별할 수 있는 거리입니다. 점 사이의 선은 관측값을 연결한 것입니다.';
    $('chart').innerHTML=chart();
    $('time-buttons').innerHTML=current.times.map((t,i)=>'<button data-time="'+i+'" aria-pressed="'+(frame===i)+'"><small>'+e(i===current.beforeIndex?'비교 기준':i===current.afterIndex?'보고서 비교':(t.split(' · ')[1]||''))+'</small>'+e(shortTime(i))+'</button>').join('');
    $('comparison-caption').textContent=meta()[1]+' · '+shortTime(current.beforeIndex)+' → '+shortTime(frame);
    $('comparison-table').innerHTML=comparison();
    $('all-tables').innerHTML=rawTables();
    $('site-map').innerHTML=map();
  }
  function chart(){
    const w=800,h=292,left=58,right=744,top=27,bottom=218;
    const bounds=C.bounds(field,current.frames),min=bounds[0],max=bounds[1],step=bounds[2],hours=C.elapsedHours(current.times);
    const xs=hours.map(t=>left+(right-left)*t/hours.at(-1)),y=v=>bottom-(v-min)/(max-min)*(bottom-top);
    let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+e(meta()[1]+' 시계열 그래프. 두 관측 지점 비교')+'">';
    svg+='<rect x="'+(xs[frame]-26)+'" y="12" width="52" height="217" rx="5" fill="#edf3f8"/>';
    for(let v=min;v<=max+.001;v+=step){
      const yy=y(v);svg+='<path class="grid" d="M'+left+' '+yy+'H'+right+'"/><text x="'+(left-13)+'" y="'+(yy+4)+'" text-anchor="end">'+num(v)+'</text>';
    }
    xs.forEach((x,i)=>{
      const label=current.times[i].match(/\d{1,2}시/)[0],day=current.times[i].startsWith('전날')?'전날':current.times[i].startsWith('다음 날')?'다음 날':'';
      const anchor=i===0?'start':i===current.times.length-1?'end':'middle';
      svg+='<text class="axis-label" x="'+x+'" y="252" text-anchor="'+anchor+'">'+e(label)+'</text>';
      if(day)svg+='<text class="axis-day" x="'+x+'" y="273" text-anchor="'+anchor+'">'+e(day)+'</text>';
    });
    for(let j=0;j<2;j++){
      const vals=current.frames.map(f=>f[j][field]);
      if(field!=='precipitation')svg+='<path d="'+vals.map((v,i)=>(i?'L':'M')+xs[i]+' '+y(v)).join(' ')+'" fill="none" stroke="'+colors[j]+'" stroke-width="2.6"'+(j?' stroke-dasharray="7 5"':'')+'/>';
      vals.forEach((v,i)=>{
        let x=xs[i],yy=y(v),ly;
        if(field==='precipitation'){
          x+=j?17:-17;
          svg+='<rect x="'+(x-12)+'" y="'+yy+'" width="24" height="'+(bottom-yy)+'" rx="2" fill="'+colors[j]+'" opacity=".85"/>';
          ly=yy-10;
        }else{
          const other=current.frames[i][1-j][field],close=Math.abs(y(other)-yy)<28;
          ly=close?(Math.abs(v-other)<.001?(j?yy+22:yy-13):(v>other?yy-13:yy+22)):yy-12;
          svg+=j?'<rect x="'+(x-4)+'" y="'+(yy-4)+'" width="8" height="8" fill="white" stroke="'+colors[j]+'" stroke-width="2"/>':'<circle cx="'+x+'" cy="'+yy+'" r="4.5" fill="white" stroke="'+colors[j]+'" stroke-width="2"/>';
        }
        const label=num(v)+(field==='windSpeed'?' '+C.direction(current.frames[i][j].windDirection):'');
        const anchor=field==='precipitation'?'middle':i===0?'start':i===current.times.length-1?'end':'middle';
        svg+='<text class="value-label" x="'+x+'" y="'+ly+'" text-anchor="'+anchor+'" style="fill:'+colors[j]+'">'+e(label)+'</text>';
        svg+='<circle class="point-hit" cx="'+x+'" cy="'+yy+'" r="13" tabindex="0" role="button" data-point="'+i+'" aria-label="'+e(siteName(j)+' '+shortTime(i)+' '+num(v)+' '+meta()[2]+(field==='windSpeed'?' '+wind(current.frames[i][j]):'')+' 비교')+'"><title>'+e(siteName(j)+' / '+shortTime(i)+' / '+label+' '+meta()[2])+'</title></circle>';
      });
    }
    return svg+'</svg>';
  }
  function comparison(){
    let html='<table><thead><tr><th scope="col">관측 지점</th><th scope="col">'+e(shortTime(current.beforeIndex))+' · 기준</th><th class="active-cell" scope="col">'+e(shortTime(frame))+' · 선택</th><th scope="col">차이</th></tr></thead><tbody>';
    for(let j=0;j<2;j++){
      const a=current.frames[current.beforeIndex][j],b=current.frames[frame][j],d=C.difference(field,a[field],b[field]);
      const diff=d.value===0?'같음':(d.value>0?'↑ +':'↓ −')+num(Math.abs(d.value))+' '+d.unit;
      const sub=r=>field==='windSpeed'?wind(r):field==='humidity'?'이슬점 '+r.dewpoint+' ℃':'';
      html+='<tr><td class="s'+(j+1)+'"><i class="dot"></i>'+e(siteName(j))+'</td><td class="number">'+num(a[field])+' <small>'+meta()[2]+'</small><span class="sub-number">'+sub(a)+'</span></td><td class="number active-cell">'+num(b[field])+' <small>'+meta()[2]+'</small><span class="sub-number">'+sub(b)+'</span></td><td class="delta '+(d.value===0?'same':'')+'">'+diff+'</td></tr>';
    }
    return html+'</tbody></table>';
  }
  function rawTables(){
    return [0,1].map(j=>{
      let html='<article class="raw-card"><h3 class="s'+(j+1)+'"><i class="dot"></i>'+e(siteName(j))+'</h3><div class="table-wrap"><table><thead><tr><th scope="col">항목 · 단위</th>'+current.times.map((t,i)=>'<th scope="col"'+(i===frame?' class="active-cell"':'')+'>'+e(shortTime(i))+'</th>').join('')+'</tr></thead><tbody>';
      fields.forEach(m=>{
        html+='<tr><td>'+m[1]+(m[2]?' ('+m[2]+')':'')+'</td>'+current.frames.map((rs,i)=>'<td'+(i===frame?' class="active-cell"':'')+'>'+(m[0]==='windDirection'?wind(rs[j]):num(rs[j][m[0]]))+'</td>').join('')+'</tr>';
      });
      return html+'</tbody></table></div></article>';
    }).join('');
  }
  function map(){
    let s='<svg viewBox="0 0 260 160" role="img" aria-label="'+e(shortTime(frame)+' 관측 지점과 지형')+'"><rect width="260" height="160" fill="#eff3ef"/>';
    if(current.scene==='mountain')s+='<path d="M0 145L60 125L130 32L200 125L260 145V160H0Z" fill="#c0cdb7"/><path d="M92 88L130 32L169 88L133 65Z" fill="#91ab90"/><text x="130" y="22" text-anchor="middle" fill="#647588" font-size="10">1,500 m</text><text x="30" y="151" fill="#647588" font-size="9">서쪽</text><text x="210" y="151" fill="#647588" font-size="9">동쪽</text>';
    if(current.scene==='plain')s+='<path d="M0 128Q70 115 130 129T260 123V160H0Z" fill="#c0cdb7"/><text x="130" y="152" text-anchor="middle" fill="#647588" font-size="10">← 25 km →</text>';
    if(current.scene==='field')s+='<path d="M0 100Q70 145 130 138T260 91V160H0Z" fill="#c0cdb7"/><text x="225" y="29" fill="#647588" font-size="16">'+((Number(current.times[frame].match(/\d{1,2}시/)[0])<7||Number(current.times[frame].match(/\d{1,2}시/)[0])>=18)?'☾':'☀')+'</text>';
    if(current.scene==='coast')s+='<rect y="110" width="260" height="50" fill="#b2cdd7"/><path d="M0 110Q70 105 130 112T260 108" stroke="white" fill="none" stroke-width="3"/><text x="169" y="143" font-size="10" fill="#477485">바다 12 ℃</text><text x="158" y="26" font-size="10" fill="#647588">북쪽 ↑</text>';
    const pos=current.scene==='coast'?[[70,105],[130,55]]:current.scene==='field'?[[55,130],[209,112]]:[[45,125],[215,125]];
    current.frames[frame].forEach((r,j)=>{
      const x=pos[j][0],y=pos[j][1];
      if(r.visibility<1)s+='<path d="M'+(x-25)+' '+(y-13)+'h50m-45 8h45m-48 9h48" stroke="white" stroke-width="5" stroke-linecap="round"/>';
      if(r.precipitation>0)s+='<text x="'+(x-8)+'" y="'+(y-29)+'" font-size="20" fill="#6b929d">☂</text>';
      if(r.windSpeed>=1)s+='<g transform="translate('+x+' '+(y-23)+') rotate('+((r.windDirection+180)%360)+')"><path d="M0 8V-9m-4 4l4-4 4 4" stroke="#728b98" stroke-width="1.5" fill="none"/></g>';
      s+='<circle cx="'+x+'" cy="'+y+'" r="10" fill="'+colors[j]+'"/><text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" fill="white" font-size="10">'+(j+1)+'</text>';
    });
    return s+'</svg>';
  }
  function selectTime(i){frame=i;render();}
  function downloadCSV(){
    const keys=['temperature','surfaceTemperature','upperTemperature','humidity','dewpoint','windDirection','windSpeed','cloud','precipitation','visibility'];
    const rows=[['사례','시각','지점','지상기온_℃','지표면온도_℃','지면위1km기온_℃','상대습도_%','이슬점_℃','풍향_불어오는쪽_도','풍속_m/s','구름량_%','직전1h강수량_mm','시정_km','자료구분']];
    current.frames.forEach((rs,i)=>rs.forEach((r,j)=>rows.push([current.id,current.times[i],siteName(j),...keys.map(k=>r[k]),'교육용 재구성 자료'])));
    const url=URL.createObjectURL(new Blob([C.csv(rows)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
    a.href=url;a.download='기상자료_'+current.id+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    toast('자료 CSV 다운로드를 요청했어요.');
  }
  $('case-options').addEventListener('click',ev=>{const button=ev.target.closest('[data-case]');if(button)start(button.dataset.case);});
  $('switch-user').addEventListener('click',()=>{$('entry').hidden=false;$('lab').hidden=true;window.scrollTo({top:0,behavior:'instant'});});
  document.querySelector('.brand').addEventListener('click',ev=>{ev.preventDefault();$('entry').hidden=false;$('lab').hidden=true;window.scrollTo({top:0,behavior:'instant'});});
  $('metric-tabs').addEventListener('click',ev=>{const b=ev.target.closest('[data-metric]');if(b){group=b.dataset.metric;field=group;render();}});
  $('temperature-fields').addEventListener('click',ev=>{const b=ev.target.closest('[data-field]');if(b){field=b.dataset.field;render();}});
  $('time-buttons').addEventListener('click',ev=>{const b=ev.target.closest('[data-time]');if(b)selectTime(Number(b.dataset.time));});
  $('chart').addEventListener('click',ev=>{const b=ev.target.closest('[data-point]');if(b)selectTime(Number(b.dataset.point));});
  $('chart').addEventListener('keydown',ev=>{const b=ev.target.closest('[data-point]');if(b&&['Enter',' '].includes(ev.key)){ev.preventDefault();selectTime(Number(b.dataset.point));}});
  const modes=['analysis','graph','model','table'];
  modes.forEach(mode=>{$(mode+'-tab').addEventListener('click',()=>view(mode));$(mode+'-tab').addEventListener('keydown',ev=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)){ev.preventDefault();const index=modes.indexOf(mode),next=ev.key==='Home'?'analysis':ev.key==='End'?'table':modes[(index+(ev.key==='ArrowRight'?1:3))%4];view(next);$(next+'-tab').focus();}});});
  $('download-data').addEventListener('click',downloadCSV);
})();
