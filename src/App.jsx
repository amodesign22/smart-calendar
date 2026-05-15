import { useState, useEffect, useRef } from "react"

const MODEL = "claude-sonnet-4-20250514"
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ""

function parseICSDate(dt) {
  return new Date(dt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function generateICS(events, attendees) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SmartCalendar//EN","CALSCALE:GREGORIAN","METHOD:REQUEST"]
  for (const ev of events) {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@smartcal`
    lines.push("BEGIN:VEVENT",`UID:${uid}`,`SUMMARY:${ev.title}`,`DTSTART:${parseICSDate(ev.start)}`,`DTEND:${parseICSDate(ev.end)}`)
    if (ev.description) lines.push(`DESCRIPTION:${ev.description}`)
    for (const email of attendees) if (email.trim()) lines.push(`ATTENDEE;RSVP=TRUE:mailto:${email.trim()}`)
    lines.push("ORGANIZER:mailto:organizer@smartcal","END:VEVENT")
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

function MarbleCanvas() {
  const ref = useRef()
  useEffect(() => {
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
    for (const [cx,cy,r,color] of patches) {
      const g = ctx.createRadialGradient(cx*w,cy*h,0,cx*w,cy*h,r*w)
      g.addColorStop(0,color)
      g.addColorStop(1,"rgba(232,232,234,0)")
      ctx.fillStyle = g
      ctx.fillRect(0,0,w,h)
    }
    const drawVein = (x1,y1,x2,y2,color,lw,alpha,jitter) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(x1,y1)
      for (let i=1;i<=60;i++) {
        const t=i/60
        ctx.lineTo(x1+(x2-x1)*t+(Math.random()-0.5)*jitter, y1+(y2-y1)*t+(Math.random()-0.5)*jitter*0.4)
      }
      ctx.stroke()
      ctx.restore()
    }
    const veins = [
      [0.05*w,0.2*h,0.7*w,0.5*h,"#fff",2.5,0.7,60],
      [0.08*w,0.22*h,0.72*w,0.52*h,"#f0f0f2",0.8,0.4,30],
      [0.2*w,0.0*h,0.55*w,0.8*h,"#dcdcde",1.5,0.45,50],
      [0.4*w,0.1*h,0.8*w,0.9*h,"#fff",1.8,0.5,45],
      [0.6*w,0.0*h,0.35*w,1.0*h,"#d8d8db",1.2,0.35,40],
      [0.75*w,0.15*h,0.9*w,0.85*h,"#fff",1.0,0.4,35],
      [0.0*w,0.5*h,0.9*w,0.6*h,"#e0e0e2",0.8,0.25,30],
      [0.1*w,0.75*h,0.85*w,0.4*h,"#fff",1.5,0.35,40],
    ]
    for (const v of veins) drawVein(...v)
  }, [])
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}} />
}

const inputStyle = {
  width:"100%",boxSizing:"border-box",fontSize:14,padding:"8px 12px",
  borderRadius:8,border:"none",background:"rgba(255,255,255,0.6)",
  color:"#111",fontFamily:"inherit",outline:"none",
}
const sectionStyle = {
  background:"rgba(255,255,255,0.3)",backdropFilter:"blur(10px)",
  WebkitBackdropFilter:"blur(10px)",border:"0.5px solid rgba(255,255,255,0.6)",
  borderRadius:14,padding:"1.25rem",marginBottom:16,position:"relative",zIndex:1,
}
const labelStyle = {
  fontSize:12,fontWeight:500,color:"#666",display:"block",marginBottom:6,
  textTransform:"uppercase",letterSpacing:"0.04em",
}
const blackBarStyle = {
  display:"flex",alignItems:"center",background:"#111",color:"#fff",
  borderRadius:8,padding:"8px 14px",marginBottom:14,fontSize:14,fontWeight:500,
}
const accentCoral = "#D85A30"

function EmailTag({ email, onRemove }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(24,95,165,0.12)",color:"#185FA5",borderRadius:99,fontSize:12,padding:"3px 10px",border:"0.5px solid rgba(24,95,165,0.3)",margin:"2px"}}>
      {email}
      <button onClick={onRemove} style={{background:"none",border:"none",cursor:"pointer",color:"#185FA5",padding:0,fontSize:14,lineHeight:1}}>×</button>
    </span>
  )
}

function EventCard({ ev, idx, onChange, onRemove, prefix }) {
  return (
    <div style={{background:"rgba(255,255,255,0.4)",border:"0.5px solid rgba(255,255,255,0.6)",borderRadius:10,padding:"1rem",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{flex:1,marginRight:8}}>
          {prefix && <span style={{fontSize:13,fontWeight:500,color:"#888",marginRight:2}}>{prefix}</span>}
          <input value={ev.title} onChange={e=>onChange(idx,{...ev,title:e.target.value})} style={{...inputStyle,fontSize:15,fontWeight:500}} />
        </div>
        <button onClick={()=>onRemove(idx)} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:20,padding:"0 4px",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div>
          <label style={labelStyle}>開始時間</label>
          <input type="datetime-local" value={ev.start} onChange={e=>onChange(idx,{...ev,start:e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>結束時間</label>
          <input type="datetime-local" value={ev.end} onChange={e=>onChange(idx,{...ev,end:e.target.value})} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>備註（選填）</label>
        <input value={ev.description||""} onChange={e=>onChange(idx,{...ev,description:e.target.value})} placeholder="事件說明…" style={inputStyle} />
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

  function addAttendee() {
    const e = emailInput.trim()
    if (!e || !e.includes("@")) return
    if (!attendees.includes(e)) setAttendees(a=>[...a,e])
    setEmailInput("")
  }
  function updateEvent(idx,u) { setEvents(evs=>evs.map((e,i)=>i===idx?u:e)) }
  function removeEvent(idx) { setEvents(evs=>evs.filter((_,i)=>i!==idx)) }
  function addBlankEvent() {
    const now=new Date(), pad=n=>String(n).padStart(2,"0")
    const fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setEvents(evs=>[...evs,{title:"新事件",start:fmt(now),end:fmt(new Date(now.getTime()+3600000)),description:""}])
  }
  async function parseWithAI() {
    if (!input.trim()) return
    setLoading(true); setError("")
    try {
      const today = new Date().toISOString().slice(0,10)
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":API_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-allow-browser":"true"
        },
        body:JSON.stringify({model:MODEL,max_tokens:1000,messages:[{role:"user",content:
          `Today is ${today}. Parse the following text and extract all calendar events. Return ONLY a valid JSON array, no markdown, no explanation. Each object: title (string), start (ISO datetime), end (ISO datetime, default +1hr), description (string).\n\nText:\n${input}`
        }]})
      })
      const data = await res.json()
      const text = data.content.map(b=>b.text||"").join("")
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim())
      if (Array.isArray(parsed)&&parsed.length>0) { setEvents(evs=>[...evs,...parsed]); setInput("") }
      else setError("未能解析到事件，請重新描述。")
    } catch { setError("解析失敗，請稍後再試。") }
    setLoading(false)
  }

  return (
    <div style={{minHeight:"100vh",fontFamily:"sans-serif",position:"relative"}}>
      <MarbleCanvas />
      <div style={{position:"relative",zIndex:1,maxWidth:640,margin:"0 auto",padding:"1.5rem 1rem"}}>
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:500,margin:"0 0 4px",color:"#111"}}>智慧行事曆建立工具</h2>
          <p style={{fontSize:14,color:"#555",margin:0}}>輸入事件、設定共用對象，匯出 .ics 直接加入行事曆</p>
        </div>

        <div style={sectionStyle}>
          <div style={blackBarStyle}>1 ‧ 輸入事件描述（日期、時間、事件標題）</div>
          <label style={labelStyle}>支援自然語言，例如「下週一下午3點開會、6月20日早上10點看診」</label>
          <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4}
            placeholder="例如：明天下午2點專案會議、6月15日晚上7點家庭聚餐…"
            style={{...inputStyle,resize:"vertical",lineHeight:1.6}} />
          {error && <p style={{color:"#c0392b",fontSize:13,margin:"6px 0 0"}}>{error}</p>}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={parseWithAI} disabled={loading||!input.trim()}
              style={{flex:1,padding:"9px 0",fontSize:14,cursor:loading?"wait":"pointer",background:"#111",color:"#fff",border:"none",borderRadius:8,fontWeight:500,opacity:(!input.trim()||loading)?0.4:1}}>
              {loading?"AI 解析中…":"AI 解析事件"}
            </button>
            <button onClick={addBlankEvent}
              style={{padding:"9px 18px",fontSize:14,cursor:"pointer",background:"#555",color:"#fff",border:"none",borderRadius:8,fontWeight:500}}>
              手動新增
            </button>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={blackBarStyle}>2 ‧ 設定共用對象</div>
          <label style={labelStyle}>以下 Email 將套用至所有事件的邀請名單</label>
          {attendees.length>0 && (
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:8}}>
              {attendees.map((email,i)=><EmailTag key={email} email={email} onRemove={()=>setAttendees(a=>a.filter((_,j)=>j!==i))} />)}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <input type="email" value={emailInput} onChange={e=>setEmailInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addAttendee()}}}
              placeholder="輸入 email 後按 Enter 或點新增" style={inputStyle} />
            <button onClick={addAttendee}
              style={{padding:"8px 16px",fontSize:14,cursor:"pointer",background:"#111",color:"#fff",border:"none",borderRadius:8,fontWeight:500,whiteSpace:"nowrap"}}>
              新增
            </button>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={blackBarStyle}>3 ‧ 所有事件標題前面統一新增的文字，例如【IDS】</div>
          <input value={prefix} onChange={e=>setPrefix(e.target.value)} placeholder="例如：【IDS】、【公司】…" style={inputStyle} />
          {prefix&&events.length>0 && (
            <p style={{fontSize:13,color:"#666",margin:"8px 0 0"}}>
              預覽：<span style={{color:"#111",fontWeight:500}}>{prefix}{events[0]?.title}</span>
            </p>
          )}
        </div>

        {events.length>0 && (
          <div style={sectionStyle}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{...blackBarStyle,background:accentCoral,marginBottom:0,flex:1,marginRight:10}}>
                4 ‧ 確認事件清單
                <span style={{marginLeft:8,fontSize:12,background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"1px 8px"}}>{events.length} 筆</span>
              </div>
              <button onClick={()=>downloadICS(events.map(ev=>({...ev,title:prefix+ev.title})),attendees)}
                style={{padding:"8px 18px",fontSize:13,cursor:"pointer",background:accentCoral,color:"#fff",border:"none",borderRadius:8,fontWeight:500,whiteSpace:"nowrap"}}>
                匯出 .ics
              </button>
            </div>
            {events.map((ev,i)=><EventCard key={i} ev={ev} idx={i} onChange={updateEvent} onRemove={removeEvent} prefix={prefix} />)}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
              <button onClick={()=>downloadICS(events.map(ev=>({...ev,title:prefix+ev.title})),attendees)}
                style={{fontSize:14,padding:"10px 32px",cursor:"pointer",background:accentCoral,color:"#fff",border:"none",borderRadius:8,fontWeight:500}}>
                匯出 .ics 行事曆
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
function generateICS(events, attendees) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SmartCalendar//EN","CALSCALE:GREGORIAN","METHOD:REQUEST"];
  for (const ev of events) {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@smartcal`;
    lines.push("BEGIN:VEVENT",`UID:${uid}`,`SUMMARY:${ev.title}`,`DTSTART:${parseICSDate(ev.start)}`,`DTEND:${parseICSDate(ev.end)}`);
    if (ev.description) lines.push(`DESCRIPTION:${ev.description}`);
    for (const email of attendees) if (email.trim()) lines.push(`ATTENDEE;RSVP=TRUE:mailto:${email.trim()}`);
    lines.push("ORGANIZER:mailto:organizer@smartcal","END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadICS(events, attendees) {
  const blob = new Blob([generateICS(events, attendees)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "events.ics"; a.click();
  URL.revokeObjectURL(url);
}

function MarbleCanvas() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current;
    const w = c.width = window.innerWidth;
    const h = c.height = window.innerHeight;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#e8e8ea";
    ctx.fillRect(0, 0, w, h);

    const patches = [
      [0.15, 0.1, 0.45, "rgba(210,210,215,0.55)"],
      [0.6, 0.3, 0.38, "rgba(200,200,205,0.45)"],
      [0.3, 0.65, 0.4, "rgba(205,205,210,0.4)"],
      [0.75, 0.7, 0.35, "rgba(215,215,218,0.35)"],
      [0.5, 0.1, 0.3, "rgba(195,195,200,0.3)"],
    ];
    for (const [cx, cy, r, color] of patches) {
      const g = ctx.createRadialGradient(cx*w, cy*h, 0, cx*w, cy*h, r*w);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(232,232,234,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    const drawVein = (x1, y1, x2, y2, color, lw, alpha, jitter) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const steps = 60;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const tx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter;
        const ty = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter * 0.4;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.restore();
    };

    const veins = [
      [0.05*w,0.2*h,0.7*w,0.5*h,"#fff",2.5,0.7,60],
      [0.08*w,0.22*h,0.72*w,0.52*h,"#f0f0f2",0.8,0.4,30],
      [0.2*w,0.0*h,0.55*w,0.8*h,"#dcdcde",1.5,0.45,50],
      [0.4*w,0.1*h,0.8*w,0.9*h,"#fff",1.8,0.5,45],
      [0.42*w,0.12*h,0.82*w,0.88*h,"#e8e8ea",0.6,0.3,20],
      [0.6*w,0.0*h,0.35*w,1.0*h,"#d8d8db",1.2,0.35,40],
      [0.75*w,0.15*h,0.9*w,0.85*h,"#fff",1.0,0.4,35],
      [0.0*w,0.5*h,0.9*w,0.6*h,"#e0e0e2",0.8,0.25,30],
      [0.1*w,0.75*h,0.85*w,0.4*h,"#fff",1.5,0.35,40],
      [0.55*w,0.55*h,0.95*w,0.75*h,"#d5d5d8",0.7,0.3,25],
    ];
    for (const v of veins) drawVein(...v);

    const og = ctx.createLinearGradient(0, 0, w, h);
    og.addColorStop(0, "rgba(255,255,255,0.15)");
    og.addColorStop(0.5, "rgba(220,220,224,0.05)");
    og.addColorStop(1, "rgba(200,200,205,0.12)");
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, w, h);
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", fontSize: 14,
  padding: "8px 12px", borderRadius: 8, border: "none",
  background: "rgba(255,255,255,0.6)", color: "#111",
  fontFamily: "inherit", outline: "none",
};
const sectionStyle = {
  background: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)", border: "0.5px solid rgba(255,255,255,0.6)",
  borderRadius: 14, padding: "1.25rem", marginBottom: 16,
  position: "relative", zIndex: 1,
};
const labelStyle = {
  fontSize: 12, fontWeight: 500, color: "#666", display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em"
};
const blackBarStyle = {
  display: "flex", alignItems: "center", background: "#111", color: "#fff",
  borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 14, fontWeight: 500,
};
const accentCoral = "#D85A30";

function EmailTag({ email, onRemove }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(24,95,165,0.12)", color: "#185FA5", borderRadius: 99, fontSize: 12, padding: "3px 10px", border: "0.5px solid rgba(24,95,165,0.3)", margin: "2px" }}>
      {email}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#185FA5", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
    </span>
  );
}

function EventCard({ ev, idx, onChange, onRemove, prefix }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.4)", border: "0.5px solid rgba(255,255,255,0.6)", borderRadius: 10, padding: "1rem", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ flex: 1, marginRight: 8 }}>
          {prefix && <span style={{ fontSize: 13, fontWeight: 500, color: "#888", marginRight: 2 }}>{prefix}</span>}
          <input value={ev.title} onChange={e => onChange(idx, { ...ev, title: e.target.value })}
            style={{ ...inputStyle, fontSize: 15, fontWeight: 500 }} aria-label="事件名稱" />
        </div>
        <button onClick={() => onRemove(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>開始時間</label>
          <input type="datetime-local" value={ev.start} onChange={e => onChange(idx, { ...ev, start: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>結束時間</label>
          <input type="datetime-local" value={ev.end} onChange={e => onChange(idx, { ...ev, end: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>備註（選填）</label>
        <input value={ev.description || ""} onChange={e => onChange(idx, { ...ev, description: e.target.value })} placeholder="事件說明…" style={inputStyle} />
      </div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [prefix, setPrefix] = useState("");

  function addAttendee() {
    const e = emailInput.trim();
    if (!e || !e.includes("@")) return;
    if (!attendees.includes(e)) setAttendees(a => [...a, e]);
    setEmailInput("");
  }
  function updateEvent(idx, u) { setEvents(evs => evs.map((e, i) => i === idx ? u : e)); }
  function removeEvent(idx) { setEvents(evs => evs.filter((_, i) => i !== idx)); }
  function addBlankEvent() {
    const now = new Date(), pad = n => String(n).padStart(2, "0");
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEvents(evs => [...evs, { title: "新事件", start: fmt(now), end: fmt(new Date(now.getTime() + 3600000)), description: "" }]);
  }
  async function parseWithAI() {
    if (!input.trim()) return;
    setLoading(true); setError("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-allow-browser": "true"
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages: [{ role: "user", content:
          `Today is ${today}. Parse the following text and extract all calendar events. Return ONLY a valid JSON array, no markdown, no explanation. Each object: title (string), start (ISO datetime), end (ISO datetime, default +1hr), description (string).\n\nText:\n${input}` }] })
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed) && parsed.length > 0) { setEvents(evs => [...evs, ...parsed]); setInput(""); }
      else setError("未能解析到事件，請重新描述。");
    } catch { setError("解析失敗，請稍後再試。"); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif", position: "relative" }}>
      <MarbleCanvas />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", color: "#111" }}>智慧行事曆建立工具</h2>
          <p style={{ fontSize: 14, color: "#555", margin: 0 }}>輸入事件、設定共用對象，匯出 .ics 直接加入行事曆</p>
        </div>

        <div style={sectionStyle}>
          <div style={blackBarStyle}>1 ‧ 輸入事件描述（日期、時間、事件標題）</div>
          <label style={labelStyle}>支援自然語言，例如「下週一下午3點開會、6月20日早上10點看診」</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={4}
            placeholder="例如：明天下午2點專案會議、6月15日晚上7點家庭聚餐…"
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          {error && <p style={{ color: "#c0392b", fontSize: 13, margin: "6px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={parseWithAI} disabled={loading || !input.trim()}
              style={{ flex: 1, padding: "9px 0", fontSize: 14, cursor: loading ? "wait" : "pointer", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, opacity: (!input.trim() || loading) ? 0.4 : 1 }}>
              {loading ? "AI 解析中…" : "AI 解析事件"}
            </button>
            <button onClick={addBlankEvent}
              style={{ padding: "9px 18px", fontSize: 14, cursor: "pointer", background: "#555", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500 }}>
              手動新增
            </button>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={blackBarStyle}>2 ‧ 設定共用對象</div>
          <label style={labelStyle}>以下 Email 將套用至所有事件的邀請名單</label>
          {attendees.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 8 }}>
              {attendees.map((email, i) => <EmailTag key={email} email={email} onRemove={() => setAttendees(a => a.filter((_, j) => j !== i))} />)}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }}
              placeholder="輸入 email 後按 Enter 或點新增" style={inputStyle} />
            <button onClick={addAttendee}
              style={{ padding: "8px 16px", fontSize: 14, cursor: "pointer", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, whiteSpace: "nowrap" }}>
              新增
            </button>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={blackBarStyle}>3 ‧ 所有事件標題前面統一新增的文字，例如【IDS】</div>
          <input value={prefix} onChange={e => setPrefix(e.target.value)}
            placeholder="例如：【IDS】、【公司】…" style={inputStyle} />
          {prefix && events.length > 0 && (
            <p style={{ fontSize: 13, color: "#666", margin: "8px 0 0" }}>
              預覽：<span style={{ color: "#111", fontWeight: 500 }}>{prefix}{events[0]?.title}</span>
            </p>
          )}
        </div>

        {events.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ ...blackBarStyle, background: accentCoral, marginBottom: 0, flex: 1, marginRight: 10 }}>
                4 ‧ 確認事件清單
                <span style={{ marginLeft: 8, fontSize: 12, background: "rgba(255,255,255,0.25)", borderRadius: 99, padding: "1px 8px" }}>{events.length} 筆</span>
              </div>
              <button onClick={() => downloadICS(events.map(ev => ({ ...ev, title: prefix + ev.title })), attendees)}
                style={{ padding: "8px 18px", fontSize: 13, cursor: "pointer", background: accentCoral, color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, whiteSpace: "nowrap" }}>
                匯出 .ics
              </button>
            </div>
            {events.map((ev, i) => <EventCard key={i} ev={ev} idx={i} onChange={updateEvent} onRemove={removeEvent} prefix={prefix} />)}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => downloadICS(events.map(ev => ({ ...ev, title: prefix + ev.title })), attendees)}
                style={{ fontSize: 14, padding: "10px 32px", cursor: "pointer", background: accentCoral, color: "#fff", border: "none", borderRadius: 8, fontWeight: 500 }}>
                匯出 .ics 行事曆
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
