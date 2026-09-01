"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import {
  Upload, FolderOpen, Trash2, Star, StarOff, Download, X,
  ChevronLeft, ChevronRight, MessageCircle, Pencil, Check, Camera,
  Loader2, ImageIcon, ArrowLeft,
} from "lucide-react";

const CDN     = process.env.NEXT_PUBLIC_CDN_URL  ?? "";

interface Photo {
  id: string;
  url: string;
  caption: string;
  isFeatured: boolean;
  originalName?: string;
  fileSizeBytes?: number;
  compressedSizeBytes?: number;
  createdAt: string;
}

function fmtBytes(b?: number) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

async function compressIfNeeded(file: File): Promise<File> {
  const THREE_MB = 3 * 1024 * 1024;
  if (file.size <= THREE_MB) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else                { width  = Math.round(width  * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", 0.82);
    };
    img.onerror = () => resolve(file);
    img.src = blobUrl;
  });
}

export default function BancoFotosPage() {
  const { id: caravanId } = useParams<{ id: string }>();
  const router = useRouter();
  const [photos, setPhotos]           = useState<Photo[]>([]);
  const [caravanName, setCaravanName] = useState("");
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [lightbox, setLightbox]       = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState<{ id: string; value: string } | null>(null);
  const [toast, setToast]             = useState<string>("");
  const fileRef   = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const lbRef     = useRef<HTMLDivElement>(null);

  const authHeader = () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("fiel_token") ?? localStorage.getItem("token") ?? "") : "";
    return { Authorization: `Bearer ${token}` };
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/caravans/${caravanId}`, { headers: authHeader() });
      const data = await res.json();
      setCaravanName(data.destination ?? data.title ?? "Caravana");
      setPhotos(data.photos ?? []);
    } catch { showToast("Erro ao carregar fotos"); }
    finally { setLoading(false); }
  }, [caravanId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox === null) return;
      if (e.key === "ArrowRight") setLightbox(i => i !== null ? Math.min(i + 1, photos.length - 1) : null);
      if (e.key === "ArrowLeft")  setLightbox(i => i !== null ? Math.max(i - 1, 0) : null);
      if (e.key === "Escape")     setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) { showToast("Nenhuma imagem selecionada"); return; }
    setUploading(true);
    setUploadProgress({ done: 0, total: arr.length });
    const BATCH = 10;
    for (let i = 0; i < arr.length; i += BATCH) {
      const batch = arr.slice(i, i + BATCH);
      const fd = new FormData();
      for (const file of batch) {
        const compressed = await compressIfNeeded(file);
        fd.append("files", compressed, compressed.name);
      }
      await fetch(`${API_URL}/caravans/${caravanId}/photos/upload`, {
        method: "POST",
        headers: authHeader(),
        body: fd,
      });
      setUploadProgress({ done: Math.min(i + BATCH, arr.length), total: arr.length });
    }
    await load();
    setUploading(false);
    setUploadProgress(null);
    const n = arr.length;
    showToast(`✅ ${n} foto${n > 1 ? "s" : ""} enviada${n > 1 ? "s" : ""}!`);
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Excluir esta foto?")) return;
    await fetch(`${API_URL}/caravans/${caravanId}/photos/${photoId}`, {
      method: "DELETE", headers: authHeader(),
    });
    setPhotos(p => p.filter(x => x.id !== photoId));
    if (lightbox !== null) setLightbox(null);
    showToast("Foto excluída");
  }

  async function saveCaption(id: string, caption: string) {
    await fetch(`${API_URL}/caravans/${caravanId}/photos/${id}/caption`, {
      method: "PATCH",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
    setPhotos(p => p.map(x => x.id === id ? { ...x, caption } : x));
    setEditCaption(null);
    showToast("Legenda salva");
  }

  async function toggleFeatured(id: string) {
    await fetch(`${API_URL}/caravans/${caravanId}/photos/${id}/featured`, {
      method: "PATCH", headers: authHeader(),
    });
    setPhotos(p => p.map(x => x.id === id ? { ...x, isFeatured: !x.isFeatured } : x));
  }

  function downloadPhoto(photo: Photo) {
    const a = document.createElement("a");
    a.href = CDN + photo.url;
    a.download = photo.originalName ?? `foto-${photo.id}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function shareWhatsApp(photo: Photo) {
    const photoUrl = encodeURIComponent(`${window.location.origin}${CDN}${photo.url}`);
    const text = encodeURIComponent(
      `🖤🤍 ${caravanName}${photo.caption ? " — " + photo.caption : ""}\n`
    );
    window.open(`https://wa.me/?text=${text}${photoUrl}`, "_blank");
  }

  const currentPhoto = lightbox !== null ? photos[lightbox] : null;
  const stripStart = lightbox !== null ? Math.max(0, lightbox - 3) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2d2d2d]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-white flex items-center gap-2">
              <Camera size={20} className="text-[#C8A951]" />
              Banco de Fotos
            </h1>
            <p className="text-sm text-gray-400">
              {caravanName} · {photos.length} foto{photos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* UPLOAD ZONE */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
          className={[
            "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200",
            dragOver
              ? "border-[#C8A951] bg-[#C8A951]/5 scale-[1.01]"
              : "border-[#2d2d2d] hover:border-[#C8A951]/50 bg-[#111] cursor-pointer",
          ].join(" ")}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 size={40} className="mx-auto text-[#C8A951] animate-spin" />
              <p className="text-[#C8A951] font-semibold">
                Enviando… {uploadProgress?.done}/{uploadProgress?.total}
              </p>
              <div className="w-64 mx-auto bg-[#2d2d2d] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[#C8A951] transition-all duration-300 rounded-full"
                  style={{
                    width: uploadProgress
                      ? `${(uploadProgress.done / uploadProgress.total) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Imagens &gt; 3 MB são comprimidas automaticamente
              </p>
            </div>
          ) : (
            <>
              <Upload size={44} className="mx-auto mb-4 text-[#C8A951]/60" />
              <p className="text-lg font-semibold text-white mb-1">
                Arraste fotos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mb-5">
                JPG · PNG · WEBP · Imagens &gt; 3 MB são comprimidas automaticamente
              </p>
              <div className="flex gap-3 justify-center" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#C8A951] text-black rounded-xl font-semibold hover:bg-[#d4b85a] transition-colors text-sm"
                >
                  <Upload size={15} /> Selecionar fotos
                </button>
                <button
                  onClick={() => folderRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white border border-[#3d3d3d] rounded-xl font-semibold hover:border-[#C8A951] transition-colors text-sm"
                >
                  <FolderOpen size={15} /> Selecionar pasta
                </button>
              </div>
            </>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
          {/* Folder input — webkitdirectory via spread to avoid TS error */}
          <input
            ref={folderRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            {...({ webkitdirectory: "", mozdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
        </div>

        {/* GALLERY GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#C8A951]" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma foto ainda. Faça o primeiro upload!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#111] border border-[#2d2d2d] hover:border-[#C8A951]/50 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(200,169,81,0.15)]"
              >
                <img
                  src={CDN + photo.url}
                  alt={photo.caption ?? "Foto"}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightbox(idx)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); toggleFeatured(photo.id); }}
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-[#C8A951]/80 transition-colors"
                  >
                    {photo.isFeatured
                      ? <Star size={13} className="text-[#C8A951] fill-[#C8A951]" />
                      : <StarOff size={13} className="text-white" />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deletePhoto(photo.id); }}
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={13} className="text-white" />
                  </button>
                </div>

                {photo.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <Star size={14} className="text-[#C8A951] fill-[#C8A951] drop-shadow" />
                  </div>
                )}
                {photo.caption && (
                  <p className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption}
                  </p>
                )}
                {photo.fileSizeBytes && photo.compressedSizeBytes &&
                  photo.fileSizeBytes > 3 * 1024 * 1024 && (
                  <div className="absolute bottom-1 right-1 text-[9px] bg-black/70 rounded px-1 py-0.5 text-[#C8A951] opacity-0 group-hover:opacity-100 transition-opacity">
                    {fmtBytes(photo.fileSizeBytes)} → {fmtBytes(photo.compressedSizeBytes)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && currentPhoto && (
        <div
          ref={lbRef}
          className="fixed inset-0 z-[9999] flex flex-col bg-black/98 backdrop-blur-sm"
          onClick={e => { if (e.target === lbRef.current) setLightbox(null); }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0 flex-wrap">
            {/* Corinthians identity */}
            <div className="flex items-center gap-2 mr-2">
              <div className="w-9 h-9 rounded-full bg-black border-2 border-[#C8A951] flex items-center justify-center text-xs font-black text-white shadow-[0_0_12px_rgba(200,169,81,0.4)]">
                SC
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{caravanName}</p>
                <p className="text-xs text-[#C8A951]">{lightbox + 1} / {photos.length}</p>
              </div>
            </div>

            <div className="flex-1" />

            {/* Caption edit */}
            {editCaption?.id === currentPhoto.id ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  value={editCaption.value}
                  onChange={e => setEditCaption({ ...editCaption, value: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveCaption(editCaption.id, editCaption.value);
                    if (e.key === "Escape") setEditCaption(null);
                  }}
                  className="bg-[#1a1a1a] border border-[#C8A951] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none w-52"
                  placeholder="Legenda da foto..."
                />
                <button
                  onClick={() => saveCaption(editCaption.id, editCaption.value)}
                  className="p-2 rounded-lg bg-[#C8A951] text-black hover:bg-[#d4b85a] transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditCaption(null)}
                  className="p-2 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setEditCaption({ id: currentPhoto.id, value: currentPhoto.caption ?? "" }); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2d2d2d] transition-colors text-sm border border-[#2d2d2d]"
              >
                <Pencil size={13} /> Legenda
              </button>
            )}

            <button
              onClick={e => { e.stopPropagation(); toggleFeatured(currentPhoto.id); }}
              className={`p-2 rounded-lg border transition-colors ${
                currentPhoto.isFeatured
                  ? "bg-[#C8A951]/20 border-[#C8A951] text-[#C8A951]"
                  : "bg-[#1a1a1a] border-[#2d2d2d] text-gray-400 hover:text-[#C8A951] hover:border-[#C8A951]/50"
              }`}
              title={currentPhoto.isFeatured ? "Remover destaque" : "Destacar foto"}
            >
              <Star size={15} className={currentPhoto.isFeatured ? "fill-[#C8A951]" : ""} />
            </button>

            {/* WhatsApp share */}
            <button
              onClick={e => { e.stopPropagation(); shareWhatsApp(currentPhoto); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-colors text-sm border border-[#25D366]/30 font-medium"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle size={14} /> WhatsApp
            </button>

            {/* Download */}
            <button
              onClick={e => { e.stopPropagation(); downloadPhoto(currentPhoto); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors text-sm border border-[#2d2d2d] font-medium"
              title="Baixar foto"
            >
              <Download size={14} /> Baixar
            </button>

            {/* Delete */}
            <button
              onClick={e => { e.stopPropagation(); deletePhoto(currentPhoto.id); }}
              className="p-2 rounded-lg bg-[#1a1a1a] text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors border border-[#2d2d2d]"
              title="Excluir foto"
            >
              <Trash2 size={15} />
            </button>

            {/* Close */}
            <button
              onClick={() => setLightbox(null)}
              className="p-2 rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2d2d2d] transition-colors border border-[#2d2d2d]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Image area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden px-16 min-h-0">
            {/* Prev */}
            {lightbox > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}
                className="absolute left-3 z-10 p-3 rounded-full bg-black/70 border border-[#C8A951]/30 text-white hover:bg-[#C8A951]/20 hover:border-[#C8A951] transition-all shadow-lg"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {/* Next */}
            {lightbox < photos.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}
                className="absolute right-3 z-10 p-3 rounded-full bg-black/70 border border-[#C8A951]/30 text-white hover:bg-[#C8A951]/20 hover:border-[#C8A951] transition-all shadow-lg"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Gold corner accents — Corinthians elegance */}
            <div className="absolute top-4 left-20 w-10 h-10 border-t-2 border-l-2 border-[#C8A951]/35 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-4 right-20 w-10 h-10 border-t-2 border-r-2 border-[#C8A951]/35 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-4 left-20 w-10 h-10 border-b-2 border-l-2 border-[#C8A951]/35 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-4 right-20 w-10 h-10 border-b-2 border-r-2 border-[#C8A951]/35 rounded-br-xl pointer-events-none" />

            <img
              key={lightbox}
              src={CDN + currentPhoto.url}
              alt={currentPhoto.caption ?? "Foto"}
              className="max-h-full max-w-full object-contain rounded-xl shadow-[0_0_80px_rgba(200,169,81,0.12)]"
              style={{ maxHeight: "calc(100vh - 180px)" }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex-shrink-0 px-6 py-3 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              {currentPhoto.caption ? (
                <p className="text-white font-semibold truncate">{currentPhoto.caption}</p>
              ) : (
                <p className="text-gray-600 italic text-sm">Sem legenda — clique em &quot;Legenda&quot; para adicionar</p>
              )}
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {currentPhoto.originalName ?? ""}
                {currentPhoto.fileSizeBytes ? ` · ${fmtBytes(currentPhoto.fileSizeBytes)}` : ""}
                {currentPhoto.fileSizeBytes && currentPhoto.compressedSizeBytes &&
                  currentPhoto.fileSizeBytes !== currentPhoto.compressedSizeBytes
                  ? ` → ${fmtBytes(currentPhoto.compressedSizeBytes)} (comprimido)` : ""}
              </p>
            </div>

            {/* Thumbnail strip */}
            <div className="hidden md:flex gap-1.5 overflow-x-auto">
              {photos.slice(stripStart, stripStart + 7).map((p, i) => {
                const realIdx = stripStart + i;
                return (
                  <button
                    key={p.id}
                    onClick={e => { e.stopPropagation(); setLightbox(realIdx); }}
                    className={[
                      "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      realIdx === lightbox
                        ? "border-[#C8A951] scale-110 shadow-[0_0_12px_rgba(200,169,81,0.5)]"
                        : "border-transparent opacity-40 hover:opacity-75",
                    ].join(" ")}
                  >
                    <img src={CDN + p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] px-5 py-3 rounded-xl bg-[#1a1a1a] border border-[#C8A951]/40 text-white text-sm font-medium shadow-2xl pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
