with open("/opt/fielriopardo/frontend/src/app/page.tsx", "r") as f:
    content = f.read()
content = content.replace(href=/bolao/entrar Entrar no Bolão, href=/bolao Entrar no Bolão)
content = content.replace(href=/bolao/entrar do Bolão, href=/bolao do Bolão)
with open("/opt/fielriopardo/frontend/src/app/page.tsx", "w") as f:
    f.write(content)
print("Done page.tsx")
