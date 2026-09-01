with open("/opt/fielriopardo/backend/src/email/email.service.ts", "r") as f:
    content = f.read()
content = content.replace(
    ".logo-img{max-width:180px;height:auto;display:block;margin:0 auto 10px}",
    ".logo-img{width:80px;height:80px;border-radius:50%;border:3px solid #C8A951;object-fit:cover;display:block;margin:0 auto 12px}"
)
old_img = chr(60) + "img src=" + chr(34) + "https://fielriopardo.com.br/logo.jpeg" + chr(34) + " alt=" + chr(34) + "Fiel Rio Pardo" + chr(34) + " class=" + chr(34) + "logo-img" + chr(34) + ">"
new_img = chr(60) + "img src=" + chr(34) + "https://fielriopardo.com.br/logo.jpeg" + chr(34) + " alt=" + chr(34) + "Fiel Rio Pardo" + chr(34) + " class=" + chr(34) + "logo-img" + chr(34) + " width=" + chr(34) + "80" + chr(34) + " height=" + chr(34) + "80" + chr(34) + ">"
content = content.replace(old_img, new_img)
with open("/opt/fielriopardo/backend/src/email/email.service.ts", "w") as f:
    f.write(content)
print("Done email.service.ts")
