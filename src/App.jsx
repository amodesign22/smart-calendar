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
  a.href = url; a.download = "events.ics"; a.click()
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

function fixDatetime(str) {
  if (!str) return ""
  const d = new Date(str)
  if (isNaN(d.getTime())) return ""
  const pad = function(n){ return String(n).padStart(2, "0") }
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes())
}

// Glassmorphism styles
const glassSection = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: "1.25rem",
  marginBottom: 16,
  position: "relative",
  zIndex: 1,
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
}

const glassInput = {
  width: "100%", boxSizing: "border-box", fontSize: 14,
  padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.3)",
  color: "#e8e8e8",
  fontFamily: "inherit", outline: "none",
  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)",
}

const glassBar = {
  display: "flex", alignItems: "center",
  background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 10, padding: "8px 14px", marginBottom: 14,
  fontSize: 14, fontWeight: 500, color: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
}

const labelStyle = {
  fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)",
  display: "block", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.06em",
}

const glassBtn = {
  width: "100%", padding: "11px 0", fontSize: 14,
  cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10, fontWeight: 500, color: "#fff",
  background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
  letterSpacing: "0.02em",
}

const blueBtn = {
  width: "100%", padding: "11px 0", fontSize: 14,
  cursor: "pointer", border: "1px solid rgba(100,160,255,0.4)",
  borderRadius: 10, fontWeight: 500, color: "#fff",
  background: "linear-gradient(135deg, rgba(30,100,255,0.6), rgba(10,60,200,0.4))",
  boxShadow: "0 4px 20px rgba(30,100,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
  letterSpacing: "0.02em", marginTop: 8, marginBottom: 10,
}

const coralBtn = {
  padding: "7px 16px", fontSize: 13,
  cursor: "pointer", border: "1px solid rgba(255,120,80,0.4)",
  borderRadius: 10, fontWeight: 500, color: "#fff",
  background: "linear-gradient(135deg, rgba(220,80,40,0.6), rgba(180,50,20,0.4))",
  boxShadow: "0 4px 15px rgba(220,80,40,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
}

function EmailTag(props) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(30,100,255,0.2)",color:"#88bbff",borderRadius:99,fontSize:12,padding:"3px 10px",border:"1px solid rgba(30,100,255,0.3)",margin:"2px"}}>
      {props.email}
      <button onClick={props.onRemove} style={{background:"none",border:"none",cursor:"pointer",color:"#88bbff",padding:0,fontSize:14,lineHeight:1}}>×</button>
    </span>
  )
}

function EventCard(props) {
  const ev = props.ev, idx = props.idx
  const cardStyle = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "1rem", marginBottom: 10,
    boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
  }
  return (
    <div style={cardStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{flex:1,marginRight:8}}>
          {props.prefix && <span style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.4)",marginRight:2}}>{props.prefix}</span>}
          <input value={ev.title} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {title:e.target.value})) }}
            style={Object.assign({}, glassInput, {fontSize:15,fontWeight:500})} />
        </div>
        <button onClick={function(){ props.onRemove(idx) }} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:20,padding:"0 4px",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div>
          <label style={labelStyle}>開始時間</label>
          <input type="datetime-local" value={ev.start} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {start:e.target.value})) }} style={glassInput} />
        </div>
        <div>
          <label style={labelStyle}>結束時間</label>
          <input type="datetime-local" value={ev.end} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {end:e.target.value})) }} style={glassInput} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>備註（選填）</label>
        <input value={ev.description || ""} onChange={function(e){ props.onChange(idx, Object.assign({}, ev, {description:e.target.value})) }} placeholder="事件說明..." style={Object.assign({}, glassInput, {"--placeholder-color":"rgba(255,255,255,0.25)"})} />
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
  function updateEvent(idx, updated) { setEvents(function(evs){ return evs.map(function(e,i){ return i===idx?updated:e }) }) }
  function removeEvent(idx) { setEvents(function(evs){ return evs.filter(function(_,i){ return i!==idx }) }) }

  function parseWithAI() {
    if (!input.trim()) return
    setLoading(true); setError("")
    const today = new Date().toISOString().slice(0, 10)
    const currentYear = new Date().getFullYear()
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL, max_tokens: 1000,
        messages: [{ role: "user", content: "Today is " + today + ". User timezone: " + timezone + ". Current year is " + currentYear + ". Parse the following text and extract all calendar events. When no year is specified, assume the current year (" + currentYear + "). If a later event has a month that is earlier than the previous event's month (e.g. previous was December, next is January), automatically advance the year by 1. The time range separator can be any of these: -, \u2013, \u2014, ~, \uff5e, to, \u5230, \u81f3 \u2014 treat them all as time range separators. Return ONLY a valid JSON array, no markdown, no explanation. Each object: title (string), start (ISO datetime e.g. 2026-05-16T07:30), end (ISO datetime, default +1hr, if all day set T00:00 and T23:59), description (string).\n\nText:\n" + input }]
      })
    })
    .then(function(res){ return res.json() })
    .then(function(data){
      if (data.error) { setError("API錯誤：" + JSON.stringify(data.error)); setLoading(false); return }
      const text = (data.content||[]).map(function(b){ return b.text||"" }).join("")
      const clean = text.replace(/```json|```/g,"").trim()
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const fixed = parsed.map(function(ev){ return Object.assign({}, ev, { start: fixDatetime(ev.start), end: fixDatetime(ev.end) }) })
        setEvents(function(evs){ return evs.concat(fixed) })
        setInput("")
      } else { setError("未能解析到事件，請重新描述。") }
      setLoading(false)
    })
    .catch(function(){ setError("連線失敗，請稍後再試。"); setLoading(false) })
  }

  return (
    <div style={{minHeight:"100vh",fontFamily:"'SF Pro Display',-apple-system,sans-serif",position:"relative",background:"#0a0a0f"}}>
      {/* 背景光暈 */}
      <div style={{position:"fixed",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(circle, rgba(30,60,180,0.15) 0%, transparent 70%)",pointerEvents:"none",zIndex:0}} />
      <div style={{position:"fixed",bottom:"-20%",right:"-10%",width:"60%",height:"60%",background:"radial-gradient(circle, rgba(180,30,80,0.1) 0%, transparent 70%)",pointerEvents:"none",zIndex:0}} />

      <div style={{position:"relative",zIndex:1,maxWidth:620,margin:"0 auto",padding:"2rem 1rem"}}>

        {/* Header */}
        <div style={{marginBottom:28,textAlign:"center"}}>
          <h2 style={{fontSize:24,fontWeight:600,margin:"0 0 6px",color:"#fff",letterSpacing:"0.02em"}}>智慧行事曆建立工具</h2>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",margin:"0 0 2px"}}>輸入事件、設定共用對象，匯出 .ics 直接加入行事曆</p>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:0}}>時區：{timezone}</p>
        </div>

        {/* Step 1 */}
        <div style={glassSection}>
          <div style={glassBar}>
            <span style={{marginRight:8,opacity:0.7}}>01</span>輸入事件描述（日期、時間、事件標題）
          </div>
          <label style={labelStyle}>支援自然語言，例如「5/16 7:30-16:40 會考第一天、6月20日早上10點看診」</label>
          <textarea value={input} onChange={function(e){ setInput(e.target.value) }} rows={4}
            placeholder="例如：5/16 7:30-16:40 會考第一天、6月15日晚上7點家庭聚餐..."
            style={Object.assign({}, glassInput, {resize:"vertical",lineHeight:1.7,color:"#e8e8e8"})} />
          {error && <p style={{color:"#ff6b6b",fontSize:13,margin:"6px 0 0"}}>{error}</p>}
          <p style={{fontSize:11,color:"rgba(255,255,255,0.35)",margin:"8px 0 0",lineHeight:1.6}}>
            ⚠️ 時間請使用「-」，全形「~」也可辨識<br/>
            ✅ 正確：5/16 7:30-16:30　或　5/16 7:30~16:30
          </p>
          <div style={{marginTop:12}}>
            <button onClick={parseWithAI} disabled={loading || !input.trim()} style={Object.assign({}, glassBtn, {opacity:(!input.trim()||loading)?0.35:1, cursor:loading?"wait":"pointer"})}>
              {loading ? "解析中..." : "解析所有事件"}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div style={glassSection}>
          <div style={glassBar}><span style={{marginRight:8,opacity:0.7}}>02</span>設定共用對象</div>
          <label style={labelStyle}>以下 Email 將套用至所有事件的邀請名單</label>
          {attendees.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
              {attendees.map(function(email,i){
                return <EmailTag key={email} email={email} onRemove={function(){ setAttendees(function(a){ return a.filter(function(_,j){ return j!==i }) }) }} />
              })}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <input type="email" value={emailInput} onChange={function(e){ setEmailInput(e.target.value) }}
              onKeyDown={function(e){ if(e.key==="Enter"){e.preventDefault();addAttendee()} }}
              placeholder="輸入 email 後按 Enter 或點新增" style={glassInput} />
            <button onClick={addAttendee} style={{padding:"10px 16px",fontSize:14,cursor:"pointer",borderRadius:10,fontWeight:500,color:"#fff",whiteSpace:"nowrap",background:"linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))",border:"1px solid rgba(255,255,255,0.15)",boxShadow:"0 4px 15px rgba(0,0,0,0.3)"}}>
              新增
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div style={glassSection}>
          <div style={glassBar}><span style={{marginRight:8,opacity:0.7}}>03</span>所有事件標題前面統一新增的文字，例如【XX培訓班】</div>
          <input value={prefix} onChange={function(e){ setPrefix(e.target.value) }}
            placeholder="例如：【XX培訓班】、【公司】..." style={glassInput} />
          {prefix && events.length > 0 && (
            <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",margin:"8px 0 0"}}>
              預覽：<span style={{color:"#fff",fontWeight:500}}>{prefix}{events[0]&&events[0].title}</span>
            </p>
          )}
        </div>

        {/* Step 4 */}
        {events.length > 0 && (
          <div style={glassSection}>
            <div style={Object.assign({}, glassBar, {background:"linear-gradient(135deg,rgba(220,80,40,0.5),rgba(180,40,20,0.3))",border:"1px solid rgba(255,120,80,0.3)"})}>
              <span style={{marginRight:8,opacity:0.7}}>04</span>確認事件清單
              <span style={{marginLeft:8,fontSize:12,background:"rgba(255,255,255,0.15)",borderRadius:99,padding:"1px 8px"}}>{events.length} 筆</span>
            </div>

            {events.map(function(ev,i){
              return <EventCard key={i} ev={ev} idx={i} onChange={updateEvent} onRemove={removeEvent} prefix={prefix} />
            })}

            <button onClick={function(){ addAllToGoogleCalendar(events.map(function(ev){ return Object.assign({},ev,{title:prefix+ev.title}) }),prefix) }} style={blueBtn}>
              加入 Google 日曆（共 {events.length} 筆）
            </button>

            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px"}}>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.55)",margin:"0 0 8px"}}>如需加入提醒設定，請下載 .ics 檔匯入日曆</p>
              <button onClick={function(){ downloadICS(events.map(function(ev){ return Object.assign({},ev,{title:prefix+ev.title}) }),attendees) }} style={coralBtn}>
                下載 .ics 檔
              </button>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",margin:"8px 0 0"}}>使用自動加入 Google 日曆是沒有提醒功能的哦</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,0.25) !important; }
        input[type="datetime-local"] { color-scheme: dark; }
      `}</style>
    </div>
  )
} 
