with open("/opt/fielriopardo/frontend/src/app/bolao/perfil/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 4: Add maskWhatsapp function after imports
mask_func = """
function maskWhatsapp(value: string): string {
  const digits = value.replace(/\\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

"""
lines = content.split('\n')
last_import_idx = 0
for i, line in enumerate(lines):
    if line.startswith('import '):
        last_import_idx = i
lines.insert(last_import_idx + 1, mask_func)
content = '\n'.join(lines)

# Fix 4: Update whatsapp schema validation
content = content.replace(
    "whatsapp: z.string().min(10, 'WhatsApp inv\u00e1lido')",
    "whatsapp: z.string().min(14, 'WhatsApp inv\u00e1lido').regex(/^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$/, 'Formato: (19) 99999-9999')"
)

# Fix 4: Update whatsapp input to use masking
old_whatsapp = "              <Input label=\"WhatsApp\" placeholder=\"(19) 99999-9999\"\n                error={profileForm.formState.errors.whatsapp?.message}\n                {...profileForm.register('whatsapp')} />"
new_whatsapp = "              <Input label=\"WhatsApp\" type=\"tel\" placeholder=\"(19) 99999-9999\"\n                error={profileForm.formState.errors.whatsapp?.message}\n                {...profileForm.register(\"whatsapp\")}\n                onChange={(e) => {\n                  const masked = maskWhatsapp(e.target.value);\n                  e.target.value = masked;\n                  profileForm.setValue(\"whatsapp\", masked, { shouldValidate: true });\n                }}\n              />"
content = content.replace(old_whatsapp, new_whatsapp)

# Fix 7: Add birthDate display field after nick field in the profile form
old_nick_input = """                <Input label="Nick / Apelido" placeholder="Fiel123"
                  error={profileForm.formState.errors.nick?.message}
                  {...profileForm.register('nick')} />
              </div>
              <Input label="WhatsApp\""""

new_nick_input = """                <Input label="Nick / Apelido" placeholder="Fiel123"
                  error={profileForm.formState.errors.nick?.message}
                  {...profileForm.register("nick")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Data de Nascimento</label>
                <input type="date"
                  value={user?.birthDate ? user.birthDate.slice(0,10) : ""}
                  readOnly
                  className="h-10 rounded-md border border-[#3d3d3d] bg-[#1a1a1a] px-3 text-sm text-gray-500 focus:outline-none cursor-not-allowed opacity-60"
                />
                <p className="text-xs text-gray-500">Somente administradores podem alterar a data de nascimento.</p>
              </div>
              <Input label="WhatsApp\""""
content = content.replace(old_nick_input, new_nick_input)

with open("/opt/fielriopardo/frontend/src/app/bolao/perfil/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done perfil/page.tsx")
