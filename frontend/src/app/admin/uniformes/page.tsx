"use client";
import { ShirtSVG, ShirtIcon } from "@/components/ui/ShirtIcon";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Save, Upload } from "lucide-react";


interface Kit {
  id?: string;
  yearStart: number;
  yearEnd: number | null;
  type: string;
  manufacturer: string;
  eraLabel: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceCredit: string;
  isPublished: boolean;
  displayOrder: number | null;
}

const EMPTY: Kit = {
  yearStart: new Date().getFullYear(), yearEnd: null, type: "home",
  manufacturer: "Nike", eraLabel: "Era Nike", title: "", description: "",
  imageUrl: "", sourceCredit: "Wikipedia CC-BY-SA", isPublished: true, displayOrder: null,
};

const TYPE_LABELS: Record<string, string> = {
  home: "Titular", away: "Reserva", third: "Terceiro", goalkeeper: "Goleiro", special: "Especial",
};

export default function AdminUniformesPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [kits, setKits] = useState<Kit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Kit>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api.post<{ url: string }>("/kits/upload-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditing((prev) => ({ ...prev, imageUrl: r.data.url }));
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push("/");
  }, [isAdmin, isLoading]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await api.get<Kit[]>("/kits/admin/all");
      setKits(r.data);
    } catch { toast.error("Erro ao carregar uniformes"); }
  }

  function openNew() { setEditing({ ...EMPTY }); setShowModal(true); }
  function openEdit(k: Kit) { setEditing({ ...k }); setShowModal(true); }

  async function save() {
    if (!editing.title) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/kits/${editing.id}`, editing);
        toast.success("Uniforme atualizado!");
      } else {
        await api.post("/kits", editing);
        toast.success("Uniforme criado!");
      }
      setShowModal(false);
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remover este uniforme?")) return;
    try {
      await api.delete(`/kits/${id}`);
      toast.success("Removido!");
      load();
    } catch { toast.error("Erro ao remover"); }
  }

  function togglePublish(k: Kit) {
    api.put(`/kits/${k.id}`, { isPublished: !k.isPublished })
      .then(() => { toast.success("Atualizado!"); load(); })
      .catch(() => toast.error("Erro"));
  }

  if (isLoading) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white"><span className="inline-flex items-center gap-1 mr-1"><ShirtIcon size={22} /></span>Uniformes</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#C8A951] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#d4b86a]">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="text-gray-400 text-sm mb-4">{kits.length} uniforme{kits.length !== 1 ? "s" : ""} cadastrado{kits.length !== 1 ? "s" : ""}</div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333] text-gray-400 text-left">
              <th className="pb-2 pr-3">Imagem</th>
              <th className="pb-2 pr-3">Título</th>
              <th className="pb-2 pr-3">Ano</th>
              <th className="pb-2 pr-3">Tipo</th>
              <th className="pb-2 pr-3">Fabricante</th>
              <th className="pb-2 pr-3">Publicado</th>
              <th className="pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {kits.map((k) => (
              <tr key={k.id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                <td className="py-2 pr-3">
                  {k.imageUrl ? (
                    <img src={k.imageUrl} alt={k.title} style={{width:40,height:50,objectFit:"contain"}} onError={(e:any)=>{e.currentTarget.style.display="none";}} />
                  ) : (
                    <ShirtSVG fill="white" stroke="black" size={32} />
                  )}
                </td>
                <td className="py-2 pr-3 text-white max-w-xs truncate">{k.title}</td>
                <td className="py-2 pr-3 text-[#C8A951] whitespace-nowrap">
                  {k.yearStart}{k.yearEnd && k.yearEnd !== k.yearStart ? `–${k.yearEnd}` : ""}
                </td>
                <td className="py-2 pr-3 text-gray-300">{TYPE_LABELS[k.type] ?? k.type}</td>
                <td className="py-2 pr-3 text-gray-400">{k.manufacturer}</td>
                <td className="py-2 pr-3">
                  <button onClick={() => togglePublish(k)} className={`text-xs px-2 py-0.5 rounded-full ${k.isPublished ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"}`}>
                    {k.isPublished ? "✅ Sim" : "❌ Não"}
                  </button>
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(k)} className="text-[#C8A951] hover:text-[#d4b86a]"><Pencil size={15} /></button>
                    <button onClick={() => remove(k.id!)} className="text-red-500 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#333]">
              <h2 className="text-white font-bold">{editing.id ? "Editar Uniforme" : "Novo Uniforme"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Título *</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="ex: Uniforme Titular 2025" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Ano início *</label>
                  <input type="number" value={editing.yearStart} onChange={(e) => setEditing({ ...editing, yearStart: +e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Ano fim (opcional)</label>
                  <input type="number" value={editing.yearEnd ?? ""} onChange={(e) => setEditing({ ...editing, yearEnd: e.target.value ? +e.target.value : null })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Deixe vazio se for só 1 ano" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Tipo</label>
                  <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Fabricante</label>
                  <input value={editing.manufacturer} onChange={(e) => setEditing({ ...editing, manufacturer: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Nike, Topper..." />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Era / Período</label>
                <input value={editing.eraLabel} onChange={(e) => setEditing({ ...editing, eraLabel: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="ex: Era Nike, Democracia Corinthiana..." />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Imagem</label>
                {editing.imageUrl && (
                  <div className="mb-2 bg-[#111] rounded-lg p-2 flex items-center gap-3 border border-[#333]">
                    <img
                      src={editing.imageUrl}
                      alt="preview"
                      referrerPolicy="no-referrer"
                      className="h-16 w-12 object-contain flex-shrink-0"
                      onError={(e: any) => { e.currentTarget.style.opacity = "0.2"; }}
                    />
                    <span className="text-gray-500 text-xs truncate flex-1 min-w-0">{editing.imageUrl}</span>
                    <button onClick={() => setEditing({ ...editing, imageUrl: "" })} className="text-gray-600 hover:text-red-400 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm mb-2" placeholder="https://... ou faça upload abaixo" />
                <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg px-3 py-3 text-sm cursor-pointer transition-colors ${uploading ? "border-[#C8A951] opacity-60 pointer-events-none" : "border-[#444] hover:border-[#C8A951]"}`}>
                  <Upload size={15} className="text-[#C8A951]" />
                  <span className="text-gray-400">{uploading ? "Enviando..." : "Upload de imagem (JPG, PNG, WebP — máx 5MB)"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Descrição histórica</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={4} className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Crédito da imagem</label>
                  <input value={editing.sourceCredit} onChange={(e) => setEditing({ ...editing, sourceCredit: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Ordem de exibição</label>
                  <input type="number" value={editing.displayOrder ?? ""} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value ? +e.target.value : null })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPublished" checked={editing.isPublished} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
                <label htmlFor="isPublished" className="text-gray-300 text-sm">Publicado (visível no site)</label>
              </div>
            </div>
            <div className="p-5 border-t border-[#333] flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-[#333] text-white py-2 rounded-lg text-sm">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-[#C8A951] text-black font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                <Save size={14} />{saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
