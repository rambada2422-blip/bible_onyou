@echo off
chcp 65001 >nul
setlocal
set "PYTHONUTF8=1"
set "REPO=%USERPROFILE%\bible-onyou-runner"
set "QUEUE_PY=%LOCALAPPDATA%\BibleOnyou\dependencies\python\Scripts\python.exe"
if not exist "%REPO%\.git" goto missing
if not exist "%QUEUE_PY%" goto missing
git -C "%REPO%" branch --show-current | findstr /x /c:"antigravity/david-week" >nul
if errorlevel 1 goto wrong_branch
git -C "%REPO%" pull --ff-only origin antigravity/david-week
if errorlevel 1 goto failed
"%QUEUE_PY%" "%REPO%\tools\onyou_queue\runner.py" status --state "%LOCALAPPDATA%\BibleOnyou"
if errorlevel 1 goto failed
powershell.exe -NoProfile -Command "$ErrorActionPreference='Stop'; $t=Get-ScheduledTask -TaskName 'BibleOnyouQueue'; if ($t.State -ne 'Running') { Start-ScheduledTask -InputObject $t }; Get-ScheduledTask -TaskName 'BibleOnyouQueue' | Select-Object TaskName,State"
if errorlevel 1 goto failed
echo 후속 작업 목록을 등록했습니다. 로그 위치는 %LOCALAPPDATA%\BibleOnyou\events.jsonl 입니다.
pause
exit /b 0
:missing
echo 초기 설치 폴더를 찾을 수 없습니다. 기존 사무실 시작 파일로 설치한 PC에서 실행하세요.
goto failed
:wrong_branch
echo 설치 폴더의 브랜치를 확인하세요. antigravity/david-week에서 업데이트할 수 있습니다.
:failed
echo 위 메시지를 확인하세요.
pause
exit /b 1
