@ECHO OFF

setlocal enabledelayedexpansion

echo checking for unsupported Typescript construct

call npx eslint .
if %ERRORLEVEL% NEQ 0 (
    call powershell "[Reflection.Assembly]::LoadWithPartialName("""System.Windows.Forms""");[Windows.Forms.MessageBox]::show("""Please check the console log""", """Compilation Error""", 0, 16)" > NUL
    goto :pause
)

call npx tstl
if %ERRORLEVEL% NEQ 0 (
    call powershell "[Reflection.Assembly]::LoadWithPartialName("""System.Windows.Forms""");[Windows.Forms.MessageBox]::show("""Please check the console log""", """Compilation Error""", 0, 16)" > NUL
    goto :pause
)



robocopy script *.lua /s /V /XD .git script node_modules .vscode /XF *.ts > NUL
mkdir script\_lib\mod 2> NUL

exit /b 0

:pause
pause

exit /b 1

