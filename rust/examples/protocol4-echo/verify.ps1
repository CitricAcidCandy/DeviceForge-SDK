param(
    [string]$Executable = (Join-Path $PSScriptRoot '../../../target/debug/deviceforge-protocol4-echo.exe')
)

$ErrorActionPreference = 'Stop'
$executablePath = [System.IO.Path]::GetFullPath($Executable)
if (-not (Test-Path -LiteralPath $executablePath -PathType Leaf)) {
    throw '请先构建协议4示例，再传入实际可执行文件。'
}
$start = [System.Diagnostics.ProcessStartInfo]::new()
$start.FileName = $executablePath
$start.UseShellExecute = $false
$start.CreateNoWindow = $true
$start.RedirectStandardInput = $true
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
$start.StandardInputEncoding = [System.Text.UTF8Encoding]::new($false)
$start.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
$start.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
$child = [System.Diagnostics.Process]::new()
$child.StartInfo = $start
$started = $false
$clock = [System.Diagnostics.Stopwatch]::StartNew()
function Read-ProtocolLine {
    $pending = $child.StandardOutput.ReadLineAsync()
    $remaining = 10000 - [int]$clock.ElapsedMilliseconds
    if ($remaining -le 0 -or -not $pending.Wait($remaining)) { throw '示例协议观测超过10秒。' }
    if ($null -eq $pending.Result) { throw '示例在返回完整协议帧之前关闭输出。' }
    return $pending.Result | ConvertFrom-Json
}
try {
    $started = $child.Start()
    if (-not $started) { throw '启动协议4示例失败。' }
    $errors = $child.StandardError.ReadToEndAsync()
    $requestId = 'sdk-example-' + [guid]::NewGuid().ToString('N')
    $request = @{
        protocol_version = 4
        request_id = $requestId
        operation = 'echo'
        input = @{message = '你好，独立SDK'}
    }
    $child.StandardInput.WriteLine(($request | ConvertTo-Json -Depth 5 -Compress))
    $child.StandardInput.Flush()
    $ready = Read-ProtocolLine
    if ($ready.protocol_version -ne 4 -or $ready.request_id -ne $requestId -or $ready.command -ne 'ready') {
        throw 'Ready帧的协议、关联或命令不匹配。'
    }
    $child.StandardInput.WriteLine((@{
        protocol_version = 4
        request_id = $requestId
        command = 'start'
        remaining_timeout_ns = 3000000000
    } | ConvertTo-Json -Compress))
    $child.StandardInput.Flush()
    $reply = Read-ProtocolLine
    if ($reply.cleanup -ne 'complete' -or $reply.response.protocol_version -ne 4 -or
        $reply.response.request_id -ne $requestId -or $reply.response.error -or
        $reply.response.result.message -ne $request.input.message) {
        throw '示例末帧的业务结果、关联或清理确认不匹配。'
    }
    $child.StandardInput.Close()
    $remaining = 10000 - [int]$clock.ElapsedMilliseconds
    if ($remaining -le 0 -or -not $child.WaitForExit($remaining)) { throw '示例未在原10秒期限内退出。' }
    if ($child.ExitCode -ne 0 -or $errors.GetAwaiter().GetResult().Length -ne 0) {
        throw '示例退出失败或写入了错误诊断。'
    }
    [pscustomobject]@{
        state = 'completed'
        protocol = 4
        ready_confirmed = $true
        business_result_confirmed = $true
        cleanup = $reply.cleanup
        exit_code = $child.ExitCode
    } | ConvertTo-Json -Compress
}
finally {
    if ($started -and -not $child.HasExited) {
        $child.Kill($true)
        if (-not $child.WaitForExit(2000)) { throw '本次示例子进程未能回收。' }
    }
    $child.Dispose()
}
