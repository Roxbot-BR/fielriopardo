import subprocess

DB_USER = 'fielriopardo'
DB_NAME = 'fielriopardo_db'

players = [
  {"name":"Felipe Longo","imageUrl":"https://static.corinthians.com.br/uploads/174602515030588d486e7f64ccfa22798722300d15.png","position":"GK","number":1},
  {"name":"Hugo Souza","imageUrl":"https://static.corinthians.com.br/uploads/17460249976f3b2755d224d99e8f36a37690812793.png","position":"GK","number":12},
  {"name":"Kau\u00ea","imageUrl":"https://static.corinthians.com.br/uploads/177090814516f102c8aeb8c4b40d12b7fd6ddc31a7.png","position":"GK","number":93},
  {"name":"Andr\u00e9 Ramalho","imageUrl":"https://static.corinthians.com.br/uploads/17460237851bf90d4a02ed90d2a2abc1acd236e2e2.png","position":"DF","number":4},
  {"name":"Gabriel Paulista","imageUrl":"https://static.corinthians.com.br/uploads/176840182873e4030d6ed947bec8dbf16544bdd865.png","position":"DF","number":5},
  {"name":"Gustavo Henrique","imageUrl":"https://static.corinthians.com.br/uploads/1746024875295917b50b77e1a1539c9ad57a7a59b6.png","position":"DF","number":13},
  {"name":"Jo\u00e3o Pedro","imageUrl":"https://static.corinthians.com.br/uploads/1746025475cef1c3780f89c8f680755acb33beb8cc.png","position":"DF","number":14},
  {"name":"Fabrizio Angileri","imageUrl":"https://static.corinthians.com.br/uploads/17460241684f74897fa0265ad89cfa30735a749285.png","position":"DF","number":6},
  {"name":"Hugo","imageUrl":"https://static.corinthians.com.br/uploads/1746024956f8205b8766c8002f073b40955d999dd6.png","position":"DF","number":15},
  {"name":"Jo\u00e3o Vitor","imageUrl":"https://static.corinthians.com.br/uploads/17682304801986bdb20eb1d7fbf171a3e4ac7c7356.png","position":"DF","number":22},
  {"name":"Matheuzinho","imageUrl":"https://static.corinthians.com.br/uploads/17460252157791624d60ee279dcd406d157a407625.png","position":"DF","number":2},
  {"name":"Pedro Milans","imageUrl":"https://static.corinthians.com.br/uploads/17688336421cfa486ccbda4751cb279fad71831111.png","position":"DF","number":24},
  {"name":"Matheus Bidu","imageUrl":"https://static.corinthians.com.br/uploads/1746024344b751c6fabf80fb7b15a37db8379264a7.png","position":"DF","number":16},
  {"name":"Allan","imageUrl":"https://static.corinthians.com.br/uploads/1770837339da732ffcca1505e2ce5ae21c96533485.png","position":"MF","number":45},
  {"name":"Andr\u00e9","imageUrl":"https://static.corinthians.com.br/uploads/1768833423a666c393855f435b327f755c06da9dd8.png","position":"MF","number":8},
  {"name":"Andr\u00e9 Carrillo","imageUrl":"https://static.corinthians.com.br/uploads/1746024400fcf5eb5b11d3adc30c7258a49076d58e.png","position":"MF","number":17},
  {"name":"Breno Bidon","imageUrl":"https://static.corinthians.com.br/uploads/17460242974c9178c498c5b0dd9d15d1b92bfdcca7.png","position":"MF","number":18},
  {"name":"Charles","imageUrl":"https://static.corinthians.com.br/uploads/17460246091dcfb616a81ab903e262a8df840d581a.png","position":"MF","number":19},
  {"name":"Dieguinho","imageUrl":"https://static.corinthians.com.br/uploads/1768313432f1a6948a3a18a163ff6be6aeb09d14a8.png","position":"MF","number":29},
  {"name":"Gui Amorim","imageUrl":"https://static.corinthians.com.br/uploads/1768229435f591a530a4d4f283e997a77f4267ab86.png","position":"MF","number":26},
  {"name":"Luiz Gustavo","imageUrl":"https://static.corinthians.com.br/uploads/1768230579fb1d229119148890514b1bc80971064e.png","position":"MF","number":33},
  {"name":"Matheus Pereira","imageUrl":"https://static.corinthians.com.br/uploads/176859931944bb14c1b0cb35a90cfba21ebe7854d1.png","position":"MF","number":21},
  {"name":"Raniele","imageUrl":"https://static.corinthians.com.br/uploads/174602536121e5742c1276d3c9f3b8533f688645aa.png","position":"MF","number":20},
  {"name":"Rodrigo Garro","imageUrl":"https://static.corinthians.com.br/uploads/174602474203faf90b8ef5ed5b04ed826fdadef9a9.png","position":"MF","number":10},
  {"name":"Gui Neg\u00e3o","imageUrl":"https://static.corinthians.com.br/uploads/1768313494d467358575b1f761af3f3c8a2b1fe4a3.png","position":"FW","number":49},
  {"name":"Kaio C\u00e9sar","imageUrl":"https://static.corinthians.com.br/uploads/176970759222da81b12e681abf6442625bb861ec3e.png","position":"FW","number":27},
  {"name":"Kayke","imageUrl":"https://static.corinthians.com.br/uploads/17460250576d03a7143104797ceb72a8c354f55c47.png","position":"FW","number":28},
  {"name":"Labyad","imageUrl":"https://static.corinthians.com.br/uploads/177083736365a5736bc1c5fbcbc27cee280ab336bb.png","position":"FW","number":11},
  {"name":"Lingard","imageUrl":"https://static.corinthians.com.br/uploads/1772721025f19d68211b41e2a2bd75e76e5ffe8ece.png","position":"FW","number":7},
  {"name":"Memphis","imageUrl":"https://static.corinthians.com.br/uploads/17460253095eb4ceaac5b5793f989be1ec24dbc705.png","position":"FW","number":9},
  {"name":"Pedro Raul","imageUrl":"https://static.corinthians.com.br/uploads/1768228514ae389c5ee4457ab6e70ee6d1539af9ac.png","position":"FW","number":30},
  {"name":"Vitinho","imageUrl":"https://static.corinthians.com.br/uploads/17551817875bb7476d68fa61002a9a3d4a03cd1000.png","position":"FW","number":11},
  {"name":"Yuri Alberto","imageUrl":"https://static.corinthians.com.br/uploads/1746025501b5ca6edba1907b34c8f6a85b3ac2ce47.png","position":"FW","number":99},
]

def run_psql(sql):
    cmd = ['docker', 'exec', 'fiel-postgres', 'psql', '-U', DB_USER, '-d', DB_NAME, '-c', sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout, result.stderr

# Get existing player names
out, err = run_psql("SELECT name FROM players;")
existing_names = set()
for line in out.split('\n'):
    line = line.strip()
    if line and not line.startswith('-') and line != 'name' and not line.startswith('('):
        existing_names.add(line)

print(f"Existing players in DB: {len(existing_names)}")

inserted = 0
updated = 0
errors = 0

for p in players:
    name = p['name']
    img = p['imageUrl'].replace("'", "''")
    pos = p['position']
    num = p['number']
    name_escaped = name.replace("'", "''")

    if name in existing_names:
        sql = f"UPDATE players SET number={num}, position='{pos}', image_url='{img}', status='active' WHERE name='{name_escaped}';"
        out, err = run_psql(sql)
        if err.strip():
            print(f"  ERR update {name}: {err.strip()}")
            errors += 1
        else:
            updated += 1
            print(f"  Updated: {name}")
    else:
        sql = f"INSERT INTO players (name, number, position, nationality, image_url, status) VALUES ('{name_escaped}', {num}, '{pos}', 'Brasileiro', '{img}', 'active');"
        out, err = run_psql(sql)
        if err.strip():
            print(f"  ERR insert {name}: {err.strip()}")
            errors += 1
        else:
            inserted += 1
            print(f"  Inserted: {name}")

print(f"\nDone! Inserted: {inserted}, Updated: {updated}, Errors: {errors}")
