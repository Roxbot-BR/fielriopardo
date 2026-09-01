"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * SecurityGuard — applies frontend protections against DevTools, copy and inspection.
 * All protections are DISABLED for MASTER users.
 */
export default function SecurityGuard() {
  const { isMaster } = useAuth();

  useEffect(() => {
    if (isMaster) return; // MASTER bypasses all protections

    // ── 1. Disable right-click ───────────────────────────────────────────────
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    // ── 2. Block DevTools keyboard shortcuts ─────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // F12
      if (key === "F12") { e.preventDefault(); return; }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (inspector / console / element picker)
      if (ctrl && shift && ["i", "I", "j", "J", "c", "C"].includes(key)) { e.preventDefault(); return; }
      // Ctrl+U (view source)
      if (ctrl && (key === "u" || key === "U")) { e.preventDefault(); return; }
      // Ctrl+S (save page)
      if (ctrl && (key === "s" || key === "S")) { e.preventDefault(); return; }
      // Ctrl+A (select all) — only block outside inputs/textareas
      if (ctrl && (key === "a" || key === "A")) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (!["INPUT", "TEXTAREA"].includes(tag)) e.preventDefault();
        return;
      }
      // Ctrl+C / Ctrl+X outside inputs
      if (ctrl && (key === "c" || key === "x")) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (!["INPUT", "TEXTAREA"].includes(tag)) e.preventDefault();
        return;
      }
    };

    // ── 3. Disable text selection & copy outside inputs ──────────────────────
    const onSelectStart = (e: Event) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (!["INPUT", "TEXTAREA"].includes(tag)) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (!["INPUT", "TEXTAREA"].includes(tag)) e.preventDefault();
    };
    const onCut = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (!["INPUT", "TEXTAREA"].includes(tag)) e.preventDefault();
    };

    // ── 4. Disable drag (prevents content capture) ───────────────────────────
    const onDragStart = (e: DragEvent) => e.preventDefault();

    // ── 5. DevTools size-based detection ────────────────────────────────────
    let devToolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
      const isMobileViewport = window.innerWidth < 1024;
      if (isTouchDevice || isMobileViewport) {
        if (devToolsOpen) {
          devToolsOpen = false;
          document.body.style.filter = "";
          document.body.style.pointerEvents = "";
        }
        return;
      }
      const widthDiff  = window.outerWidth  - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen = widthDiff > threshold || heightDiff > threshold;
      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        document.body.style.filter = "blur(8px)";
        document.body.style.pointerEvents = "none";
      } else if (!isOpen && devToolsOpen) {
        devToolsOpen = false;
        document.body.style.filter = "";
        document.body.style.pointerEvents = "";
      }
    };
    const devToolsInterval = setInterval(checkDevTools, 1000);

    // ── 6. CSS: disable user-select globally ─────────────────────────────────
    const style = document.createElement("style");
    style.id = "security-guard-styles";
    style.textContent = `
      body * { user-select: none !important; -webkit-user-select: none !important; }
      input, textarea, [contenteditable] { user-select: text !important; -webkit-user-select: text !important; }
      img { pointer-events: none !important; -webkit-user-drag: none !important; }
    `;
    document.head.appendChild(style);

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("copy", onCopy as EventListener);
    document.addEventListener("cut", onCut as EventListener);
    document.addEventListener("dragstart", onDragStart as EventListener);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("copy", onCopy as EventListener);
      document.removeEventListener("cut", onCut as EventListener);
      document.removeEventListener("dragstart", onDragStart as EventListener);
      clearInterval(devToolsInterval);
      document.body.style.filter = "";
      document.body.style.pointerEvents = "";
      document.getElementById("security-guard-styles")?.remove();
    };
  }, [isMaster]);

  return null;
}
