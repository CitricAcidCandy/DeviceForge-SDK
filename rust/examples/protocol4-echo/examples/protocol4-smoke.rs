use apk_plugin_sdk::{
    ReadyFrame, Request, StartFrame,
    cooperative::{CleanupOutcome, CooperativeResponse},
};
use serde_json::json;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tokio::time::timeout(Duration::from_secs(5), verify()).await??;
    println!("协议4示例验证通过：Ready/Start、回显和清理确认一致。");
    Ok(())
}

async fn verify() -> Result<(), Box<dyn std::error::Error>> {
    let (client, server) = tokio::io::duplex(8192);
    let (server_input, server_output) = tokio::io::split(server);
    let worker = tokio::spawn(deviceforge_plugin_runtime::serve_io_with_context(
        server_input,
        server_output,
        deviceforge_protocol4_echo::echo,
    ));
    let (input, mut output) = tokio::io::split(client);
    let mut input = BufReader::new(input);
    let request = Request {
        protocol_version: 4,
        request_id: "sdk-echo-example".into(),
        operation: "echo".into(),
        input: json!({ "message": "你好" }),
        artifacts: None,
    };
    output.write_all(&serde_json::to_vec(&request)?).await?;
    output.write_all(b"\n").await?;
    let mut line = String::new();
    input.read_line(&mut line).await?;
    let ready: ReadyFrame = serde_json::from_str(&line)?;
    ready.validate()?;
    if ready.request_id != request.request_id {
        return Err("Ready关联错误".into());
    }
    output
        .write_all(&serde_json::to_vec(&StartFrame::new(
            &request.request_id,
            3_000_000_000,
        ))?)
        .await?;
    output.write_all(b"\n").await?;
    line.clear();
    input.read_line(&mut line).await?;
    let response: CooperativeResponse = serde_json::from_str(&line)?;
    if response.response.protocol_version != 4
        || response.response.request_id != request.request_id
        || response.response.error.is_some()
        || response.response.result != Some(request.input)
        || response.cleanup != CleanupOutcome::Complete
    {
        return Err("回显结果或清理确认不匹配".into());
    }
    output.shutdown().await?;
    worker.await??;
    Ok(())
}
