import { useState } from "react";

const LOCATIONS = [
  { label: "🌍 Remote", value: "Remote" },
  { label: "🇮🇳 India", value: "India" },
  { label: "🇺🇸 United States", value: "United States" },
  { label: "🇬🇧 United Kingdom", value: "United Kingdom" },
  { label: "🌐 Anywhere", value: null },
];

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8001";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [atsScore, setAtsScore] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [location, setLocation] = useState(null);

  const t = dark ? themes.dark : themes.light;

  const handleUpload = async () => {
    if (!file) return alert("Pehle PDF select karo!");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.message) {
      setUploaded(true);
      fetchAtsScore();
    }
  };

  const fetchAtsScore = async () => {
    setAtsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ats-score`);
      const data = await res.json();
      setAtsScore(data);
    } catch {
      console.log("ATS score error");
    }
    setAtsLoading(false);
  };

  const handleMatch = async () => {
    setLoading(true);
    setError("");
    setMatches([]);
    try {
      const url = location
        ? `${API_BASE_URL}/match?location=${encodeURIComponent(location)}`
        : `${API_BASE_URL}/match`;
      const res = await fetch(url);
      const data = await res.json();
      setMatches(data.matches);
    } catch {
      setError("Backend chal raha hai? Terminal check karo.");
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#7c3aed";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getAtsColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") { setFile(f); setUploaded(false); setAtsScore(null); }
  };

  return (
    <div style={{ ...s.page, background: t.bg, color: t.text, transition: "all 0.3s" }}>

      {/* NAVBAR */}
      <nav style={{ ...s.nav, background: t.navBg, borderBottom: `1px solid ${t.border}` }}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <div style={{ ...s.logoDot, background: "linear-gradient(135deg,#7c3aed,#ec4899)" }} />
            <span style={{ ...s.logoText, color: t.text }}>ResuMatch<span style={{ color: "#7c3aed" }}>.ai</span></span>
          </div>
          <div style={s.navLinks}>
            <span style={{ ...s.navLink, color: t.muted }}>How it works</span>
            <span style={{ ...s.navLink, color: t.muted }}>About</span>
            <button onClick={() => setDark(!dark)} style={{ ...s.themeBtn, background: t.card, border: `1px solid ${t.border}`, color: t.text }}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={s.hero}>
        <div style={{ ...s.heroBadge, background: t.badgeBg, color: "#7c3aed", border: `1px solid ${t.badgeBorder}` }}>
          ✦ AI-Powered Job Matching
        </div>
        <h1 style={{ ...s.heroTitle, color: t.text }}>
          Find Jobs That <span style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Actually Fit</span><br />Your Resume
        </h1>
        <p style={{ ...s.heroSub, color: t.muted }}>
          Upload your resume and let AI match you with real jobs, explain why you fit, and show exactly what skills to build.
        </p>
        <div style={s.statsRow}>
          {[["5,000+", "Live Jobs"], ["2-stage", "AI Retrieval"], ["Real-time", "Explanations"], ["ATS", "Score Check"]].map(([val, lab]) => (
            <div key={lab} style={{ ...s.statCard, background: t.card, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#7c3aed" }}>{val}</div>
              <div style={{ fontSize: "11px", color: t.muted, marginTop: "2px" }}>{lab}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>

        {/* UPLOAD CARD */}
        <div style={{ ...s.uploadCard, background: t.card, border: `2px dashed ${dragOver ? "#7c3aed" : t.border}` }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div style={s.uploadEmoji}>{file ? "✅" : "📎"}</div>
          <p style={{ ...s.uploadTitle, color: t.text }}>{file ? file.name : "Drop your resume here"}</p>
          <p style={{ ...s.uploadSub, color: t.muted }}>{file ? "Ready to upload" : "PDF format only or click to browse"}</p>
          <input type="file" accept=".pdf" id="fi" style={{ display: "none" }}
            onChange={(e) => { setFile(e.target.files[0]); setUploaded(false); setAtsScore(null); }} />
          {!file && <label htmlFor="fi" style={s.browseBtn}>Browse File</label>}
          {file && !uploaded && <button onClick={handleUpload} style={s.uploadBtn}>Upload and Check ATS Score</button>}
          {uploaded && <div style={{ ...s.uploadedTag, background: "#d1fae5", color: "#065f46" }}>✓ Uploaded successfully</div>}
        </div>

        {/* ATS SCORE CARD */}
        {atsLoading && (
          <div style={{ ...s.atsCard, background: t.card, border: `1px solid ${t.border}` }}>
            <p style={{ color: t.muted, textAlign: "center", margin: 0 }}>⚡ Analyzing your resume ATS score...</p>
          </div>
        )}

        {atsScore && !atsLoading && (
          <div style={{ ...s.atsCard, background: t.card, border: `1px solid ${t.border}` }}>
            <div style={s.atsHeader}>
              <div>
                <p style={{ ...s.atsTitle, color: t.text }}>ATS Resume Score</p>
                <p style={{ ...s.atsSummary, color: t.muted }}>{atsScore.summary}</p>
              </div>
              <div style={{ ...s.atsCircle, border: `4px solid ${getAtsColor(atsScore.score)}` }}>
                <span style={{ fontSize: "24px", fontWeight: "900", color: getAtsColor(atsScore.score) }}>{atsScore.score}</span>
                <span style={{ fontSize: "11px", color: t.muted }}>/100</span>
              </div>
            </div>
            <div style={s.atsGrid}>
              <div>
                <p style={{ ...s.atsLabel, color: "#10b981" }}>✅ What's good</p>
                {atsScore.good.map((g, i) => (
                  <div key={i} style={{ ...s.atsPoint, background: "#d1fae520", color: t.text }}>✓ {g}</div>
                ))}
              </div>
              <div>
                <p style={{ ...s.atsLabel, color: "#ef4444" }}>⚠️ Improve</p>
                {atsScore.improve.map((imp, i) => (
                  <div key={i} style={{ ...s.atsPoint, background: "#fee2e220", color: t.text }}>→ {imp}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOCATION FILTER */}
        {uploaded && (
          <div style={{ ...s.locationCard, background: t.card, border: `1px solid ${t.border}` }}>
            <p style={{ ...s.locationTitle, color: t.text }}>📍 Where do you want to work?</p>
            <div style={s.locationBtns}>
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.label}
                  onClick={() => setLocation(loc.value)}
                  style={{
                    ...s.locBtn,
                    background: location === loc.value ? "#7c3aed" : t.tagBg,
                    color: location === loc.value ? "white" : t.text,
                    border: `1px solid ${location === loc.value ? "#7c3aed" : t.border}`
                  }}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MATCH BUTTON */}
        {uploaded && (
          <button onClick={handleMatch} disabled={loading} style={{ ...s.matchBtn, opacity: loading ? 0.8 : 1 }}>
            {loading ? "⚡ Finding your best matches..." : "Find My Jobs 🚀"}
          </button>
        )}

        {loading && (
          <div style={{ ...s.progressWrap, background: t.border }}>
            <div style={s.progressBar} />
          </div>
        )}

        {error && (
          <div style={{ ...s.errorBox, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* RESULTS */}
      {matches.length > 0 && (
        <div style={s.section}>
          <div style={s.resultsHeader}>
            <h2 style={{ ...s.resultsTitle, color: t.text }}>🎯 Your Top Matches</h2>
            <div style={{ ...s.resultsBadge, background: "#ede9fe", color: "#7c3aed" }}>{matches.length} jobs found</div>
          </div>

          {matches.map((job, i) => (
            <div key={i} style={{ ...s.jobCard, background: t.card, border: `1px solid ${t.border}` }}
              onMouseEnter={e => e.currentTarget.style.border = "1px solid #7c3aed"}
              onMouseLeave={e => e.currentTarget.style.border = `1px solid ${t.border}`}
            >
              <div style={s.cardTop}>
                <div style={{ ...s.rankBadge, background: i === 0 ? "#7c3aed" : t.tagBg, color: i === 0 ? "white" : t.muted }}>
                  #{i + 1}{i === 0 ? " Best Match" : ""}
                </div>
                <div style={{ ...s.scorePill, background: getScoreColor(job.match_score) + "18", color: getScoreColor(job.match_score), border: `1px solid ${getScoreColor(job.match_score)}40` }}>
                  {job.match_score}% match
                </div>
              </div>

              <h3 style={{ ...s.jobTitle, color: t.text }}>{job.title}</h3>
              <div style={s.jobMeta}>
                <span style={{ ...s.metaTag, background: t.tagBg, color: t.muted }}>🏢 {job.company}</span>
                <span style={{ ...s.metaTag, background: t.tagBg, color: t.muted }}>📍 {job.location}</span>
              </div>

              <div style={{ ...s.scoreBarWrap, background: t.border }}>
                <div style={{ ...s.scoreBarFill, width: `${job.match_score}%` }} />
              </div>

              {/* SKILLS GAP CHIPS */}
              <div style={s.skillsSection}>
                {job.matched_skills && job.matched_skills.length > 0 && (
                  <div style={s.skillsRow}>
                    {job.matched_skills.map((sk, j) => (
                      <span key={j} style={s.chipGreen}>✅ {sk}</span>
                    ))}
                  </div>
                )}
                {job.missing_skills && job.missing_skills.length > 0 && (
                  <div style={s.skillsRow}>
                    {job.missing_skills.map((sk, j) => (
                      <span key={j} style={s.chipRed}>❌ {sk}</span>
                    ))}
                  </div>
                )}
                {job.learning_skills && job.learning_skills.length > 0 && (
                  <div style={s.skillsRow}>
                    {job.learning_skills.map((sk, j) => (
                      <span key={j} style={s.chipAmber}>⚡ {sk}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI ANALYSIS */}
              {job.explanation && (
                <div style={{ ...s.aiBox, background: t.aiBg, border: `1px solid ${t.aiBorder}` }}>
                  <p style={{ color: "#7c3aed", fontWeight: "700", fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase" }}>✦ AI Analysis</p>
                  <p style={{ ...s.aiText, color: t.text }}>{job.explanation}</p>
                  {job.verdict && <p style={{ ...s.verdict, color: "#7c3aed" }}>"{job.verdict}"</p>}
                </div>
              )}

              <a href={job.url} target="_blank" rel="noreferrer" style={s.applyBtn}>Apply Now</a>
            </div>
          ))}
        </div>
      )}

      <footer style={{ ...s.footer, borderTop: `1px solid ${t.border}`, color: t.muted }}>
        <span>Built with RAG + FastAPI + React</span>
        <span style={{ color: "#7c3aed", fontWeight: "600" }}>ResuMatch.ai</span>
      </footer>
    </div>
  );
}

const themes = {
  light: { bg: "#fafafa", text: "#0f0f0f", muted: "#6b7280", navBg: "rgba(255,255,255,0.85)", card: "#ffffff", border: "#e5e7eb", badgeBg: "#ede9fe", badgeBorder: "#c4b5fd", tagBg: "#f3f4f6", aiBg: "#faf5ff", aiBorder: "#e9d5ff" },
  dark: { bg: "#0a0a0f", text: "#f9fafb", muted: "#9ca3af", navBg: "rgba(10,10,15,0.85)", card: "#111118", border: "#1f2937", badgeBg: "rgba(124,58,237,0.15)", badgeBorder: "rgba(124,58,237,0.3)", tagBg: "#1f2937", aiBg: "rgba(124,58,237,0.08)", aiBorder: "rgba(124,58,237,0.2)" }
};

const s = {
  page: { minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif" },
  nav: { position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" },
  navInner: { maxWidth: "1100px", margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoDot: { width: "28px", height: "28px", borderRadius: "8px" },
  logoText: { fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { fontSize: "14px", cursor: "pointer" },
  themeBtn: { fontSize: "13px", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" },
  hero: { maxWidth: "860px", margin: "0 auto", padding: "80px 24px 40px", textAlign: "center" },
  heroBadge: { display: "inline-block", fontSize: "13px", fontWeight: "600", padding: "6px 16px", borderRadius: "20px", marginBottom: "24px" },
  heroTitle: { fontSize: "clamp(36px,6vw,64px)", fontWeight: "900", lineHeight: "1.1", letterSpacing: "-2px", margin: "0 0 20px" },
  heroSub: { fontSize: "17px", lineHeight: "1.6", maxWidth: "540px", margin: "0 auto 40px" },
  statsRow: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" },
  statCard: { padding: "14px 24px", borderRadius: "12px", textAlign: "center" },
  section: { maxWidth: "800px", margin: "0 auto", padding: "0 24px 60px" },
  uploadCard: { borderRadius: "20px", padding: "48px 32px", textAlign: "center", marginBottom: "16px", transition: "all 0.2s" },
  uploadEmoji: { fontSize: "48px", marginBottom: "16px" },
  uploadTitle: { fontSize: "18px", fontWeight: "700", margin: "0 0 8px" },
  uploadSub: { fontSize: "14px", margin: "0 0 24px" },
  browseBtn: { display: "inline-block", padding: "10px 24px", borderRadius: "10px", border: "1.5px solid #7c3aed", color: "#7c3aed", fontWeight: "600", fontSize: "14px", cursor: "pointer" },
  uploadBtn: { display: "inline-block", padding: "12px 32px", borderRadius: "10px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "white", fontWeight: "700", fontSize: "15px", border: "none", cursor: "pointer" },
  uploadedTag: { display: "inline-block", padding: "8px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: "600" },
  atsCard: { borderRadius: "16px", padding: "24px", marginBottom: "16px" },
  atsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  atsTitle: { fontSize: "18px", fontWeight: "700", margin: "0 0 6px" },
  atsSummary: { fontSize: "13px", margin: 0, lineHeight: "1.5" },
  atsCircle: { width: "80px", height: "80px", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  atsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  atsLabel: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", margin: "0 0 8px" },
  atsPoint: { fontSize: "13px", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px", lineHeight: "1.4" },
  locationCard: { borderRadius: "16px", padding: "20px 24px", marginBottom: "16px" },
  locationTitle: { fontSize: "15px", fontWeight: "600", margin: "0 0 14px" },
  locationBtns: { display: "flex", gap: "10px", flexWrap: "wrap" },
  locBtn: { padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  matchBtn: { width: "100%", padding: "18px", borderRadius: "14px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "white", fontWeight: "800", fontSize: "17px", border: "none", cursor: "pointer", marginBottom: "12px" },
  progressWrap: { height: "4px", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" },
  progressBar: { height: "100%", width: "70%", background: "linear-gradient(90deg,#7c3aed,#ec4899)", borderRadius: "2px" },
  errorBox: { padding: "14px 18px", borderRadius: "10px", fontSize: "14px" },
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  resultsTitle: { fontSize: "26px", fontWeight: "800", margin: 0 },
  resultsBadge: { fontSize: "13px", fontWeight: "700", padding: "6px 14px", borderRadius: "20px" },
  jobCard: { borderRadius: "20px", padding: "28px", marginBottom: "20px", transition: "border 0.2s" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  rankBadge: { fontSize: "12px", fontWeight: "700", padding: "5px 12px", borderRadius: "20px" },
  scorePill: { fontSize: "13px", fontWeight: "700", padding: "6px 14px", borderRadius: "20px" },
  jobTitle: { fontSize: "22px", fontWeight: "800", margin: "0 0 10px", letterSpacing: "-0.5px" },
  jobMeta: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" },
  metaTag: { fontSize: "13px", padding: "5px 12px", borderRadius: "8px", fontWeight: "500" },
  scoreBarWrap: { height: "6px", borderRadius: "3px", marginBottom: "20px", overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: "3px", background: "linear-gradient(90deg,#7c3aed,#ec4899)" },
  skillsSection: { marginBottom: "16px" },
  skillsRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" },
  chipGreen: { fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "#d1fae5", color: "#065f46", fontWeight: "600" },
  chipRed: { fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "#fee2e2", color: "#991b1b", fontWeight: "600" },
  chipAmber: { fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "#fef3c7", color: "#92400e", fontWeight: "600" },
  aiBox: { borderRadius: "12px", padding: "18px", marginBottom: "20px" },
  aiText: { fontSize: "14px", lineHeight: "1.7", margin: "0 0 8px" },
  verdict: { fontSize: "13px", fontStyle: "italic", margin: 0, fontWeight: "600" },
  applyBtn: { display: "inline-block", padding: "12px 28px", borderRadius: "10px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "white", fontWeight: "700", fontSize: "14px", textDecoration: "none" },
  footer: { textAlign: "center", padding: "32px 24px", fontSize: "14px", display: "flex", justifyContent: "center", gap: "16px" },
};

export default App;