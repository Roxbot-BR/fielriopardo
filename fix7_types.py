with open("/opt/fielriopardo/frontend/src/types/index.ts", "r") as f:
    content = f.read()
# Add birthDate to User interface if not present
if "birthDate" not in content:
    content = content.replace(
        "  isActive?: boolean;",
        "  isActive?: boolean;\n  birthDate?: string;"
    )
    with open("/opt/fielriopardo/frontend/src/types/index.ts", "w") as f:
        f.write(content)
    print("Added birthDate to types")
else:
    print("birthDate already in types")
