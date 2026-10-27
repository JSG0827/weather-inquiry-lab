(function(root){
  'use strict';
  const C=root.WeatherCore||(typeof require==='function'?require('./core.js'):null);
  const D=root.WeatherData||(typeof require==='function'?require('./data.js'):null);
  const specs={
    A:{rows:[['동쪽 기슭 기온','temperature',1],['동쪽 기슭 상대 습도','humidity',1],['서쪽 기슭 직전 1시간 강수량','precipitation',0]],
      notes:[['산맥 높이','1,500 m'],['13시 산맥 양쪽의 풍향','서풍'],['13시 동쪽 기슭의 직전 1시간 강수량','0 mm']]},
    B:{rows:[['지점 1 지상 기온','temperature',0],['지점 1 지표면 온도','surfaceTemperature',0],['지점 1 구름량','cloud',0]],
      notes:[['두 관측 지점 사이 거리','25 km'],['14시 지점 1 상대 습도','85%'],['16시 지점 1 직전 1시간 강수량','32 mm']]},
    C:{rows:[['들판 지표면 온도','surfaceTemperature',0],['들판 지상 기온','temperature',0],['들판 상대 습도','humidity',0]],
      notes:[['새벽 들판 구름량','0%'],['새벽 들판 풍속','0.2 m/s'],['들판 시정 전날 21시 → 다음 날 05시','20 → 0.2 km']]},
    D:{rows:[['해안 기온','temperature',0],['해안 상대 습도','humidity',0],['해안 시정','visibility',0]],
      notes:[['남쪽에서 유입되는 공기의 기온과 상대 습도','18 ℃ / 82%'],['해수면 온도','12 ℃'],['해안의 주된 풍향','남풍']]}
  };
  const units={temperature:'℃',surfaceTemperature:'℃',upperTemperature:'℃',humidity:'%',precipitation:'mm',cloud:'%',visibility:'km'};
  function packet(id){
    const c=D.cases.find(x=>x.id===id);
    if(!c)throw new Error('알 수 없는 자료 유형입니다.');
    const s=specs[id],r=c.frames[c.afterIndex][c.focusStation];
    return{
      id,title:c.title,period:c.period,context:c.context,provenance:D.provenance,
      beforeTime:c.times[c.beforeIndex],afterTime:c.times[c.afterIndex],modelTime:c.times[c.afterIndex],modelStation:c.stationNames[c.focusStation],
      rows:s.rows.map((m,i)=>{
        const a=c.frames[c.beforeIndex][m[2]][m[1]],b=c.frames[c.afterIndex][m[2]][m[1]];
        return{index:i+1,label:m[0],key:m[1],station:m[2],before:a,after:b,unit:units[m[1]],difference:C.difference(m[1],a,b)};
      }),
      notes:s.notes.map((m,i)=>({index:i+1,label:m[0],value:m[1]})),
      parcel:{height:1000,lifted:C.parcelAt1km(r.temperature,r.humidity).temperature,ambient:r.upperTemperature,unit:'℃'},
      profile:[0,250,500,750,1000].map(height=>({height,temperature:Math.round((r.temperature+(r.upperTemperature-r.temperature)*height/1000)*10)/10})),
      profileNote:'지상부터 1 km까지 기온이 직선적으로 변한다고 가정한 교육용 기층 모형입니다.',
      graph:{key:'temperature',station:c.focusStation,label:c.stationNames[c.focusStation]+' 지상 기온',times:c.times,values:c.frames.map(f=>f[c.focusStation].temperature),hours:C.elapsedHours(c.times),bounds:C.bounds('temperature',c.frames)},
      modelNote:'관측값이 아닌 단순 계산 모형입니다. 공기를 외력으로 지면 위 1 km까지 올리며, 혼합 없이 건조 10 ℃/km와 습윤 5 ℃/km를 적용합니다. 상승 경향의 판단은 학생이 합니다.'
    };
  }
  const api={version:'assessment-v7-seven-times',packet};
  root.WeatherAnalysis=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
