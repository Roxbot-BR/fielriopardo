with open("/opt/fielriopardo/frontend/src/app/master/email-templates/page.tsx", "r") as f:
    content = f.read()
content = content.replace(
    ".logo-img{max-width:180px;height:auto;display:block;margin:0 auto 10px}",
    ".logo-img{width:80px;height:80px;border-radius:50%;border:3px solid #C8A951;object-fit:cover;display:block;margin:0 auto 12px}"
)
old_img = chr(60) + "img src=" + chr(34) + "https://fielriopardo.com.br/logo.jpeg" + chr(34) + " alt=" + chr(34) + "Fiel Rio Pardo" + chr(34) + " class=" + chr(34) + "logo-img" + chr(34) + ">"
new_style = "style=" + chr(34) + "width:80px;height:80px;border-radius:50%;border:3px solid #C8A951;object-fit:cover;display:block;margin:0 auto 12px" + chr(34)
new_img = chr(60) + "img src=" + chr(34) + "https://fielriopardo.com.br/logo.jpeg" + chr(34) + " alt=" + chr(34) + "Fiel Rio Pardo" + chr(34) + " " + new_style + ">"
content = content.replace(old_img, new_img)
with open("/opt/fielriopardo/frontend/src/app/master/email-templates/page.tsx", "w") as f:
    f.write(content)
print("Done email-templates/page.tsx")
