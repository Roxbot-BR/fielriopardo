with open("/opt/fielriopardo/frontend/src/app/master/users/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 5: Add password and birthDate to editForm state
old_edit_form = "  const [editForm, setEditForm] = useState({\n    fullName: '', nick: '', email: '', whatsapp: '',\n    city: '', state: 'SP', role: 'USER' as RoleName, isActive: true,\n  });"
new_edit_form = "  const [editForm, setEditForm] = useState({\n    fullName: '', nick: '', email: '', password: '', whatsapp: '',\n    city: '', state: 'SP', role: 'USER' as RoleName, isActive: true, birthDate: '',\n  });"
content = content.replace(old_edit_form, new_edit_form)

# Fix 5: In openEdit, set birthDate
old_open_edit = "    setEditForm({\n      fullName: u.fullName,\n      nick: u.nick,\n      email: u.email,\n      whatsapp: u.whatsapp ?? '',\n      city: u.city ?? '',\n      state: u.state ?? 'SP',\n      role: getRoleName(u.roles?.[0]) ?? 'USER',\n      isActive: u.isActive,\n    });"
new_open_edit = "    setEditForm({\n      fullName: u.fullName,\n      nick: u.nick,\n      email: u.email,\n      password: '',\n      whatsapp: u.whatsapp ?? '',\n      city: u.city ?? '',\n      state: u.state ?? 'SP',\n      role: getRoleName(u.roles?.[0]) ?? 'USER',\n      isActive: u.isActive,\n      birthDate: (u as any).birthDate ?? '',\n    });"
content = content.replace(old_open_edit, new_open_edit)

# Fix 5: Update saveEdit to filter empty password/birthDate
old_save_edit = "  const saveEdit = async () => {\n    if (!editTarget) return;\n    try {\n      await api.patch(`/master/users/${editTarget.id}`, editForm);"
new_save_edit = "  const saveEdit = async () => {\n    if (!editTarget) return;\n    try {\n      const payload = { ...editForm } as any;\n      if (!payload.password) delete payload.password;\n      if (!payload.birthDate) delete payload.birthDate;\n      await api.patch(`/master/users/${editTarget.id}`, payload);"
content = content.replace(old_save_edit, new_save_edit)

# Fix 5: Add password and birthDate inputs in edit modal (after email input)
old_email_input = "          <Input label=\"E-mail\" type=\"email\" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />\n          <Input label=\"WhatsApp\""
new_email_input = "          <Input label=\"E-mail\" type=\"email\" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />\n          <Input label=\"Nova Senha (deixe em branco para manter)\" type=\"password\" value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} />\n          <Input label=\"Data de Nascimento\" type=\"date\" value={editForm.birthDate} onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))} />\n          <Input label=\"WhatsApp\""
content = content.replace(old_email_input, new_email_input)

with open("/opt/fielriopardo/frontend/src/app/master/users/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done master/users/page.tsx")
