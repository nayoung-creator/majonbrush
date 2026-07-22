Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
' cmd 창을 반드시 띄워서 배치 파일 실행 (bat 연결 문제 우회)
shell.CurrentDirectory = folder
shell.Run "cmd.exe /k """ & folder & "\양치챌린지_실행.bat""", 1, False
