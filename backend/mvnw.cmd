@echo off
setlocal
set MAVEN_VERSION=3.9.11
where mvn >nul 2>nul
if %ERRORLEVEL%==0 (
  mvn %*
  exit /b %ERRORLEVEL%
)
set BASE_DIR=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%
set MAVEN_HOME=%BASE_DIR%\apache-maven-%MAVEN_VERSION%
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  if not exist "%BASE_DIR%" mkdir "%BASE_DIR%"
  set ARCHIVE=%BASE_DIR%\apache-maven-%MAVEN_VERSION%-bin.zip
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest 'https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%BASE_DIR%\apache-maven-%MAVEN_VERSION%-bin.zip'; Expand-Archive -Force '%BASE_DIR%\apache-maven-%MAVEN_VERSION%-bin.zip' '%BASE_DIR%'"
)
call "%MAVEN_HOME%\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%
