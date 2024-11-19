SET RPFM_CLI="D:\programs\rpfm shit\rpfm_cli.exe"
SET PACKFILE_NAME=test.pack

rmdir /S /Q script
rmdir /S /Q build

call build_campaign.bat

mkdir build > NUL


call %RPFM_CLI% --game "warhammer_3" pack create -p .\build\%PACKFILE_NAME%
call %RPFM_CLI% --game "warhammer_3" pack add -F ".\script;script" -p .\build\%PACKFILE_NAME%




