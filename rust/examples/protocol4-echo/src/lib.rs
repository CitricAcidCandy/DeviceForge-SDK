use apk_plugin_sdk::Request;
use deviceforge_plugin_runtime::{Execution, InvocationContext};
use serde_json::json;

pub async fn echo(request: Request, context: InvocationContext) -> Execution {
    if let Err(error) = context.check() {
        return Execution::complete(Err(error.to_string()));
    }
    if request.operation != "echo" {
        return Execution::complete(Err("示例只接受 echo 操作".into()));
    }
    let Some(message) = request
        .input
        .get("message")
        .and_then(|value| value.as_str())
    else {
        return Execution::complete(Err("message 必须为字符串".into()));
    };
    if message.len() > 4096 {
        return Execution::complete(Err("message 最多为4096字节".into()));
    }
    Execution::complete(Ok(json!({ "message": message }).into()))
}
