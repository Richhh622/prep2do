const { useState, useEffect, useRef } = React;

const INIT = [
  {
    id: 1, name: "大創", emoji: "🛍️",
    categories: [
      { id: 11, name: "化妝品類💄", items: [{ id: 111, name: "示範商品", image: "", priceKRW: 3000, note: "Basic 範例" }] },
      { id: 12, name: "其他", items: [] },
    ],
  },
  {
    id: 2, name: "Olive Young", emoji: "🫒",
    categories: [
      { id: 21, name: "化妝品類💄", items: [] },
      { id: 22, name: "保養品類", items: [] },
      { id: 23, name: "其他", items: [] },
    ],
  },
  {
    id: 3, name: "韓國藥局", emoji: "💊",
    categories: [
      { id: 31, name: "保養品類", items: [] },
    ],
  },
];

const STORAGE_KEY = "kr_shopping_v1";
function loadStores() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveStores(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }

function fmt(n) { return n ? `₩${Number(n).toLocaleString()}` : "—"; }
function twd(krw, r) { return krw && r ? `≈ NT$${Math.round(krw * r).toLocaleString()}` : ""; }

const L = { fontSize: 12, color: "#999", fontWeight: 600, display: "block", marginBottom: 4 };
const INP = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #f0d8d8", fontSize: 14, marginBottom: 12, boxSizing: "border-box", fontFamily: "inherit" };
const SAVEBTN = { flex: 1, padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff6b6b,#ff9a9e)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const CANCELBTN = { flex: 1, padding: 12, borderRadius: 12, border: "1.5px solid #eee", background: "#fff", color: "#aaa", fontWeight: 600, fontSize: 15, cursor: "pointer" };

function App() {
  const [stores, setStores] = useState(() => loadStores() || INIT);
  const [activeId, setActiveId] = useState(() => { const s = loadStores() || INIT; return s[0]?.id || 1; });
  const [rate, setRate] = useState(0.023);
  const [rateStr, setRateStr] = useState("匯率載入中…");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const nextId = useRef(9000);
  const uid = () => ++nextId.current;
  const fileRef = useRef();

  useEffect(() => { saveStores(stores); }, [stores]);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/KRW")
      .then(r => r.json())
      .then(d => {
        const r = d.rates?.TWD;
        if (r) { setRate(r); setRateStr(`1 KRW ≈ ${r.toFixed(4)} TWD（即時）`); }
        else setRateStr("1 KRW ≈ 0.0230 TWD（預設）");
      })
      .catch(() => setRateStr("1 KRW ≈ 0.0230 TWD（預設）"));
  }, []);

  const store = stores.find(s => s.id === activeId) || stores[0];
  const mut = fn => setStores(prev => { const d = JSON.parse(JSON.stringify(prev)); fn(d); return d; });
  const open = (type, extra = {}) => { setModal({ type, ...extra }); setForm(extra.item ? { ...extra.item } : (extra.defaults || {})); };
  const close = () => { setModal(null); setForm({}); };
  const fset = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImageFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const total = stores.reduce((a, s) => a + s.categories.reduce((b, c) => b + c.items.reduce((x, i) => x + (Number(i.priceKRW) || 0), 0), 0), 0);

  const saveItem = () => {
    mut(d => {
      const st = d.find(s => s.id === modal.storeId);
      const ct = st.categories.find(c => c.id === modal.catId);
      const newItem = { ...form, priceKRW: Number(form.priceKRW) || 0 };
      if (modal.item) {
        const idx = ct.items.findIndex(i => i.id === modal.item.id);
        ct.items[idx] = { ...newItem, id: modal.item.id };
      } else {
        ct.items.push({ ...newItem, id: uid() });
      }
    });
    close();
  };

  return (
    React.createElement("div", { style: { minHeight: "100vh", background: "#fff9f5" } },
      // Header
      React.createElement("div", { style: { background: "linear-gradient(135deg,#ff6b6b,#ff9a9e)", padding: "18px 16px 14px", color: "#fff" } },
        React.createElement("div", { style: { maxWidth: 480, margin: "0 auto" } },
          React.createElement("div", { style: { fontSize: 20, fontWeight: 800 } }, "🇰🇷 韓國購物清單"),
          React.createElement("div", { style: { fontSize: 11, opacity: 0.85, marginTop: 2 } }, rateStr),
          React.createElement("div", { style: { marginTop: 10, background: "rgba(255,255,255,0.22)", borderRadius: 10, padding: "8px 14px", display: "inline-block" } },
            React.createElement("div", { style: { fontSize: 11, opacity: 0.9 } }, "預估總花費"),
            React.createElement("div", { style: { fontSize: 17, fontWeight: 700 } },
              fmt(total), " ",
              React.createElement("span", { style: { fontSize: 13, fontWeight: 400 } }, twd(total, rate))
            )
          )
        )
      ),

      React.createElement("div", { style: { maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" } },
        // Tabs
        React.createElement("div", { style: { display: "flex", gap: 8, overflowX: "auto", padding: "12px 0 4px" } },
          ...stores.map(s =>
            React.createElement("button", {
              key: s.id, onClick: () => setActiveId(s.id),
              style: { whiteSpace: "nowrap", padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeId === s.id ? "#ff6b6b" : "#f0e6e6", color: activeId === s.id ? "#fff" : "#a05050" }
            }, `${s.emoji} ${s.name}`)
          ),
          React.createElement("button", {
            onClick: () => open("store", { defaults: { name: "", emoji: "🛍️" } }),
            style: { whiteSpace: "nowrap", padding: "7px 14px", borderRadius: 20, border: "2px dashed #f0b8b8", background: "none", color: "#cc7777", cursor: "pointer", fontWeight: 600, fontSize: 13 }
          }, "＋ 新店家")
        ),

        store && React.createElement(React.Fragment, null,
          // Store header
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 8px" } },
            React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: "#cc4444" } }, `${store.emoji} ${store.name}`),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              React.createElement("button", { onClick: () => open("cat", { storeId: store.id, defaults: { name: "" } }), style: { fontSize: 12, padding: "5px 12px", borderRadius: 14, border: "none", background: "#ffe0e0", color: "#cc4444", cursor: "pointer", fontWeight: 600 } }, "＋ 分類"),
              React.createElement("button", { onClick: () => { if (window.confirm("刪除此店家？")) { const rest = stores.filter(s => s.id !== store.id); setStores(rest); setActiveId(rest[0]?.id); } }, style: { fontSize: 12, padding: "5px 8px", borderRadius: 14, border: "none", background: "#f5f5f5", color: "#bbb", cursor: "pointer" } }, "🗑")
            )
          ),

          // Categories
          ...store.categories.map(cat =>
            React.createElement("div", { key: cat.id, style: { marginBottom: 12, background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" } },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: "#fff5f5", borderBottom: "1px solid #ffe8e8" } },
                React.createElement("div", { style: { fontWeight: 700, color: "#cc4444", fontSize: 14 } }, cat.name),
                React.createElement("div", { style: { display: "flex", gap: 6 } },
                  React.createElement("button", { onClick: () => open("item", { storeId: store.id, catId: cat.id }), style: { fontSize: 12, padding: "4px 10px", borderRadius: 12, border: "none", background: "#ff6b6b", color: "#fff", cursor: "pointer", fontWeight: 600 } }, "＋ 商品"),
                  React.createElement("button", { onClick: () => { if (window.confirm("刪除此分類？")) mut(d => { const st = d.find(s => s.id === store.id); st.categories = st.categories.filter(c => c.id !== cat.id); }); }, style: { fontSize: 12, padding: "4px 8px", borderRadius: 12, border: "none", background: "#f0f0f0", color: "#bbb", cursor: "pointer" } }, "🗑")
                )
              ),
              cat.items.length === 0
                ? React.createElement("div", { style: { padding: "14px", color: "#ccc", fontSize: 13, textAlign: "center" } }, "點「＋ 商品」新增")
                : cat.items.map(item =>
                  React.createElement("div", { key: item.id, style: { display: "flex", gap: 10, padding: "10px 14px", borderBottom: "1px solid #fafafa", alignItems: "flex-start" } },
                    React.createElement("div", { style: { width: 54, height: 54, borderRadius: 10, background: "#f5eaea", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 } },
                      item.image ? React.createElement("img", { src: item.image, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }) : "🛒"
                    ),
                    React.createElement("div", { style: { flex: 1 } },
                      React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, item.name),
                      React.createElement("div", { style: { fontSize: 13, color: "#ff6b6b", fontWeight: 700 } }, fmt(item.priceKRW)),
                      React.createElement("div", { style: { fontSize: 12, color: "#aaa" } }, twd(item.priceKRW, rate)),
                      item.note && React.createElement("div", { style: { fontSize: 11, color: "#bbb", marginTop: 1 } }, `📝 ${item.note}`)
                    ),
                    React.createElement("div", { style: { display: "flex", gap: 4 } },
                      React.createElement("button", { onClick: () => open("item", { storeId: store.id, catId: cat.id, item }), style: { padding: "5px 8px", borderRadius: 10, border: "none", background: "#fff0f0", cursor: "pointer" } }, "✏️"),
                      React.createElement("button", { onClick: () => mut(d => { const st = d.find(s => s.id === store.id); const ct = st.categories.find(c => c.id === cat.id); ct.items = ct.items.filter(i => i.id !== item.id); }), style: { padding: "5px 8px", borderRadius: 10, border: "none", background: "#f5f5f5", color: "#bbb", cursor: "pointer" } }, "🗑")
                    )
                  )
                )
            )
          )
        )
      ),

      // Hidden file input
      React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleImageFile }),

      // Modal
      modal && React.createElement("div", {
        onClick: e => e.target === e.currentTarget && close(),
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }
      },
        React.createElement("div", { style: { background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" } },

          modal.type === "item" && React.createElement(React.Fragment, null,
            React.createElement("div", { style: { fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#cc4444" } }, modal.item ? "✏️ 編輯商品" : "＋ 新增商品"),
            React.createElement("label", { style: L }, "商品名稱"),
            React.createElement("input", { style: INP, value: form.name || "", onChange: fset("name"), placeholder: "e.g. 防曬乳 SPF50" }),
            React.createElement("label", { style: L }, "商品圖片"),
            React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 14 } },
              React.createElement("div", {
                onClick: () => fileRef.current?.click(),
                style: { width: 72, height: 72, borderRadius: 12, border: "2px dashed #f0b8b8", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }
              },
                form.image ? React.createElement("img", { src: form.image, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }) : React.createElement("span", { style: { fontSize: 28 } }, "📷")
              ),
              React.createElement("div", null,
                React.createElement("button", { onClick: () => fileRef.current?.click(), style: { padding: "8px 16px", borderRadius: 12, border: "none", background: "#ffe0e0", color: "#cc4444", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "block", marginBottom: 6 } }, "從相簿選擇"),
                form.image && React.createElement("button", { onClick: () => setForm(f => ({ ...f, image: "" })), style: { padding: "6px 12px", borderRadius: 12, border: "none", background: "#f5f5f5", color: "#aaa", fontSize: 12, cursor: "pointer" } }, "移除圖片")
              )
            ),
            React.createElement("label", { style: L }, "價格（韓元 ₩）"),
            React.createElement("input", { style: INP, type: "number", value: form.priceKRW || "", onChange: fset("priceKRW"), placeholder: "e.g. 15000" }),
            Number(form.priceKRW) > 0 && React.createElement("div", { style: { fontSize: 12, color: "#ff6b6b", marginBottom: 10, marginTop: -8 } }, twd(form.priceKRW, rate)),
            React.createElement("label", { style: L }, "備註"),
            React.createElement("input", { style: INP, value: form.note || "", onChange: fset("note"), placeholder: "e.g. 買兩個、限定色" }),
            React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 4 } },
              React.createElement("button", { onClick: close, style: CANCELBTN }, "取消"),
              React.createElement("button", { onClick: saveItem, style: SAVEBTN }, "儲存")
            )
          ),

          modal.type === "cat" && React.createElement(React.Fragment, null,
            React.createElement("div", { style: { fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#cc4444" } }, "＋ 新增分類"),
            React.createElement("label", { style: L }, "分類名稱"),
            React.createElement("input", { style: INP, value: form.name || "", onChange: fset("name"), placeholder: "e.g. 保養品類🧴" }),
            React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 4 } },
              React.createElement("button", { onClick: close, style: CANCELBTN }, "取消"),
              React.createElement("button", { onClick: () => { mut(d => { d.find(s => s.id === modal.storeId).categories.push({ id: uid(), name: form.name, items: [] }); }); close(); }, style: SAVEBTN }, "新增")
            )
          ),

          modal.type === "store" && React.createElement(React.Fragment, null,
            React.createElement("div", { style: { fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#cc4444" } }, "＋ 新增店家"),
            React.createElement("label", { style: L }, "店名"),
            React.createElement("input", { style: INP, value: form.name || "", onChange: fset("name"), placeholder: "e.g. 無印良品" }),
            React.createElement("label", { style: L }, "Emoji"),
            React.createElement("input", { style: INP, value: form.emoji || "", onChange: fset("emoji"), placeholder: "e.g. 🛒" }),
            React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 4 } },
              React.createElement("button", { onClick: close, style: CANCELBTN }, "取消"),
              React.createElement("button", { onClick: () => { const nid = uid(); setStores(p => [...p, { id: nid, name: form.name, emoji: form.emoji || "🛒", categories: [] }]); setActiveId(nid); close(); }, style: SAVEBTN }, "新增")
            )
          )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
