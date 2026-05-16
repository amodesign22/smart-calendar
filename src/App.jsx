import { useState, useEffect, useRef } from "react"

const MODEL = "claude-sonnet-4-20250514"

function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function parseICSDate(dt) {
  return new Date(dt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function generateICS(events, attendees) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SmartCalendar//EN","CALSCALE:GREGORIAN","METHOD:REQUEST"]
  for (const ev of events) {
    const uid = Date.now() + "-" + Math.random().toString(36).slice(2) + "@smartcal"
    const startDate = new Date(ev.start)
    const reminderDate = new Date(startDate)
    reminderDate.setDate(reminderDate.getDate() - 1)
    reminderDate.setHours(9, 0, 0, 0)

    lines.push("BEGIN:VEVENT")
    lines.push("UID:" + uid)
    lines.push("SUMMARY:" + ev.title)
    lines.push("DTSTART:" + parseICSDate(ev.start))
    lines.push("DTEND:" + parseICSDate(ev.end))
    if (ev.description) lines.push("DESCRIPTION:" + ev.description)
    for (const email of attendees) {
      if (email.trim()) lines.push("ATTENDEE;RSVP=TRUE:mailto:" + email.trim())
    }
    lines.push("ORGANIZER:mailto:organizer@smartcal")
    lines.push("BEGIN:VALARM")
    lines.push("TRIGGER;VALUE=DATE-TIME:" + parseICSDate(reminderDate.toISOString()))
    lines.push("ACTION:DISPLAY")
    lines.push("DESCRIPTION:提醒：" + ev.title)
    lines.push("END:VALARM")
    lines.push("END:VEVENT")
  }
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

function downloadICS(events, attendees) {
  const blob = new Blob([generateICS(events, attendees)], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "events.ics"
  a.click()
  URL.revokeObjectURL(url)
}

function addAllToGoogleCalendar(events, prefix) {
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    const title = encodeURIComponent(ev.title)
    const start = ev.start.replace(/[-:]/g, "").slice(0, 15)
    const end = ev.end.replace(/[-:]/g, "").slice(0, 15)
    const details = encodeURIComponent(ev.description || "")
    const tz = encodeURIComponent(getUserTimezone())
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title + "&dates=" + start + "/" + end + "&details=" + details + "&ctz=" + tz
    setTimeout(function() { window.open(url, "_blank") }, i * 800)
  }
}

function MarbleCanvas() {
  const ref = useRef()
  useEffect(function() {
    const c = ref.current
    const w = c.width = window.innerWidth
    const h = c.height = window.innerHeight
    const ctx = c.getContext("2d")
    ctx.fillStyle = "#e8e8ea"
    ctx.fillRect(0, 0, w, h)
    const patches = [
      [0.15,0.1,0.45,"rgba(210,210,215,0.55)"],
      [0.6,0.3,0.38,"rgba(200,200,205,0.45)"],
      [0.3,0.65,0.4,"rgba(205,205,210,0.4)"],
      [0.75,0.7,0.35,"rgba(215,215,218,0.35)"],
      [0.5,0.1,0.3,"rgba(195,195,200,0.3)"],
    ]
    for (const p of patches) {
      const g = ctx.createRadialGradient(p[0]*w, p[1]*h, 0, p[0]*w, p[1]*h, p[2]*w)
      g.addColorStop(0, p[3])
      g.addColorStop(1, "rgba(232,232,234,0)")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
    function drawVein(x1, y1, x2, y2, color, lw, alpha, jitter) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      for (let i = 1; i <= 60; i++) {
        const t = i / 60
        ctx.lineTo(
          x1 + (x2-x1)*t + (Math.random()-0.5)*jitter,
          y1 + (y2-y1)*t + (Math.random()-0.5)*jitter*0.4
        )
      }
      ctx.stroke()
      ctx.restore()
    }
    drawVein(0.05*w,0.2*h,0.7*w,0.5*h,"#fff",2.5,0.7,60)
    drawVein(0.08*w,0.22*h,0.72*w,0.52*h,"#f0f0f2",0.8,0.4,30)
    drawVein(0.2*w,0.0*h,0.55*w,0.8*h,"#dcdcde",1.5,0.45,50)
    drawVein(0.4*w,0.1*h,0.8*w,0.9*h,"#fff",1.8,0.5,45)
    drawVein(0.6*w,0.0*h,0.35*w,1.0*h,"#d8d8db",1.2,0.35,40)
    drawVein(0.75*w,0.15*h,0.9*w,0.85*h,"#fff",1.0,0.4,35)
    drawVein(0.0*w,0.5*h,0.9*w,0.6*h,"#e0e0e2",0.8,0.25,30)
    drawVein(0.1*w,0.75*h,0.85*w,0.4*h,"#fff",1.5,0.35,40)
  }, [])
  return (
    <canvas ref={ref} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}} />
  )
}

const inputStyle = {
  width:"100%", boxSizing:"border-box", fontSize:14,
  padding:"8px 12px", borderRadius:8, border:"none",
  background:"rgba(255,255,255,0.6)", color:"#111",
  fontFamily:"inherit", outline:"none",
}

const sectionStyle = {
  background:"rgba(255,255,255,0.3)",
  backdropFilter:"blur(10px)",
  WebkitBackdropFilter:"blur(10px)",
  border:"0.5px solid rgba(255,255,255,0.6)",
  borderRadius:14, padding:"1.25rem", marginBottom:16,
  position:"relative", zIndex:1,
}

const labelStyle = {
  fontSize:12, fontWeight:500, color:"#666",
  display:"block", marginBottom:6,
  textTransform:"uppercase", letterSpacing:"0.04em",
}

const blackBarStyle = {
  display:"flex", alignItems:"center",
  background:"#111", color:"#fff",
  borderRadius:8, padding:"8px 14px", marginBottom:14,
  fontSize:14, fontWeight:500,
}

const accentCoral = "#D85A30"
const accentBlue = "#1a73e8"

function EmailTag(props) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(24,95,165,0.12)",color:"#185FA5",borderRadius:99,fontSize:12,padding:"3px 10px",border:"0.5px solid rgba(24,95,165,0.3)",margin:"2px"}}>
      {props.email}
      <button onClick={props.onRemove} style={{background:"none",border:"none",cursor:"pointer",color:"#185FA5",padding:0,fontSize:14,lineHeight:1}}>x</button>
    </span>
  )
}

function EventCard(props) {
  const ev = props.ev
  const idx = props.idx
  return (
    <div style={{background:"rgba(255,255,255,0.4)",border:"0.5px solid rgba(255,255,255,0.6)",borderRadius:10,padding:"1rem",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{flex:1,marginRight:8}}>
          {props.prefix && <span style={{fontSize:13,fontWeight:500,color:"#888",marginRight:2}}>{props.prefix}</span>}
          <input value={ev.title} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {title:e.target.value})) }}
            style={Object.assign({}, inputStyle, {fontSize:15,fontWeight:500})} />
        </div>
        <button onClick={function(){ props.onRemove(idx) }} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:20,padding:"0 4px",lineHeight:1}}>x</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div>
          <label style={labelStyle}>開始時間</label>
          <input type="datetime-local" value={ev.start} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {start:e.target.value})) }} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>結束時間</label>
          <input type="datetime-local" value={ev.end} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {end:e.target.value})) }} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>備註（選填）</label>
        <input value={ev.description || ""} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {description:e.target.value})) }} placeholder="事件說明..." style={inputStyle} />
      </div>
    </div>
  )
}

export default function App() {
  const [input, setInput] = useState("")
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [attendees, setAttendees] = useState([])
  const [emailInput, setEmailInput] = useState("")
  const [prefix, setPrefix] = useState("")
  const [timezone] = useState(getUserTimezone())

  function addAttendee() {
    const e = emailInput.trim()
    if (!e || e.indexOf("@") < 0) return
    if (attendees.indexOf(e) < 0) setAttendees(function(a){ return a.concat([e]) })
    setEmailInput("")
  }

  function updateEvent(idx, updated) {
    setEvents(function(evs){ return evs.map(function(e, i){ return i === idx ? updated : e }) })
  }

  function removeEvent(idx) {
    setEvents(function(evs){ return evs.filter(function(_, i){ return i !== idx }) })
  }

  function fixDatetime(str) {
    if (!str) return ""
    // 確保格式為 YYYY-MM-DDTHH:MM
    const d = new Date(str)
    if (isNaN(d.getTime())) return ""
    const pad = function(n){ return String(n).padStart(2, "0") }
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes())
  }

  function parseWithAI() {
    if (!input.trim()) return
    setLoading(true)
    setError("")
    const today = new Date().toISOString().slice(0, 10)
    const currentYear = new Date().getFullYear()
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: "Today is " + today + ". User timezone: " + timezone + ". Current year is " + currentYear + ". Parse the following text and extract all calendar events. When no year is specified, assume the current year (" + currentYear + "). If a later event has a month that is earlier than the previous event's month (e.g. previous was December, next is January), automatically advance the year by 1. Return ONLY a valid JSON array, no markdown, no explanation. Each object: title (string), start (ISO datetime in local time, must include full year), end (ISO datetime in local time, default +1hr, if event is all day set start to 00:00 and end to 23:59), description (string).\n\nText:\n" + input
        }]
      })
    })
    .then(function(res){ return res.json() })
    .then(function(data){
      if (data.error) {
        setError("API錯誤：" + JSON.stringify(data.error))
        setLoading(false)
        return
      }
      const text = (data.content || []).map(function(b){ return b.text || "" }).join("")
      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed) && parsed.length > 0) {
        setEvents(function(evs){ return evs.concat(parsed) })
        setInput("")
      } else {
        setError("未能解析到事件，請重新描述。")
      }
      setLoading(false)
    })
    .catch(function(){
      setError("連線失敗，請稍後再試。")
      setLoading(false)
    })
  }

  return (
    <div style={{minHeight:"100vh",fontFamily:"sans-serif",position:"relative"}}>
      <MarbleCanvas />
      <div style={{position:"relative",zIndex:1,maxWidth:640,margin:"0 auto",padding:"1.5rem 1rem"}}>

        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:500,margin:"0 0 4px",color:"#111"}}>智慧行事曆建立工具</h2>
          <p style={{fontSize:14,color:"#555",margin:"0 0 2px"}}>輸入事件、設定共用對象，匯出 .ics 直接加入行事曆</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>目前時區：{timezone}</p>
        </div>

        {/* Step 1 */}
        <div style={sectionStyle}>
          <div style={blackBarStyle}>1 ‧ 輸入事件描述（日期、時間、事件標題）</div>
          <label style={labelStyle}>支援自然語言，例如「5/16 7:30-16:40 會考第一天、6月20日早上10點看診」</label>
          <textarea value={input} onChange={function(e){ setInput(e.target.value) }} rows={4}
            placeholder="例如：5/16 7:30-16:40 會考第一天、6月15日晚上7點家庭聚餐..."
            style={Object.assign({}, inputStyle, {resize:"vertical", lineHeight:1.6})} />
          {error && <p style={{color:"#c0392b",fontSize:13,margin:"6px 0 0"}}>{error}</p>}
          <p style={{fontSize:12,color:"#888",margin:"8px 0 0"}}>
            ⚠️ 時間請使用「-」，勿使用全形「~」<br/>
            ✅ 正確：5/16 7:30-16:30　❌ 錯誤：5/16 7:30~16:30
          </p>
          <div style={{marginTop:12}}>
            <button onClick={parseWithAI} disabled={loading || !input.trim()}
              style={{width:"100%",padding:"9px 0",fontSize:14,cursor:loading?"wait":"pointer",background:"#111",color:"#fff",border:"none",borderRadius:8,fontWeight:500,opacity:(!input.trim()||loading)?0.4:1}}>
              {loading ? "解析中..." : "解析所有事件"}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div style={sectionStyle}>
          <div style={blackBarStyle}>2 ‧ 設定共用對象</div>
          <label style={labelStyle}>以下 Email 將套用至所有事件的邀請名單</label>
          {attendees.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
              {attendees.map(function(email, i){
                return <EmailTag key={email} email={email} onRemove={function(){ setAttendees(function(a){ return a.filter(function(_,j){ return j !== i }) }) }} />
              })}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <input type="email" value={emailInput} onChange={function(e){ setEmailInput(e.target.value) }}
              onKeyDown={function(e){ if(e.key==="Enter"){ e.preventDefault(); addAttendee() } }}
              placeholder="輸入 email 後按 Enter 或點新增" style={inputStyle} />
            <button onClick={addAttendee}
              style={{padding:"8px 16px",fontSize:14,cursor:"pointer",background:"#111",color:"#fff",border:"none",borderRadius:8,fontWeight:500,whiteSpace:"nowrap"}}>
              新增
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div style={sectionStyle}>
          <div style={blackBarStyle}>3 ‧ 所有事件標題前面統一新增的文字，例如【XX培訓班】【XX作品班】【XX比賽團】</div>
          <input value={prefix} onChange={function(e){ setPrefix(e.target.value) }}
            placeholder="例如：【XX培訓班】、【公司】..." style={inputStyle} />
          {prefix && events.length > 0 && (
            <p style={{fontSize:13,color:"#666",margin:"8px 0 0"}}>
              預覽：<span style={{color:"#111",fontWeight:500}}>{prefix}{events[0] && events[0].title}</span>
            </p>
          )}
        </div>

        {/* Step 4 */}
        {events.length > 0 && (
          <div style={sectionStyle}>
            <div style={Object.assign({}, blackBarStyle, {background:accentCoral})}>
              4 ‧ 確認事件清單
              <span style={{marginLeft:8,fontSize:12,background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"1px 8px"}}>{events.length} 筆</span>
            </div>

            {events.map(function(ev, i){
              return <EventCard key={i} ev={ev} idx={i} onChange={updateEvent} onRemove={removeEvent} prefix={prefix} />
            })}

            {/* 加入 Google 日曆 */}
            <button
              onClick={function(){ addAllToGoogleCalendar(events.map(function(ev){ return Object.assign({}, ev, {title:prefix+ev.title}) }), prefix) }}
              style={{width:"100%",padding:"10px 0",fontSize:14,cursor:"pointer",background:accentBlue,color:"#fff",border:"none",borderRadius:8,fontWeight:500,marginTop:8,marginBottom:10}}>
              加入 Google 日曆（共 {events.length} 筆）
            </button>

            {/* 提醒備註 */}
            <div style={{background:"rgba(255,255,255,0.5)",borderRadius:8,padding:"10px 14px",marginBottom:10}}>
              <p style={{fontSize:13,color:"#555",margin:"0 0 8px"}}>
                如需加入提醒設定，請下載 .ics 檔匯入日曆
              </p>
              <button onClick={function(){ downloadICS(events.map(function(ev){ return Object.assign({}, ev, {title:prefix+ev.title}) }), attendees) }}
                style={{padding:"7px 16px",fontSize:13,cursor:"pointer",background:"#555",color:"#fff",border:"none",borderRadius:8,fontWeight:500}}>
                下載 .ics 檔
              </button>
              <p style={{fontSize:12,color:"#999",margin:"8px 0 0"}}>
                使用自動加入 Google 日曆是沒有提醒功能的哦
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
