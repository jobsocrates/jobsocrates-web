# 포트 3000 프로세스 종료
$p = (netstat -ano | findstr ":3000 " | Select-Object -First 1) -split "\s+" | Select-Object -Last 1
if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host "killed $p" }

# .next 캐시 삭제
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
Write-Host ".next cleared"

# 서버 재시작
Write-Host "starting..."
npm run dev
