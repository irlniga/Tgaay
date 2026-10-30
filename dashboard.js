import { db, requireAuth, toast, busy, logout } from "./core.js";
import { collection, doc, getDoc, query, where, limit, onSnapshot, serverTimestamp, increment, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const genCode = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; crypto.getRandomValues(new Uint8Array(6)).forEach(n => s += a[n % a.length]); return s; };
const go = id => location.href = "room.html?id=" + id;

function roomCard(r, id, mine) {
  const c = el("div", "glass room");
  c.append(el("h3", "", r.name), el("p", "muted", r.description || "No description."));
  const meta = el("div", "row"); meta.append(el("span", "chip", `${r.participantCount || 0}/${r.maxParticipants} joined`), el("span", "chip", r.isPrivate ? "Private" : "Public"));
  if (r.locked) meta.append(el("span", "chip", "Locked"));
  const act = el("div", "row");
  const enter = el("button", "btn gold sm", mine ? "Enter" : "Join"); enter.onclick = () => mine ? go(id) : joinRoom(id, r, enter);
  act.append(enter);
  if (mine) { const cp = el("button", "btn sm", "Copy code"); cp.onclick = () => navigator.clipboard.writeText(r.code).then(() => toast("Code " + r.code + " copied"), () => toast("Code: " + r.code)); act.append(cp); }
  c.append(meta, act); return c;
}
const empty = (box, t) => { box.replaceChildren(el("p", "muted", t)); };

async function joinRoom(id, r, btn) {
  if (r.locked) return toast("This room is locked by the host.");
  if ((r.participantCount || 0) >= r.maxParticipants) return toast("This room is full.");
  if (btn) busy(btn, true);
  try {
    const user = window.__me, pRef = doc(db, "roomParticipants", id + "_" + user.uid);
    if (!(await getDoc(pRef)).exists()) {
      const b = writeBatch(db);
      b.set(pRef, { roomId: id, roomName: r.name, userId: user.uid, displayName: user.displayName || "Guest", role: "member", joinedAt: serverTimestamp() });
      b.update(doc(db, "rooms", id), { participantCount: increment(1) });
      await b.commit();
    }
    go(id);
  } catch (e) { toast("Could not join the room."); if (btn) busy(btn, false); }
}

requireAuth(user => {
  window.__me = user;
  $("#hello").textContent = "Welcome, " + (user.displayName || "friend") + " 🥂";
  $("#logout").onclick = logout;
  document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());
  $("#openCreate").onclick = () => $("#dCreate").showModal();
  const openJoin = () => { $("#info").textContent = ""; $("#dJoin").showModal(); };
  $("#openJoin").onclick = openJoin; if (location.hash === "#join") openJoin();

  // My rooms
  onSnapshot(query(collection(db, "roomParticipants"), where("userId", "==", user.uid), limit(30)), async snap => {
    const box = $("#mine"); if (snap.empty) return empty(box, "You haven't joined any rooms yet.");
    const cards = await Promise.all(snap.docs.map(async d => { const rs = await getDoc(doc(db, "rooms", d.data().roomId)); return rs.exists() ? [rs.id, rs.data(), d.data().joinedAt?.seconds || 0] : null; }));
    const rows = cards.filter(Boolean).sort((a, b) => b[2] - a[2]);
    box.replaceChildren(...rows.map(([id, r]) => roomCard(r, id, true)));
    if (!rows.length) empty(box, "You haven't joined any rooms yet.");
  }, () => toast("Could not load your rooms."));

  // Active public rooms
  onSnapshot(query(collection(db, "rooms"), where("isPrivate", "==", false), where("status", "==", "active"), limit(20)), snap => {
    const box = $("#active"); if (snap.empty) return empty(box, "No public rooms right now. Create one!");
    box.replaceChildren(...snap.docs.map(d => roomCard(d.data(), d.id, false)));
  }, () => toast("Could not load active rooms."));

  // Notification badge
  onSnapshot(query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false)), s => { const n = $("#nb"); n.hidden = !s.size; n.textContent = s.size; }, () => {});

  // Create room
  $("#fCreate").onsubmit = async e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("[type=submit]"), name = f.name.value.trim(), max = +f.max.value;
    if (name.length < 2) return toast("Give your room a name.");
    if (!(max >= 2 && max <= 12)) return toast("Participants must be between 2 and 12.");
    busy(btn, true);
    for (let i = 0; i < 4; i++) {
      const code = genCode(), rRef = doc(collection(db, "rooms")), b = writeBatch(db);
      b.set(rRef, { name, description: f.desc.value.trim(), isPrivate: f.vis.value === "private", maxParticipants: max, code, hostId: user.uid, hostName: user.displayName || "Host", locked: false, status: "active", participantCount: 1, createdAt: serverTimestamp() });
      b.set(doc(db, "roomCodes", code), { roomId: rRef.id, hostId: user.uid });
      b.set(doc(db, "roomParticipants", rRef.id + "_" + user.uid), { roomId: rRef.id, roomName: name, userId: user.uid, displayName: user.displayName || "Host", role: "host", joinedAt: serverTimestamp() });
      try { await b.commit(); toast("Room created! Code: " + code); f.reset(); $("#dCreate").close(); busy(btn, false); return; } catch (err) { /* code collision: retry */ }
    }
    toast("Could not create the room. Try again."); busy(btn, false);
  };

  // Join by code (step 1: show info, step 2: confirm)
  let found = null;
  $("#fJoin").onsubmit = async e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("[type=submit]"), info = $("#info");
    if (found) { await joinRoom(found.id, found.r, btn); return; }
    const code = f.code.value.trim().toUpperCase(); if (code.length !== 6) return toast("Room codes have 6 characters.");
    busy(btn, true);
    try {
      const c = await getDoc(doc(db, "roomCodes", code)); if (!c.exists()) throw 0;
      const rs = await getDoc(doc(db, "rooms", c.data().roomId)); if (!rs.exists() || rs.data().status !== "active") throw 0;
      const r = rs.data(); found = { id: rs.id, r };
      info.textContent = `${r.name} — hosted by ${r.hostName}. ${r.participantCount}/${r.maxParticipants} joined.${r.locked ? " (Locked)" : ""}`;
      btn.dataset.t = "Join room"; busy(btn, false);
    } catch (err) { toast("Invalid or closed room code."); busy(btn, false); }
  };
  $("#fJoin").code.oninput = () => { found = null; $("#info").textContent = ""; const b = $("#fJoin [type=submit]"); b.dataset.t = "Find room"; b.textContent = "Find room"; };
});
