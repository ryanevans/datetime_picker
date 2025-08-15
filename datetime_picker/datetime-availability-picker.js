// datetime-availability-picker.js
// Reusable inline availability UI for Flatpickr with prototype behavior and styling
// Exposes: window.attachDominoAvailability(instance, options)

(function(){
  // Do not return early; we want to inject styles even if Flatpickr isn't on window yet
  function injectOnce(id, css){
    if(document.getElementById(id)) return;
    const s=document.createElement('style');
    s.id=id; s.textContent=css; document.head.appendChild(s);
  }

  // Helper to assign multiple inline styles safely
  function setStyles(el, styles){
    if(!el || !styles) return;
    Object.assign(el.style, styles);
  }

  // Constants hoisted for reuse
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MINUTE_STEPS = [0, 15, 30, 45];
  const DEMO_TIMES = ['12:00 PM','12:30 PM','1:00 PM','1:30 PM'];

  // Time conversion helper (12h -> 24h)
  function to24Hour(hour12, ampm){
    const h = parseInt(hour12, 10);
    if (ampm === 'PM' && h !== 12) return h + 12;
    if (ampm === 'AM' && h === 12) return 0;
    return h;
  }

  // Focus helpers (module-scoped)
  function applyFocusStyles(el){
    if(!el) return;
    el.style.borderColor = '#111';
    el.style.outline = 'none';
    el.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.1)';
  }
  function clearFocusStyles(el){
    if(!el) return;
    el.style.borderColor = '#d1d5db';
    el.style.boxShadow = 'none';
  }

  // Prebuilt success icon (clone per use)
  const SUCCESS_ICON = (() => {
    try{
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('width','16');
      svg.setAttribute('height','16');
      svg.setAttribute('viewBox','0 0 24 24');
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d','M20 6L9 17l-5-5');
      path.setAttribute('fill','none');
      path.setAttribute('stroke','#111');
      path.setAttribute('stroke-width','2');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-linejoin','round');
      svg.appendChild(path);
      return svg;
    }catch(_){ return null; }
  })();

  // Consolidated styles: spinner keyframes, calendar appearance, input focus, time row
  injectOnce('dap-style', `
    @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
    @media (max-width:480px){
      .fp-suggested-times{flex-wrap:nowrap!important;overflow-x:auto!important;}
      .fp-suggested-times li{flex:0 0 auto!important;}
    }
    :root{--fp-arrow-col:44px;}
    .flatpickr-calendar{border-radius:12px!important;border:1px solid #e1e5e9!important;width:auto!important;min-width:360px!important;background:#fff!important;}
    .flatpickr-months{padding:16px 8px 8px 8px!important;background:#fff!important;display:grid!important;grid-template-columns:var(--fp-arrow-col) 1fr var(--fp-arrow-col)!important;align-items:center!important;gap:0!important;position:relative!important;}
    .flatpickr-months .flatpickr-month{grid-column:2!important;display:flex!important;justify-content:center!important;align-items:center!important;width:100%!important;}
    .flatpickr-months .flatpickr-prev-month,.flatpickr-months .flatpickr-next-month{width:var(--fp-arrow-col)!important;}
    /* merged into single rule below */
    .flatpickr-current-month .numInputWrapper{display:none!important;}
    .flatpickr-weekdays{padding:0 12px!important;}
    .flatpickr-weekdays .flatpickr-weekdaycontainer{display:grid!important;grid-template-columns:repeat(7,1fr)!important;gap:6px!important;padding:0!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;}
    .flatpickr-weekday{border:none!important;color:#6b7280!important;font-weight:600!important;text-align:center!important;}
    .flatpickr-days{padding:8px 12px!important;width:100%!important;background:#fff!important;}
    .flatpickr-days .dayContainer{display:grid!important;grid-template-columns:repeat(7,1fr)!important;gap:6px!important;padding:0!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;}
    .flatpickr-day{border:none!important;border-radius:8px!important;margin:0!important;width:auto!important;max-width:none!important;display:flex!important;align-items:center!important;justify-content:center!important;}
    .flatpickr-day.selected,.flatpickr-day.startRange,.flatpickr-day.endRange,.flatpickr-day.selected:focus,.flatpickr-day.selected:hover{background:#111!important;border-color:#111!important;color:#fff!important;border-radius:10px!important;}
    .flatpickr-prev-month svg,.flatpickr-next-month svg{width:16px!important;height:16px!important;stroke-width:0.8px!important;stroke:#6b7280!important;}
    .flatpickr-prev-month,.flatpickr-next-month{top:18px!important;justify-self:center!important;z-index:2!important;}
    .flatpickr-current-month{padding-top:8px!important;font-family:'Nunito Sans',sans-serif!important;font-weight:700!important;font-size:1.25rem!important;display:flex!important;align-items:center!important;justify-content:center!important;width:auto!important;position:static!important;left:auto!important;transform:none!important;z-index:1!important;}
    .flatpickr-current-month .flatpickr-monthDropdown-months{border:none!important;outline:none!important;background:none!important;padding:0 8px!important;margin:0!important;font-family:'Nunito Sans',sans-serif!important;font-weight:700!important;font-size:1.25rem!important;-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:none!important;width:auto!important;min-width:0!important;text-align:center!important;text-align-last:center!important;}
    .flatpickr-monthDropdown-months::-ms-expand{display:none!important;}
    .custom-time-row{position:relative;background:#fff!important;border-radius:0 0 12px 12px!important;margin:0!important;padding:12px 8px 4px!important;border-bottom:none!important;}
    .custom-time-row::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:#e1e5e9!important;}
    /* Input focus styling */
    .flatpickr-input:focus,
    .flatpickr-input.active,
    .flatpickr-input:focus-visible{
      outline: none !important;
      border-color: #111 !important;
      box-shadow: 0 0 0 3px rgba(17,17,17,0.1) !important;
    }
    /* Time row background */
    .flatpickr-calendar .flatpickr-time{background:#fff!important;box-shadow:none!important;border-top:1px solid #e1e5e9!important;border-bottom:none!important;margin-top: 4px !important;}
    .flatpickr-calendar .flatpickr-time .numInputWrapper{background:#fff!important;}
  `);

  function buildAvailabilityUI(instance, options){
    if(instance.calendarContainer.querySelector('.fp-avail-section')) return;

    const availSection = document.createElement('div');
    availSection.className = 'fp-avail-section';
    setStyles(availSection, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '6px 16px 10px' });

    // Loader row
    const loaderRow = document.createElement('div');
    loaderRow.className = 'fp-avail-loader';
    setStyles(loaderRow, { display: 'none', alignItems: 'center', gap: '6px' });
    const spin = document.createElement('span');
    setStyles(spin, { width: '16px', height: '16px', border: '2px solid #ccc', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' });
    loaderRow.appendChild(spin);
    const loaderTxt = document.createElement('span');
    loaderTxt.textContent = 'Checking…';
    setStyles(loaderTxt, { fontSize: '0.9rem', color: '#6b7280' });
    loaderRow.appendChild(loaderTxt);

    // Message row
    const msgRow = document.createElement('div');
    msgRow.className = 'fp-avail-msg';
    setStyles(msgRow, { display: 'none', fontSize: '0.9rem', fontWeight: '500', color: '#111', alignItems: 'center', justifyContent: 'center', gap: '6px' });

    // Suggested times list
    const timesList = document.createElement('ul');
    timesList.className = 'fp-suggested-times';
    setStyles(timesList, { listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' });

    // Confirm button (hidden by default; shown on success when enabled via option)
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = 'Close';
    confirmBtn.className = 'fp-confirm-btn';
    setStyles(confirmBtn, { padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'none', height: '44px', boxSizing: 'border-box' });
    confirmBtn.addEventListener('click', () => { try{ instance.close(); }catch(_){} });

    // Check availability button
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    const CHECK_LABEL = 'Check availability';
    const CHECKING_LABEL = 'Checking availability...';
    checkBtn.textContent = CHECK_LABEL;
    checkBtn.className = 'fp-check-btn';
    setStyles(checkBtn, { padding: '8px 14px', background: '#111', color: '#fff', border: '1px solid #111', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', height: '44px', boxSizing: 'border-box' });

    availSection.appendChild(loaderRow);
    availSection.appendChild(msgRow);
    availSection.appendChild(timesList);
    availSection.appendChild(confirmBtn);
    availSection.appendChild(checkBtn);

    instance.calendarContainer.appendChild(availSection);

    // Behavior flags
    let skipOnChange = false;

    function restoreCheckBtn(){
      checkBtn.style.display = 'block';
      checkBtn.disabled = false;
      checkBtn.setAttribute('aria-disabled','false');
      setStyles(checkBtn, { opacity: '1', cursor: 'pointer' });
      checkBtn.removeAttribute('aria-busy');
      const btnSpin = checkBtn.querySelector('.btn-inline-spinner');
      if (btnSpin) btnSpin.remove();
      checkBtn.textContent = CHECK_LABEL;
    }

    function resetState(){
      loaderRow.style.display = 'none';
      msgRow.style.display = 'none';
      timesList.innerHTML = '';
      timesList.style.display = 'none';
      confirmBtn.style.display = 'none';
      restoreCheckBtn();
    }

    function setAvailabilityState(isAvailable){
      timesList.innerHTML = '';
      if (isAvailable){
        try {
          const icon = (function(){
            try{ return SUCCESS_ICON ? SUCCESS_ICON.cloneNode(true) : null; }catch(_){ return null; }
          })();
          const txt = document.createElement('span');
          txt.textContent = 'Availability confirmed';
          if (icon && typeof msgRow.replaceChildren === 'function') {
            msgRow.replaceChildren(icon, txt);
          } else {
            while (msgRow.firstChild) { msgRow.removeChild(msgRow.firstChild); }
            if (icon) msgRow.appendChild(icon);
            msgRow.appendChild(txt);
          }
        } catch(_){ msgRow.textContent = 'Availability confirmed'; }
        msgRow.style.color = '#111';
        checkBtn.style.display = 'none';
        timesList.style.display = 'none';
        if(options.showConfirmButton !== false){
          confirmBtn.style.display = 'block';
          try{ confirmBtn.focus(); }catch(_){}
        }
      } else {
        msgRow.textContent = 'Unavailable, select another time';
        msgRow.style.color = '#dc2626';
        timesList.style.display = 'flex';
        // Build suggested time pills
        const fragment = document.createDocumentFragment();
        DEMO_TIMES.forEach(t => {
          const li = document.createElement('li');
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.textContent = t;
          Object.assign(pill.style, {
            padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '9999px',
            background: '#fff', fontSize: '0.85rem', cursor: 'pointer'
          });
          pill.setAttribute('aria-label', `Select ${t}`);
          pill.addEventListener('click', () => {
            const selDate = instance.selectedDates[0] || new Date();
            const parts = t.match(/(\d+):(\d+) (AM|PM)/);
            const hNum = parseInt(parts[1],10);
            const mNum = parseInt(parts[2],10);
            const ampm = parts[3];
            const hour24 = to24Hour(hNum, ampm);
            selDate.setHours(hour24, mNum, 0, 0);
            skipOnChange = true;
            instance.setDate(selDate, true);
            try{
              if (typeof instance._dapSetTimeControlsFromDate === 'function'){
                instance._dapSetTimeControlsFromDate(selDate);
              }
            }catch(_){ }
            timesList.style.display = 'none';
            checkBtn.style.display = 'none';
            if(options.showConfirmButton !== false){
              confirmBtn.style.display = 'block';
              try{ confirmBtn.focus(); }catch(_){}
            }
            msgRow.style.display = 'none';
          });
          li.appendChild(pill);
          fragment.appendChild(li);
        });
        timesList.appendChild(fragment);
        checkBtn.style.display = 'none';
      }
      try{
        requestAnimationFrame(() => {
          try{ instance.calendarContainer.scrollIntoView({ block: 'center', behavior: 'smooth' }); }catch(_){ }
        });
      }catch(_){
        setTimeout(() => {
          try{ instance.calendarContainer.scrollIntoView({ block: 'center', behavior: 'smooth' }); }catch(_){ }
        }, 100);
      }
    }

    function startCheck(){
      // Disable and show inline spinner inside the button (white for dark button)
      checkBtn.disabled = true;
      checkBtn.setAttribute('aria-disabled','true');
      setStyles(checkBtn, { opacity: '0.38', cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '8px' });
      checkBtn.setAttribute('aria-busy','true');
      msgRow.style.display = 'none';
      timesList.style.display = 'none';
      timesList.innerHTML = '';
      confirmBtn.style.display = 'none';
      loaderRow.style.display = 'none';

      let btnSpinner = checkBtn.querySelector('.btn-inline-spinner');
      if(!btnSpinner){
        btnSpinner = document.createElement('span');
        btnSpinner.className='btn-inline-spinner';
        setStyles(btnSpinner, { width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' });
      }
      checkBtn.textContent='';
      checkBtn.appendChild(btnSpinner);
      const btnLabel=document.createElement('span');
      btnLabel.textContent='Checking availability...';
      setStyles(btnLabel, { color:'#fff' });
      checkBtn.appendChild(btnLabel);

      setTimeout(()=>{
        checkBtn.removeAttribute('aria-busy');
        msgRow.style.display='flex';
        const isAvailable = (function(){
          try{
            if (typeof window.checkAvailability === 'function'){
              return !!window.checkAvailability(instance);
            }
          }catch(_){ /* no-op */ }
          return Math.random() < 0.5;
        })();
        setAvailabilityState(isAvailable);
        // If button still visible, restore label
        if(checkBtn && checkBtn.style.display!=='none'){
          restoreCheckBtn();
        }
      },600);
    }

    checkBtn.addEventListener('click', startCheck);

    // Expose instance-level starter for external triggers
    instance._dapStartCheck = startCheck;

    // Reset state when user changes date/time (unless set via suggested pill)
    instance.config.onChange.push(() => {
      if (skipOnChange){ skipOnChange = false; return; }
      resetState();
    });

    // Initial state: optionally disabled until user changes
    if (options.autoDisableUntilChange){
      checkBtn.disabled = true;
      checkBtn.setAttribute('aria-disabled','true');
      setStyles(checkBtn, { opacity: '0.38', cursor: 'default' });
    }
  }

  // Public API
  window.attachDominoAvailability = function(instance, options){
    const opts = options || {};
    // Prevent selecting past dates by default (unless already set by caller)
    try{
      if(!instance.config.minDate){
        instance.set('minDate', new Date());
      }
    }catch(_){ try{ instance.config.minDate = new Date(); }catch(__){} }
    // 1) Build custom time UI first so it appears above availability section
    if (opts.customTimeUI) {
      // Build custom time row with dropdowns and AM/PM toggle
      try {
        // Avoid duplicate
        if (instance && !instance.calendarContainer.querySelector('.custom-time-row')){
          const timeContainer = instance.timeContainer;
          if (!timeContainer) return;
          // Hide native time inputs
          timeContainer.style.display = 'none';

          const customTimeRow = document.createElement('div');
          customTimeRow.className = 'custom-time-row';
          customTimeRow.style.cssText = 'display:flex;align-items:center;gap:4px;padding:12px;justify-content:center;';

          const hourSelect=document.createElement('select');
          const minuteSelect=document.createElement('select');
          styleSelect(hourSelect); styleSelect(minuteSelect);
          const colon=document.createElement('span');
          colon.textContent=':';
          colon.style.cssText='font-weight:700;font-size:1.1rem;line-height:44px;padding:0 2px;user-select:none;';
          for(let i=1;i<=12;i++){const o=document.createElement('option');o.value=o.textContent=i.toString().padStart(2,'0');hourSelect.appendChild(o);} 
          MINUTE_STEPS.forEach(m=>{const o=document.createElement('option');o.value=o.textContent=m.toString().padStart(2,'0');minuteSelect.appendChild(o);});

          const amPmToggle = document.createElement('button');
          amPmToggle.type = 'button';
          amPmToggle.textContent = 'AM';
          amPmToggle.style.cssText = 'padding:10px 16px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-weight:600;font-size:1.1rem;cursor:pointer;min-width:60px;';

          customTimeRow.appendChild(hourSelect);
          customTimeRow.appendChild(colon);
          customTimeRow.appendChild(minuteSelect);
          customTimeRow.appendChild(amPmToggle);

          const calEl = instance.calendarContainer.querySelector('.flatpickr-calendar');
          if (calEl && calEl.parentNode) {
            calEl.parentNode.insertBefore(customTimeRow, calEl.nextSibling);
          } else {
            instance.calendarContainer.appendChild(customTimeRow);
          }

          function updateTime(){
            const h=parseInt(hourSelect.value,10); const m=parseInt(minuteSelect.value,10);
            const hour24=to24Hour(h, amPmToggle.textContent);
            const d=instance.selectedDates[0]||new Date();
            d.setHours(hour24,m,0,0);
            instance.setDate(d,false);
          }
          hourSelect.addEventListener('focus',()=>applyFocusStyles(hourSelect));
          hourSelect.addEventListener('blur',()=>clearFocusStyles(hourSelect));
          minuteSelect.addEventListener('focus',()=>applyFocusStyles(minuteSelect));
          minuteSelect.addEventListener('blur',()=>clearFocusStyles(minuteSelect));
          amPmToggle.addEventListener('focus',()=>applyFocusStyles(amPmToggle));
          amPmToggle.addEventListener('blur',()=>clearFocusStyles(amPmToggle));
          hourSelect.addEventListener('change',()=>{updateTime(); if(instance._dapStartCheck) instance._dapStartCheck();});
          minuteSelect.addEventListener('change',()=>{updateTime(); if(instance._dapStartCheck) instance._dapStartCheck();});
          amPmToggle.addEventListener('click',function(){this.textContent=this.textContent==='AM'?'PM':'AM'; updateTime(); if(instance._dapStartCheck) instance._dapStartCheck();});

          const currentDate=instance.selectedDates[0]||new Date();
          let currentHour=currentDate.getHours();
          const isPM=currentHour>=12; if(currentHour===0) currentHour=12; if(currentHour>12) currentHour-=12;
          hourSelect.value=currentHour.toString().padStart(2,'0');
          const currentMinute=currentDate.getMinutes();
          const closestMinute=MINUTE_STEPS.reduce((prev,curr)=>Math.abs(curr-currentMinute)<Math.abs(prev-currentMinute)?curr:prev);
          minuteSelect.value=closestMinute.toString().padStart(2,'0');
          amPmToggle.textContent=isPM?'PM':'AM';
        }
      } catch(_){}
    }
    // 2) Then build availability section so it's placed below time inputs
    buildAvailabilityUI(instance, {
      showConfirmButton: opts.showConfirmButton !== false,
      autoDisableUntilChange: !!opts.autoDisableUntilChange
    });
  };

  // Back-compat helper: global starter compatible with previous code
  // Accepts optional instance; if omitted, uses the most recently opened calendar in DOM
  window.startCheck = function(instance){
    try{
      const inst = instance || (document.querySelector('.flatpickr-calendar.open')?._flatpickr || null) || null;
      if(inst && typeof inst._dapStartCheck === 'function') inst._dapStartCheck();
    }catch(_){ /* no-op */ }
  }
})();

function styleSelect(sel){
  sel.style.cssText='border-radius:10px;border:1px solid #d1d5db;padding:8px 8px;font-size:1.1rem;font-weight:600;text-align:center;background:#fff;min-width:56px;width:56px;transition:all 0.2s ease;height:44px;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;-moz-appearance:none;box-shadow:none;';
}


