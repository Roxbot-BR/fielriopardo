with open("/opt/fielriopardo/frontend/src/app/bolao/entrar/page.tsx", "r", encoding="utf-8") as f:
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
# Insert after the last import line
lines = content.split('\n')
last_import_idx = 0
for i, line in enumerate(lines):
    if line.startswith('import '):
        last_import_idx = i
# Insert mask_func after last import
lines.insert(last_import_idx + 1, mask_func)
content = '\n'.join(lines)

# Fix 4: Update whatsapp schema validation
content = content.replace(
    "whatsapp: z.string().min(10, 'WhatsApp inv\u00e1lido')",
    "whatsapp: z.string().min(14, 'WhatsApp inv\u00e1lido').regex(/^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$/, 'Formato: (19) 99999-9999')"
)

# Fix 2: Add isAuthenticated and authLoading to useAuth destructuring
content = content.replace(
    "const { login, register: registerUser } = useAuth();",
    "const { login, register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();"
)

# Fix 2: Add useEffect for auth redirect
auth_effect = """
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirectParam && redirectParam.startsWith("/") && !redirectParam.includes("//") ? redirectParam : "/bolao");
    }
  }, [isAuthenticated, authLoading, router, redirectParam]);

"""
content = content.replace(
    "  type RegStep = 'choose' | 'pick-nick' | 'new-nick' | 'details';",
    auth_effect + "  type RegStep = 'choose' | 'pick-nick' | 'new-nick' | 'details';"
)

# Fix 6: Add Modal import
if "Modal" not in content:
    content = content.replace(
        "import { Card, CardContent } from '@/components/ui/Card';",
        "import { Card, CardContent } from '@/components/ui/Card';\nimport { Modal } from '@/components/ui/Modal';"
    )

# Fix 6: Add forgotPassword states before loginForm
content = content.replace(
    "  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });",
    "  const [forgotOpen, setForgotOpen] = useState(false);\n  const [forgotEmail, setForgotEmail] = useState('');\n  const [forgotLoading, setForgotLoading] = useState(false);\n\n  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });"
)

# Fix 6: Add handleForgotPassword function before onLogin
forgot_handler = """
  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("Se o e-mail estiver cadastrado, voc\u00ea receber\u00e1 um link em breve.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.error("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setForgotLoading(false);
    }
  };

"""
content = content.replace(
    "  const onLogin = async (data: LoginForm) => {",
    forgot_handler + "  const onLogin = async (data: LoginForm) => {"
)

# Fix 4: Update whatsapp input in StepDetails
old_whatsapp = "      <Input label=\"WhatsApp\" placeholder=\"(19) 99999-9999\"\n        error={form.formState.errors.whatsapp?.message}\n        {...form.register('whatsapp')} />"
new_whatsapp = "      <Input label=\"WhatsApp\" type=\"tel\" placeholder=\"(19) 99999-9999\"\n        error={form.formState.errors.whatsapp?.message}\n        {...form.register(\"whatsapp\")}\n        onChange={(e) => {\n          const masked = maskWhatsapp(e.target.value);\n          e.target.value = masked;\n          form.setValue(\"whatsapp\", masked, { shouldValidate: true });\n        }}\n      />"
content = content.replace(old_whatsapp, new_whatsapp)

# Fix 6: Add "Esqueci minha senha" button after password field
old_pass = "                    error={loginForm.formState.errors.password?.message}\n                    {...loginForm.register('password')} />\n                  <Button type=\"submit\" size=\"lg\" className=\"mt-2\" disabled={isLoading}>"
new_pass = "                    error={loginForm.formState.errors.password?.message}\n                    {...loginForm.register(\"password\")} />\n                  <div className=\"text-right -mt-2\">\n                    <button type=\"button\" onClick={() => setForgotOpen(true)} className=\"text-xs text-[#C8A951] hover:underline\">\n                      Esqueci minha senha\n                    </button>\n                  </div>\n                  <Button type=\"submit\" size=\"lg\" className=\"mt-2\" disabled={isLoading}>"
content = content.replace(old_pass, new_pass)

# Fix 6: Add forgot password Modal before closing div of the main return
old_end = "        </Card>\n      </div>\n    </main>\n  );\n}"
new_end = """        </Card>
        <Modal open={forgotOpen} onOpenChange={setForgotOpen} title="Redefinir Senha">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-400">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
            <Input label="E-mail" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="w-full h-10 rounded-md bg-[#C8A951] text-black font-bold hover:bg-[#b8993f] disabled:opacity-50 transition-colors"
            >
              {forgotLoading ? "Enviando..." : "Enviar Link"}
            </button>
          </div>
        </Modal>
      </div>
    </main>
  );
}"""
content = content.replace(old_end, new_end)

with open("/opt/fielriopardo/frontend/src/app/bolao/entrar/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done entrar/page.tsx")
