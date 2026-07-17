node -e "const b = require('C:/Users/YKing/Documents/data-tw/apps/admin/node_modules/bcryptjs'); const h=b.hashSync('admin1234',10); console.log(h)" > C:\Users\YKing\Documents\data-tw\adminhash.txt
$env:PGPASSWORD = 'postgres'
$h = Get-Content "C:\Users\YKing\Documents\data-tw\adminhash.txt" -Raw
$h = $h.Trim()
$sql = "DELETE FROM users WHERE email='admin@local'; INSERT INTO users (id, email, password_hash, role, enabled) VALUES ('u_admin1', 'admin@local', '" + $h + "', 'superadmin', true)"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d dashboard -c $sql
